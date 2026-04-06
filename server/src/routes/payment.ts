import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, type AuthedRequest } from '../middleware/requireAuth.js';

export const paymentRouter = Router();

const PAGBANK_API = 'https://api.pagseguro.com/orders';

paymentRouter.post('/payments/pix', requireAuth, async (req, res, next) => {
  const { cid } = (req as AuthedRequest).auth;
  const { customer, items } = req.body ?? {};

  try {
    // Buscar o token no banco de dados para a empresa atual
    // Usamos aspas para respeitar o nome exato (case-sensitive) do PG se estiver em maiúsculo
    const companyResult = await pool.query('SELECT "PAGBANK_TOKEN" FROM companies WHERE id = $1', [cid]);
    const dbToken = companyResult.rows[0]?.PAGBANK_TOKEN;

    if (!dbToken) {
      res.status(400).json({ error: 'pagbank_token_not_found_in_db', message: 'Token do PagBank não configurado para esta empresa.' });
      return;
    }

    const response = await fetch(PAGBANK_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dbToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reference_id: `sub_${cid}_${Date.now()}`,
        customer: customer || {
          name: 'Cliente ConectaControle',
          email: 'contato@conectacontrole.com.br',
          tax_id: '00000000000'
        },
        items: items || [
          {
            reference_id: "plan_mensal",
            name: "Assinatura Mensal ConectaControle",
            quantity: 1,
            unit_amount: 3999
          }
        ],
        qr_codes: [
          {
            amount: {
              value: 3999
            }
          }
        ]
      })
    });

    const data = await response.json();
    if (response.ok) {
      res.json(data);
    } else {
      console.error('PagBank Error:', data);
      res.status(response.status).json(data);
    }
  } catch (error) {
    next(error);
  }
});

paymentRouter.get('/payments/pix/status/:orderId', requireAuth, async (req, res, next) => {
  const { cid } = (req as AuthedRequest).auth;
  const { orderId } = req.params;

  try {
    // Buscar o token no banco de dados para a empresa atual
    const companyResult = await pool.query('SELECT "PAGBANK_TOKEN" FROM companies WHERE id = $1', [cid]);
    const dbToken = companyResult.rows[0]?.PAGBANK_TOKEN;

    if (!dbToken) {
      res.status(400).json({ error: 'pagbank_token_not_found_in_db' });
      return;
    }

    const response = await fetch(`${PAGBANK_API}/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${dbToken}`,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();
    if (response.ok) {
      // Check if PAID
      if (data.status === 'PAID') {
        // Update company subscription
        const newExpiry = new Date();
        newExpiry.setDate(newExpiry.getDate() + 30);

        await pool.query(
          `UPDATE companies SET 
             status = 'active', 
             expires_at = $1 
           WHERE id = $2`,
          [newExpiry.toISOString(), cid]
        );
        
        res.json({ status: 'PAID', company_updated: true });
      } else {
        res.json({ status: data.status || 'PENDING' });
      }
    } else {
      res.status(response.status).json(data);
    }
  } catch (error) {
    next(error);
  }
});
