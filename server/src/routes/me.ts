import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const meRouter = Router();

meRouter.get('/me', requireAuth, async (req, res) => {
  const { sub, cid } = (req as AuthedRequest).auth;
  const u = await pool.query(
    `SELECT id, company_id, full_name, role FROM users WHERE id = $1 AND company_id = $2`,
    [sub, cid]
  );
  if (u.rowCount === 0) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const row = u.rows[0];
  const c = await pool.query(`SELECT * FROM companies WHERE id = $1`, [cid]);
  res.json({
    profile: {
      id: row.id,
      company_id: row.company_id,
      full_name: row.full_name,
      role: row.role,
    },
    company: c.rows[0],
  });
});
