import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const reportsRouter = Router();

reportsRouter.get('/reports/sales-total', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const { from, to } = req.query;
  if (!from || !to) {
    res.status(400).json({ error: 'missing_range' });
    return;
  }
  const r = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS t FROM sales WHERE company_id = $1 AND created_at >= $2 AND created_at <= $3`,
    [cid, from, to]
  );
  res.json({ total: Number(r.rows[0].t) });
});

reportsRouter.get('/reports/summary', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const { from, to } = req.query;
  if (!from || !to) {
    res.status(400).json({ error: 'missing_range' });
    return;
  }
  const byPay = await pool.query(
    `SELECT payment_method, SUM(total) AS s FROM sales
     WHERE company_id = $1 AND created_at >= $2 AND created_at <= $3
     GROUP BY payment_method`,
    [cid, from, to]
  );
  const byPayment: Record<string, number> = {};
  for (const row of byPay.rows) {
    byPayment[row.payment_method as string] = Number(row.s);
  }

  const saleIds = await pool.query(
    `SELECT id FROM sales WHERE company_id = $1 AND created_at >= $2 AND created_at <= $3`,
    [cid, from, to]
  );
  const ids = saleIds.rows.map((r) => r.id);
  let revenue = 0;
  let cost = 0;
  const qtyByVariant = new Map<string, number>();
  if (ids.length) {
    const items = await pool.query(
      `SELECT product_variant_id, quantity, unit_sale_price, unit_purchase_price
       FROM sale_items WHERE sale_id = ANY($1::uuid[])`,
      [ids]
    );
    for (const it of items.rows) {
      const q = Number(it.quantity);
      revenue += q * Number(it.unit_sale_price);
      cost += q * Number(it.unit_purchase_price);
      const vid = it.product_variant_id as string;
      qtyByVariant.set(vid, (qtyByVariant.get(vid) ?? 0) + q);
    }
  }

  const vids = [...qtyByVariant.keys()];
  const top: { name: string; qty: number }[] = [];
  if (vids.length) {
    const vars = await pool.query(`SELECT id, product_id FROM product_variants WHERE id = ANY($1::uuid[])`, [
      vids,
    ]);
    const pids = [...new Set(vars.rows.map((v) => v.product_id as string))];
    const prods = await pool.query(`SELECT id, name FROM products WHERE id = ANY($1::uuid[])`, [pids]);
    const nameByProduct = new Map(prods.rows.map((p) => [p.id as string, p.name as string]));
    for (const v of vars.rows) {
      const name = nameByProduct.get(v.product_id as string) ?? '?';
      top.push({ name, qty: qtyByVariant.get(v.id as string) ?? 0 });
    }
    top.sort((a, b) => b.qty - a.qty);
  }

  res.json({
    byPayment,
    profit: { revenue, cost, profit: revenue - cost },
    topProducts: top.slice(0, 10),
  });
});
