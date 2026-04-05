# Estrutura do banco (PostgreSQL / Supabase)

Todas as tabelas de negócio incluem `company_id uuid NOT NULL` referenciando `companies(id)`, exceto quando a linha é derivada de outra tabela que já garante o vínculo (ex.: `sale_items` via `sales`).

## Tabelas

### companies

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| name | text | Nome fantasia |
| slug | text UNIQUE | Identificador legível |
| brand_primary | text NULL | Cor primária (hex) multi-empresa |
| brand_secondary | text NULL | Cor secundária |
| low_stock_threshold | int DEFAULT 5 | Alerta de estoque baixo |
| created_at | timestamptz | |

### profiles (usuários do app)

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK FK → auth.users(id) | |
| company_id | uuid FK | |
| full_name | text | |
| role | text | `admin` \| `employee` |
| created_at | timestamptz | |

### products

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| company_id | uuid FK | |
| name | text | |
| category | text | |
| purchase_price | numeric(14,2) | Preço de compra |
| sale_price | numeric(14,2) | Preço base venda (variante pode divergir) |
| created_at | timestamptz | |

### product_variants

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| company_id | uuid FK | Redundância para RLS |
| product_id | uuid FK → products | |
| size_label | text NULL | Tamanho |
| color_label | text NULL | Cor |
| quantity | int NOT NULL DEFAULT 0 | Estoque |
| sale_price | numeric(14,2) NULL | Se null, usa produto.sale_price |

### customers

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| company_id | uuid FK | |
| name | text | |
| phone | text | |
| created_at | timestamptz | |

### sales

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| company_id | uuid FK | |
| user_id | uuid FK → profiles(id) | Quem registrou |
| customer_id | uuid NULL FK | Obrigatório se payment = credit |
| total | numeric(14,2) | |
| payment_method | text | `cash` \| `pix` \| `card` \| `credit` |
| created_at | timestamptz | |

### sale_items

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| sale_id | uuid FK → sales | |
| product_variant_id | uuid FK | |
| quantity | int | |
| unit_sale_price | numeric(14,2) | Snapshot do preço |
| unit_purchase_price | numeric(14,2) | Snapshot para lucro |

### debts

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| company_id | uuid FK | |
| sale_id | uuid FK UNIQUE | Uma dívida por venda fiado |
| customer_id | uuid FK | |
| principal | numeric(14,2) | Valor fiado (após entrada) |
| down_payment | numeric(14,2) DEFAULT 0 | Entrada |

### installments

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid PK | |
| debt_id | uuid FK → debts | |
| installment_number | int | |
| amount | numeric(14,2) | |
| due_date | date | |
| status | text | `pending` \| `paid` \| `overdue` |
| paid_at | timestamptz NULL | |

## Índices sugeridos

- `(company_id)` em todas as tabelas de negócio.
- `(company_id, created_at)` em `sales`.
- `(due_date)` em `installments` (filtrar lembretes).

## RLS

Políticas: permitir `SELECT/INSERT/UPDATE/DELETE` apenas quando `company_id` na linha coincide com `company_id` do `profiles` do `auth.uid()`.

Funções `SECURITY DEFINER` (ex.: `register_company`, `process_sale`) validam `auth.uid()` e mantêm consistência.
