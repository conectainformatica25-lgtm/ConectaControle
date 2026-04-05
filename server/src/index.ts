import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { productsRouter } from './routes/products.js';
import { customersRouter } from './routes/customers.js';
import { salesRouter } from './routes/sales.js';
import { debtsRouter } from './routes/debts.js';
import { companyRouter } from './routes/company.js';
import { reportsRouter } from './routes/reports.js';

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/', (_req, res) => res.send('ConectaControle API is running! Check /health for status.'));
app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api', authRouter);
app.use('/api', meRouter);
app.use('/api', productsRouter);
app.use('/api', customersRouter);
app.use('/api', salesRouter);
app.use('/api', debtsRouter);
app.use('/api', companyRouter);
app.use('/api', reportsRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'internal_error' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`ConectaControle API em http://0.0.0.0:${port}`);
});
