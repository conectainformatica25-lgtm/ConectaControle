import { Router, type Request, type Response, type NextFunction } from 'express';
import { pool } from '../db.js';

export const adminRouter = Router();

const ADMIN_USER = 'admin';
const ADMIN_PASS = process.env.ADMIN_SECRET ?? '181995';

// ── Middleware: validar x-admin-secret header ──────────────────────
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const secret = req.headers['x-admin-secret'] as string | undefined;
  if (!secret || secret !== ADMIN_PASS) {
    res.status(401).json({ error: 'unauthorized', message: 'Credencial admin inválida.' });
    return;
  }
  next();
}

// ── POST /admin/login ──────────────────────────────────────────────
adminRouter.post('/admin/login', (req: Request, res: Response) => {
  const { user, password } = req.body ?? {};
  if (user === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ ok: true, token: ADMIN_PASS }); // token simples = a própria senha
    return;
  }
  res.status(401).json({ error: 'invalid_credentials' });
});

// ── GET /admin/companies ───────────────────────────────────────────
adminRouter.get('/admin/companies', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        c.slug,
        c.status,
        c.created_at,
        c.trial_ends_at,
        c.expires_at,
        c.admin_blocked,
        (SELECT COUNT(*)::int FROM users u WHERE u.company_id = c.id) AS total_users,
        (SELECT COUNT(*)::int FROM products p WHERE p.company_id = c.id) AS total_products,
        (SELECT COUNT(*)::int FROM sales s WHERE s.company_id = c.id) AS total_sales,
        (SELECT MAX(u2.last_login_at) FROM users u2 WHERE u2.company_id = c.id) AS last_activity
      FROM companies c
      ORDER BY c.created_at DESC
    `);

    const now = new Date();
    const companies = result.rows.map((row: any) => {
      let referenceDate: Date | null = null;
      if (row.status === 'trial' && row.trial_ends_at) {
        referenceDate = new Date(row.trial_ends_at);
      } else if (row.expires_at) {
        referenceDate = new Date(row.expires_at);
      }

      const diffMs = referenceDate ? referenceDate.getTime() - now.getTime() : 0;
      const daysRemaining = referenceDate ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;

      return {
        ...row,
        days_remaining: daysRemaining,
        is_expired: daysRemaining <= 0 && row.status !== 'active',
      };
    });

    res.json({ companies });
  } catch (err) {
    console.error('[Admin] Erro ao listar empresas:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ── POST /admin/companies/:id/block ────────────────────────────────
adminRouter.post('/admin/companies/:id/block', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE companies SET admin_blocked = true WHERE id = $1`,
      [id]
    );
    res.json({ ok: true, message: 'Empresa bloqueada com sucesso.' });
  } catch (err) {
    console.error('[Admin] Erro ao bloquear empresa:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ── POST /admin/companies/:id/unblock ──────────────────────────────
adminRouter.post('/admin/companies/:id/unblock', requireAdmin, async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query(
      `UPDATE companies SET admin_blocked = false WHERE id = $1`,
      [id]
    );
    res.json({ ok: true, message: 'Empresa desbloqueada com sucesso.' });
  } catch (err) {
    console.error('[Admin] Erro ao desbloquear empresa:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// ── GET /admin/stats ───────────────────────────────────────────────
adminRouter.get('/admin/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const r = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'active' AND admin_blocked = false)::int AS active,
        COUNT(*) FILTER (WHERE status = 'trial' AND admin_blocked = false)::int AS trial,
        COUNT(*) FILTER (WHERE status = 'overdue' OR admin_blocked = true)::int AS blocked_or_overdue
      FROM companies
    `);
    res.json(r.rows[0]);
  } catch (err) {
    console.error('[Admin] Erro ao buscar stats:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});
