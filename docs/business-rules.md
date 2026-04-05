# Regras de negócio — ConectaControle

## Multi-empresa

- Cada usuário pertence a **uma** empresa (`company_id` em `profiles`).
- Dados de produtos, vendas, clientes e dívidas são sempre filtrados por `company_id`.

## Papéis

- **admin**: cadastra usuários, altera configurações da empresa, acessa todos os módulos.
- **employee**: PDV, produtos, clientes, crediário e relatórios conforme política da empresa (MVP: mesmo acesso exceto gestão de usuários).

## Produtos e estoque

- Estoque é controlado por **variante** (`product_variants.quantity`).
- **Baixa de estoque** ocorre na **conclusão da venda** (checkout), na mesma operação lógica da venda.
- **Estoque baixo**: quantidade da variante ≤ limite da empresa (`companies.low_stock_threshold`, padrão configurável).

## PDV e pagamentos

- Formas: **dinheiro**, **PIX**, **cartão**, **a prazo** (fiado).
- Total da venda = soma dos itens (preço de venda × quantidade).

## Venda a prazo (fiado)

- Obrigatório vincular um **cliente**.
- Campos: **entrada** (opcional), **número de parcelas**, **datas de vencimento** (geradas automaticamente em intervalos mensais a partir da primeira data, salvo ajuste manual futuro).
- É criado um registro em `debts` e N registros em `installments`.
- Parcelas nascem com status `pending`; podem passar a `overdue` por job futuro ou por cálculo na listagem (vencimento &lt; hoje e não pagas).

## Quitação

- Ao marcar parcela como paga: status `paid`, preencher `paid_at`.

## Lembretes

- **Vence hoje**: parcelas `pending` com `due_date` = data corrente (timezone local do dispositivo; alinhar servidor futuramente).
- **Vencidas**: `pending` ou `overdue` com `due_date` &lt; hoje.
- **WhatsApp (futuro)**: canal opcional; estrutura preparada via serviço de notificações sem acoplar UI.

## Relatórios

- **Vendas do dia / mês**: filtro por `created_at` em `sales`.
- **Lucro**: soma (preço venda − preço compra) × quantidade por item vendido.
- **Produtos mais vendidos**: agregação por `sale_items` + `product_variants` / `products`.
- **Por forma de pagamento**: agrupar `sales.payment_method`.
