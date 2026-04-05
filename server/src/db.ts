import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL não definido');
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
});
