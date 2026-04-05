-- ConectaControle — schema inicial + RLS + RPCs
-- Executar no SQL Editor do Supabase ou via CLI

create extension if not exists "pgcrypto";

-- Companies
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  brand_primary text,
  brand_secondary text,
  low_stock_threshold int not null default 5,
  created_at timestamptz not null default now()
);

-- Profiles (app users)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete restrict,
  full_name text,
  role text not null check (role in ('admin', 'employee')),
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  category text not null default 'Geral',
  purchase_price numeric(14, 2) not null default 0,
  sale_price numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  size_label text,
  color_label text,
  quantity int not null default 0 check (quantity >= 0),
  sale_price numeric(14, 2)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  name text not null,
  phone text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references public.profiles (id),
  customer_id uuid references public.customers (id),
  total numeric(14, 2) not null,
  payment_method text not null check (payment_method in ('cash', 'pix', 'card', 'credit')),
  created_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_variant_id uuid not null references public.product_variants (id),
  quantity int not null check (quantity > 0),
  unit_sale_price numeric(14, 2) not null,
  unit_purchase_price numeric(14, 2) not null default 0
);

create table if not exists public.debts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  sale_id uuid not null unique references public.sales (id) on delete cascade,
  customer_id uuid not null references public.customers (id),
  principal numeric(14, 2) not null,
  down_payment numeric(14, 2) not null default 0
);

create table if not exists public.installments (
  id uuid primary key default gen_random_uuid(),
  debt_id uuid not null references public.debts (id) on delete cascade,
  installment_number int not null,
  amount numeric(14, 2) not null,
  due_date date not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'overdue')),
  paid_at timestamptz,
  unique (debt_id, installment_number)
);

create index if not exists idx_products_company on public.products (company_id);
create index if not exists idx_variants_company on public.product_variants (company_id);
create index if not exists idx_customers_company on public.customers (company_id);
create index if not exists idx_sales_company_created on public.sales (company_id, created_at desc);
create index if not exists idx_installments_due on public.installments (due_date);

-- Helper: company of current user
create or replace function public.current_company_id() returns uuid
language sql stable security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

-- RLS
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.customers enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.debts enable row level security;
alter table public.installments enable row level security;

create policy companies_select on public.companies for select using (id = public.current_company_id());
create policy companies_update on public.companies for update
  using (id = public.current_company_id())
  with check (id = public.current_company_id());

create policy profiles_select on public.profiles for select using (
  id = auth.uid() or company_id = public.current_company_id()
);
create policy profiles_update_self on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy products_all on public.products for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
create policy variants_all on public.product_variants for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
create policy customers_all on public.customers for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
create policy sales_all on public.sales for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy sale_items_all on public.sale_items for all using (
  exists (select 1 from public.sales s where s.id = sale_id and s.company_id = public.current_company_id())
)
with check (
  exists (select 1 from public.sales s where s.id = sale_id and s.company_id = public.current_company_id())
);

create policy debts_all on public.debts for all
  using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
create policy installments_all on public.installments for all using (
  exists (select 1 from public.debts d where d.id = debt_id and d.company_id = public.current_company_id())
)
with check (
  exists (select 1 from public.debts d where d.id = debt_id and d.company_id = public.current_company_id())
);

-- RPC: primeira empresa + perfil admin
create or replace function public.register_company(
  p_company_name text,
  p_slug text,
  p_full_name text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'profile_exists';
  end if;
  insert into public.companies (name, slug)
  values (p_company_name, nullif(trim(p_slug), ''))
  returning id into v_company_id;
  insert into public.profiles (id, company_id, full_name, role)
  values (v_uid, v_company_id, p_full_name, 'admin');
  return v_company_id;
end;
$$;

grant execute on function public.register_company(text, text, text) to authenticated;

-- RPC: checkout atômico
create or replace function public.process_sale(
  p_payment_method text,
  p_customer_id uuid,
  p_items jsonb,
  p_credit jsonb default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_user_id uuid;
  v_sale_id uuid;
  v_total numeric := 0;
  item jsonb;
  v_qty int;
  v_variant public.product_variants%rowtype;
  v_debt_id uuid;
  ins jsonb;
  v_unit_sale numeric;
  v_unit_buy numeric;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;
  select company_id into v_company_id from public.profiles where id = v_user_id;
  if v_company_id is null then
    raise exception 'no_profile';
  end if;

  if p_payment_method = 'credit' then
    if p_customer_id is null or p_credit is null then
      raise exception 'credit_requires_customer_and_plan';
    end if;
  end if;

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_total := v_total + (item->>'qty')::numeric * (item->>'unit_sale_price')::numeric;
  end loop;

  insert into public.sales (company_id, user_id, customer_id, total, payment_method)
  values (
    v_company_id,
    v_user_id,
    case when p_payment_method = 'credit' then p_customer_id else null end,
    v_total,
    p_payment_method
  )
  returning id into v_sale_id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := (item->>'qty')::int;
    v_unit_sale := (item->>'unit_sale_price')::numeric;
    v_unit_buy := coalesce((item->>'unit_purchase_price')::numeric, 0);
    select * into v_variant from public.product_variants
    where id = (item->>'variant_id')::uuid and company_id = v_company_id;
    if not found then
      raise exception 'variant_not_found';
    end if;
    if v_variant.quantity < v_qty then
      raise exception 'insufficient_stock';
    end if;
    insert into public.sale_items (sale_id, product_variant_id, quantity, unit_sale_price, unit_purchase_price)
    values (v_sale_id, v_variant.id, v_qty, v_unit_sale, v_unit_buy);
    update public.product_variants
    set quantity = quantity - v_qty
    where id = v_variant.id;
  end loop;

  if p_payment_method = 'credit' and p_credit is not null then
    insert into public.debts (company_id, sale_id, customer_id, principal, down_payment)
    values (
      v_company_id,
      v_sale_id,
      p_customer_id,
      (p_credit->>'principal')::numeric,
      coalesce((p_credit->>'down_payment')::numeric, 0)
    )
    returning id into v_debt_id;
    for ins in select * from jsonb_array_elements(p_credit->'installments')
    loop
      insert into public.installments (debt_id, installment_number, amount, due_date, status)
      values (
        v_debt_id,
        (ins->>'installment_number')::int,
        (ins->>'amount')::numeric,
        (ins->>'due_date')::date,
        'pending'
      );
    end loop;
  end if;

  return v_sale_id;
end;
$$;

grant execute on function public.process_sale(text, uuid, jsonb, jsonb) to authenticated;
