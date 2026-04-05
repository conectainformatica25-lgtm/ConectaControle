import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const productsRouter = Router();

productsRouter.get('/products', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const p = await pool.query(
    `SELECT * FROM products WHERE company_id = $1 ORDER BY name`,
    [cid]
  );
  const v = await pool.query(`SELECT * FROM product_variants WHERE company_id = $1`, [cid]);
  const vmap = new Map<string, unknown[]>();
  for (const row of v.rows) {
    const pid = row.product_id as string;
    const arr = vmap.get(pid) ?? [];
    arr.push(row);
    vmap.set(pid, arr);
  }
  const items = p.rows.map((row) => ({
    ...row,
    variants: vmap.get(row.id as string) ?? [],
  }));
  res.json({ items });
});

productsRouter.post('/products', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const { name, category, purchase_price, sale_price, variants } = req.body ?? {};
  if (!name || !variants?.length) {
    res.status(400).json({ error: 'invalid_body' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const pr = await client.query(
      `INSERT INTO products (company_id, name, category, purchase_price, sale_price)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [cid, name, category ?? 'Geral', purchase_price ?? 0, sale_price ?? 0]
    );
    const productId = pr.rows[0].id;
    for (const v of variants) {
      await client.query(
        `INSERT INTO product_variants (company_id, product_id, size_label, color_label, quantity, sale_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          cid,
          productId,
          v.size_label ?? null,
          v.color_label ?? null,
          v.quantity ?? 0,
          v.sale_price ?? null,
        ]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({ id: productId });
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
});
