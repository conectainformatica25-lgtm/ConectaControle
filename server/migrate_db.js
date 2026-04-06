import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;
const connectionString = process.env.DATABASE_URL;

async function migrate() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Migrating database...');
    await client.query(`
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'overdue')),
      ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
      ADD COLUMN IF NOT EXISTS expires_at timestamptz,
      ADD COLUMN IF NOT EXISTS "PAGBANK_TOKEN" text;
    `);
    console.log('Migration completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}
migrate();
