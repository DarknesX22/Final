import pool from './db';
import fs from 'fs';
import path from 'path';

// Function to initialize the database with the schema
export const initializeDatabase = async (): Promise<void> => {
  try {
    // Read the schema SQL file
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await pool.query(schemaSQL);
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// Function to test the database connection
export const testConnection = async (): Promise<boolean> => {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connection successful!');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
};