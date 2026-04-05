-- PostgreSQL no seu servidor (sem Supabase).
-- Criar banco: CREATE DATABASE conectacontrole;
-- Depois: psql -U postgres -d conectacontrole -f postgres_standalone.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  brand_primary text,
  brand_secondary text,
  low_stock_threshold int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies (id) ON DELETE RESTRICT,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin', 'employee')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_company ON users (company_id);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL DEFAULT 'Geral',
  purchase_price numeric(14, 2) NOT NULL DEFAULT 0,
  sale_price numeric(14, 2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  size_label text,
  color_label text,
  quantity int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  sale_price numeric(14, 2)
);

CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users (id),
  customer_id uuid REFERENCES customers (id),
  total numeric(14, 2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'pix', 'card', 'credit')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL REFERENCES sales (id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES product_variants (id),
  quantity int NOT NULL CHECK (quantity > 0),
  unit_sale_price numeric(14, 2) NOT NULL,
  unit_purchase_price numeric(14, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  sale_id uuid NOT NULL UNIQUE REFERENCES sales (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customers (id),
  principal numeric(14, 2) NOT NULL,
  down_payment numeric(14, 2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id uuid NOT NULL REFERENCES debts (id) ON DELETE CASCADE,
  installment_number int NOT NULL,
  amount numeric(14, 2) NOT NULL,
  due_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at timestamptz,
  UNIQUE (debt_id, installment_number)
);

CREATE INDEX IF NOT EXISTS idx_products_company ON products (company_id);
CREATE INDEX IF NOT EXISTS idx_variants_company ON product_variants (company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company ON customers (company_id);
CREATE INDEX IF NOT EXISTS idx_sales_company_created ON sales (company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_installments_due ON installments (due_date);
