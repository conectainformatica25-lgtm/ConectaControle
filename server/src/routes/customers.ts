import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const customersRouter = Router();

customersRouter.get('/customers', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const r = await pool.query(`SELECT * FROM customers WHERE company_id = $1 ORDER BY name`, [cid]);
  res.json({ items: r.rows });
});

customersRouter.post('/customers', requireAuth, async (req, res) => {
  const { cid } = (req as AuthedRequest).auth;
  const { name, phone } = req.body ?? {};
  if (!name) {
    res.status(400).json({ error: 'missing_name' });
    return;
  }
  const r = await pool.query(
    `INSERT INTO customers (company_id, name, phone) VALUES ($1, $2, $3) RETURNING id`,
    [cid, String(name).trim(), String(phone ?? '')]
  );
  res.status(201).json({ id: r.rows[0].id });
});
