import { Pool, QueryResult } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

export async function executeQuery(sql: string): Promise<QueryResult> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql);
    return result;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log(' PostgreSQL connected successfully');
  } finally {
    client.release();
  }
}