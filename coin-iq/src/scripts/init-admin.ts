import { Client } from 'pg';
import bcrypt from 'bcrypt';

async function createAdminUser() {
  console.log('Creating initial admin user...');
  
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123',
    database: process.env.DB_NAME || 'coin_iq',
  });

  try {
    await client.connect();
    console.log('Connected to database successfully!');

    // Hash the admin password
    const password = 'admin123';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Check if admin already exists
    const checkQuery = 'SELECT * FROM admins WHERE email = $1';
    const checkResult = await client.query(checkQuery, ['admin@coiniq.com']);

    if (checkResult.rows.length > 0) {
      console.log('Admin user already exists. Skipping creation.');
      return;
    }

    // Insert the admin user
    const insertQuery = `
      INSERT INTO admins (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
    `;
    
    const result = await client.query(insertQuery, [
      'Admin User',
      'admin@coiniq.com',
      passwordHash,
      'super_admin'
    ]);

    console.log('Initial admin user created successfully!');
    console.log('Email:', result.rows[0].email);
    console.log('Name:', result.rows[0].name);
    console.log('Role:', result.rows[0].role);
    console.log('ID:', result.rows[0].id);
    
    console.log('\nIMPORTANT: Please change the default password after first login for security purposes.');
    
  } catch (error: any) {
    console.error('Error creating admin user:', error.message);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the initialization
createAdminUser().then(() => {
  console.log('Admin initialization complete.');
  process.exit(0);
}).catch((error) => {
  console.error('Admin initialization failed:', error);
  process.exit(1);
});