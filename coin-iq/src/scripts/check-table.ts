import { Client } from 'pg';

async function checkTable() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'coin_iq',
  });
  try {
    await client.connect();
    const result = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admins');");
    console.log('Admins table exists:', result.rows[0].exists);
    await client.end();
  } catch (error) {
    console.error('Error checking table:', error);
  }
}

checkTable();