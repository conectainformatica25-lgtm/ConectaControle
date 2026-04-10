import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { signToken } from '../jwt.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      res.status(400).json({ error: 'missing_fields' });
      return;
    }
    const u = await pool.query(
      `SELECT id, company_id, email, password_hash, full_name, role FROM users WHERE email = $1`,
      [String(email).trim().toLowerCase()]
    );
    if (u.rowCount === 0) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    const row = u.rows[0];
    const ok = await bcrypt.compare(String(password), row.password_hash);
    if (!ok) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }
    // Atualizar last_login_at
    await pool.query(`UPDATE users SET last_login_at = now() WHERE id = $1`, [row.id]);
    const token = signToken(row.id, row.company_id);
    res.json({
      token,
      profile: {
        id: row.id,
        company_id: row.company_id,
        full_name: row.full_name,
        role: row.role,
      },
    });
  } catch (e) {
    next(e);
  }
});

authRouter.post('/register-company', async (req, res, next) => {
  const { email, password, companyName, slug, fullName } = req.body ?? {};
  console.log(`[Auth] Iniciando registro: email=${email}, company=${companyName}`);

  if (!email || !password || !companyName || !fullName) {
    console.warn('[Auth] Campos obrigatórios faltando para registro');
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  const client = await pool.connect();
  try {
    const em = String(email).trim().toLowerCase();
    const exists = await client.query(`SELECT 1 FROM users WHERE email = $1`, [em]);
    if (exists.rowCount && exists.rowCount > 0) {
      console.warn(`[Auth] Email já existe: ${em}`);
      res.status(409).json({ error: 'email_in_use' });
      return;
    }

    const hash = await bcrypt.hash(String(password), 10);
    await client.query('BEGIN');

    console.log('[Auth] Criando empresa...');
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);
    const c = await client.query(
      `INSERT INTO companies (name, slug, status, trial_ends_at) VALUES ($1, $2, 'trial', $3) RETURNING id`,
      [String(companyName).trim(), slug ? String(slug).trim() : null, trialEnds.toISOString()]
    );
    const companyId = c.rows[0].id;

    console.log(`[Auth] Criando usuário admin para empresa ${companyId}...`);
    const u = await client.query(
      `INSERT INTO users (company_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'admin') RETURNING id`,
      [companyId, em, hash, String(fullName).trim()]
    );
    const userId = u.rows[0].id;

    await client.query('COMMIT');
    console.log('[Auth] Registro concluído com sucesso');

    const token = signToken(userId, companyId);
    res.status(201).json({
      token,
      profile: {
        id: userId,
        company_id: companyId,
        full_name: fullName,
        role: 'admin',
      },
    });
  } catch (e) {
    console.error('[Auth] Erro no registro:', e);
    try {
      await client.query('ROLLBACK');
    } catch (rbErr) {
      console.error('[Auth] Falha no ROLLBACK:', rbErr);
    }
    next(e);
  } finally {
    client.release();
  }
});
