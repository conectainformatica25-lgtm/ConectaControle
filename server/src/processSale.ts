import type { PoolClient } from 'pg';

export type SaleItemIn = {
  variant_id: string;
  qty: number;
  unit_sale_price: number;
  unit_purchase_price: number;
};

export type CreditIn = {
  principal: number;
  down_payment: number;
  installments: { installment_number: number; amount: number; due_date: string }[];
};

export async function processSaleTx(
  client: PoolClient,
  params: {
    companyId: string;
    userId: string;
    payment_method: string;
    customer_id: string | null;
    items: SaleItemIn[];
    credit: CreditIn | null;
  }
): Promise<string> {
  const { companyId, userId, payment_method, customer_id, items, credit } = params;

  if (payment_method === 'credit' && (!customer_id || !credit)) {
    throw new Error('credit_requires_customer_and_plan');
  }

  let total = 0;
  for (const it of items) {
    total += it.qty * it.unit_sale_price;
  }

  const saleIns = await client.query(
    `INSERT INTO sales (company_id, user_id, customer_id, total, payment_method)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [
      companyId,
      userId,
      payment_method === 'credit' ? customer_id : null,
      total,
      payment_method,
    ]
  );
  const saleId = saleIns.rows[0].id as string;

  for (const it of items) {
    const vr = await client.query(
      `SELECT * FROM product_variants WHERE id = $1 AND company_id = $2`,
      [it.variant_id, companyId]
    );
    if (vr.rowCount === 0) throw new Error('variant_not_found');
    const v = vr.rows[0];
    if (Number(v.quantity) < it.qty) throw new Error('insufficient_stock');

    await client.query(
      `INSERT INTO sale_items (sale_id, product_variant_id, quantity, unit_sale_price, unit_purchase_price)
       VALUES ($1, $2, $3, $4, $5)`,
      [saleId, it.variant_id, it.qty, it.unit_sale_price, it.unit_purchase_price]
    );
    await client.query(`UPDATE product_variants SET quantity = quantity - $1 WHERE id = $2`, [
      it.qty,
      it.variant_id,
    ]);
  }

  if (payment_method === 'credit' && credit && customer_id) {
    const d = await client.query(
      `INSERT INTO debts (company_id, sale_id, customer_id, principal, down_payment)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [companyId, saleId, customer_id, credit.principal, credit.down_payment]
    );
    const debtId = d.rows[0].id as string;
    for (const ins of credit.installments) {
      await client.query(
        `INSERT INTO installments (debt_id, installment_number, amount, due_date, status)
         VALUES ($1, $2, $3, $4, 'pending')`,
        [debtId, ins.installment_number, ins.amount, ins.due_date]
      );
    }
  }

  return saleId;
}
