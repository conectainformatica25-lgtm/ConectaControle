# Fluxos de API / serviços

Camada em `services/*` usando cliente Supabase. Fluxos abaixo respeitam `docs/business-rules.md`.

## 1. Login

1. `auth.signInWithPassword({ email, password })`
2. Buscar `profiles` onde `id = session.user.id`
3. Persistir sessão + `company_id` + `role` no store (Zustand + SecureStore opcional)

## 2. Cadastro de empresa + primeiro admin

1. `auth.signUp({ email, password })`
2. Chamar RPC `register_company` com `{ company_name, slug, full_name }`  
   - Cria `companies`, insere `profiles` com `role = admin`

## 3. Cadastro de usuário (admin)

1. `auth.signUp` ou convite (futuro)
2. Inserir `profiles` com `company_id` do admin e `role = employee`  
   (MVP: signup com mesmo domínio ou fluxo manual documentado no app)

## 4. Venda à vista

1. Montar carrinho no cliente (Zustand).
2. Chamar RPC `process_sale` com itens, `payment_method` ∈ { cash, pix, card }, `customer_id` opcional.
3. Servidor: insere `sales`, `sale_items`, decrementa `product_variants.quantity`.

## 5. Venda a prazo

1. Exige `customer_id`, `down_payment`, parcelas (valor/datas).
2. RPC `process_sale` com `payment_method = credit` + payload de fiado.
3. Cria `debts` + `installments`; estoque baixa como na venda à vista.

## 6. Marcar parcela como paga

1. `UPDATE installments SET status = 'paid', paid_at = now() WHERE id = ?`  
   com RLS garantindo mesma empresa via `debts` → `company_id`.

## 7. Consultas de lembretes

- Parcelas com `due_date = current_date` e `status = pending`.
- Parcelas com `due_date < current_date` e `status IN (pending, overdue)`.

## Variáveis de ambiente

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
