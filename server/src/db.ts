import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL não definido');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.DATABASE_URL?.includes('render.com') || process.env.DATABASE_URL?.includes('supabase.co')
    ? { rejectUnauthorized: false }
    : false,
});


// Test connection on startup
pool.query('SELECT now()', (err, res) => {
  if (err) {
    console.error('[DB] Connection failed on startup:', err.message);
  } else {
    console.log('[DB] Connected successfully at:', res.rows[0].now);
  }
});
