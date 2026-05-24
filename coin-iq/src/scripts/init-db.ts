import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

async function initializeDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    // Connect to default postgres database first to create our database
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists, if not create it
    const dbExistsResult = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1", 
      [process.env.DB_NAME || 'coin_iq']
    );

    if (dbExistsResult.rowCount === 0) {
      console.log(`Database ${process.env.DB_NAME || 'coin_iq'} does not exist, creating...`);
      await client.query(`CREATE DATABASE "${process.env.DB_NAME || 'coin_iq'}"`);
      console.log(`Database ${process.env.DB_NAME || 'coin_iq'} created successfully!`);
    } else {
      console.log(`Database ${process.env.DB_NAME || 'coin_iq'} already exists`);
    }

    // Now connect to our specific database to run the schema
    const schemaClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'coin_iq',
    });

    await schemaClient.connect();
    console.log('Connected to coin_iq database');

    // Read and execute the schema SQL
    const schemaPath = path.join(__dirname, '..', 'lib', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    await schemaClient.query(schemaSQL);
    console.log('Database schema created successfully!');

    await schemaClient.end();
    await client.end();

    console.log('Database initialization completed!');
  } catch (error) {
    console.error('Error during database initialization:', error);
    await client.end();
    process.exit(1);
  }
}

async function main(): Promise<void> {
  await initializeDatabase();
  process.exit(0);
}

if (typeof require !== 'undefined' && require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export default initializeDatabase;