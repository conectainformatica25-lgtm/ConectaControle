import pg from 'pg';
import 'dotenv/config';

const { Client } = pg;

async function run() {
  const c = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await c.connect();
    const r = await c.query('SELECT id, name, "PAGBANK_TOKEN" FROM companies');
    console.log("Companies:", r.rows);
  } catch (err) {
    console.error("DB Error:", err);
  } finally {
    await c.end();
  }
}

run();
