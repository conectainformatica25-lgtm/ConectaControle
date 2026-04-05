import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';
import { processSaleTx } from '../processSale.js';

export const salesRouter = Router();

salesRouter.post('/sales/process', requireAuth, async (req, res) => {
  const { sub, cid } = (req as AuthedRequest).auth;
  const { payment_method, customer_id, items, credit } = req.body ?? {};
  if (!payment_method || !items?.length) {
    res.status(400).json({ error: 'invalid_body' });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const saleId = await processSaleTx(client, {
      companyId: cid,
      userId: sub,
      payment_method,
      customer_id: customer_id ?? null,
      items,
      credit: credit ?? null,
    });
    await client.query('COMMIT');
    res.json({ saleId });
  } catch (e: unknown) {
    await client.query('ROLLBACK');
    const msg = e instanceof Error ? e.message : 'error';
    res.status(400).json({ error: msg });
  } finally {
    client.release();
  }
});
