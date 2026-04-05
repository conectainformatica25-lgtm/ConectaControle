import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const debtsRouter = Router();

debtsRouter.get('/installments', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const inst = await pool.query(
    `SELECT i.* FROM installments i
     INNER JOIN debts d ON d.id = i.debt_id
     WHERE d.company_id = $1`,
    [cid]
  );
  const debtRows = await pool.query(`SELECT id, customer_id FROM debts WHERE company_id = $1`, [cid]);
  const customerIds = [...new Set(debtRows.rows.map((r) => r.customer_id as string))];
  const custMap = new Map<string, string>();
  if (customerIds.length) {
    const c = await pool.query(`SELECT id, name FROM customers WHERE company_id = $1 AND id = ANY($2)`, [
      cid,
      customerIds,
    ]);
    for (const row of c.rows) custMap.set(row.id as string, row.name as string);
  }
  const debtToCustomer = new Map(debtRows.rows.map((r) => [r.id as string, r.customer_id as string]));

  const rows = inst.rows.map((i) => {
    const custId = debtToCustomer.get(i.debt_id as string);
    return {
      id: i.id,
      debt_id: i.debt_id,
      installment_number: i.installment_number,
      amount: i.amount,
      due_date: i.due_date,
      status: i.status,
      paid_at: i.paid_at,
      customer_name: custId ? custMap.get(custId) : undefined,
    };
  });
  res.json({ items: rows });
});

debtsRouter.patch('/installments/:id/pay', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const { id } = req.params;
  const chk = await pool.query(
    `SELECT i.id FROM installments i
     JOIN debts d ON d.id = i.debt_id
     WHERE i.id = $1 AND d.company_id = $2`,
    [id, cid]
  );
  if (chk.rowCount === 0) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  await pool.query(`UPDATE installments SET status = 'paid', paid_at = now() WHERE id = $1`, [id]);
  res.json({ ok: true });
});
