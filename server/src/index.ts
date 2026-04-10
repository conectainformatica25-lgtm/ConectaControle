import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { productsRouter } from './routes/products.js';
import { customersRouter } from './routes/customers.js';
import { salesRouter } from './routes/sales.js';
import { debtsRouter } from './routes/debts.js';
import { companyRouter } from './routes/company.js';
import { reportsRouter } from './routes/reports.js';
import { paymentRouter } from './routes/payment.js';
import { adminRouter } from './routes/admin.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);

// Servir arquivos estáticos do painel admin
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolvedAdminPath = path.join(__dirname, '..', 'public', 'admin');

app.use('/admin', express.static(resolvedAdminPath));

// Fallback para garantir que /admin sirva o index.html
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(resolvedAdminPath, 'index.html'));
});

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));
app.use(express.json({ limit: '2mb' }));


app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.send('ConectaControle API is running! Database is CONNECTED. Check /health for status.');
  } catch (err) {
    console.error('Database connection failed on / root:', err);
    res.status(500).send('ConectaControle API is running but DATABASE IS DISCONNECTED!');
  }
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'connected' });
  } catch (err) {
    res.status(500).json({ ok: false, db: 'disconnected', error: String(err) });
  }
});

app.use('/api', authRouter);
app.use('/api', meRouter);
app.use('/api', productsRouter);
app.use('/api', customersRouter);
app.use('/api', salesRouter);
app.use('/api', debtsRouter);
app.use('/api', companyRouter);
app.use('/api', reportsRouter);
app.use('/api', paymentRouter);
app.use('/api', adminRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

// ── Auto-migração: adiciona colunas novas se não existirem ─────────
async function runMigrations() {
  try {
    console.log('[Migrations] Verificando colunas...');
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='status') THEN
          ALTER TABLE companies ADD COLUMN status text NOT NULL DEFAULT 'trial';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='trial_ends_at') THEN
          ALTER TABLE companies ADD COLUMN trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='expires_at') THEN
          ALTER TABLE companies ADD COLUMN expires_at timestamptz;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='admin_blocked') THEN
          ALTER TABLE companies ADD COLUMN admin_blocked boolean NOT NULL DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
          ALTER TABLE users ADD COLUMN last_login_at timestamptz;
        END IF;
      END $$;
    `);
    console.log('[Migrations] ✅ Colunas verificadas/adicionadas com sucesso.');
  } catch (err) {
    console.error('[Migrations] ❌ Erro ao rodar migrações:', err);
  }
}

// Rodar migrações e depois iniciar o servidor
runMigrations().then(() => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`ConectaControle API em http://0.0.0.0:${port}`);
  });
});
