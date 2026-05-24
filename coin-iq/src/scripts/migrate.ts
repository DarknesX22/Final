import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  console.log('Starting database migration...');
  console.log('DB_HOST:', process.env.DB_HOST || 'localhost');
  console.log('DB_NAME:', process.env.DB_NAME || 'coin_iq');
  console.log('DB_USER:', process.env.DB_USER || 'postgres');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'coin_iq',
  });

  try {
    console.log('Attempting to connect to database...');
    await client.connect();
    console.log('Connected to coin_iq database successfully!');

    // Read and execute the schema SQL
    const schemaPath = path.join(__dirname, '..', 'lib', 'schema.sql');
    console.log('Reading schema file from:', schemaPath);
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('Schema file read successfully, executing...');

    await client.query(schemaSQL);
    console.log('Database migrations completed successfully!');

    await client.end();
    console.log('Migration process completed!');
  } catch (error) {
    console.error('Error during migration:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

async function main(): Promise<void> {
  await runMigrations();
  process.exit(0);
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default runMigrations;