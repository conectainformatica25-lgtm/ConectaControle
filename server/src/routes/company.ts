import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const companyRouter = Router();

companyRouter.patch('/company', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const { brand_primary, brand_secondary, low_stock_threshold } = req.body ?? {};
  await pool.query(
    `UPDATE companies SET
       brand_primary = COALESCE($2, brand_primary),
       brand_secondary = COALESCE($3, brand_secondary),
       low_stock_threshold = COALESCE($4, low_stock_threshold)
     WHERE id = $1`,
    [cid, brand_primary ?? null, brand_secondary ?? null, low_stock_threshold ?? null]
  );
  const c = await pool.query(`SELECT * FROM companies WHERE id = $1`, [cid]);
  res.json({ company: c.rows[0] });
});

companyRouter.get('/profiles', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const r = await pool.query(
    `SELECT id, full_name, role FROM users WHERE company_id = $1 ORDER BY created_at`,
    [cid]
  );
  res.json({ items: r.rows });
});
