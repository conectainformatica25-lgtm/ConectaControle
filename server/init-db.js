import pg from 'pg';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const { Client } = pg;

// Use a external URL if possible, or Internal if we were running on Render
// But since I'm running locally, I need the EXTERNAL URL.
// The subagent copied the Internal URL. 
// I need the External URL to connect from here.

const connectionString = process.env.DATABASE_URL;

async function run() {
  if (!connectionString) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to Render database');

    const sqlPath = path.resolve('sql/postgres_standalone.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL script...');
    await client.query(sql);
    console.log('Database initialized successfully!');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await client.end();
  }
}

run();
