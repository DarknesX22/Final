import pool from './db';
import bcrypt from 'bcrypt';

// Define the Admin interface
export interface Admin {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: string;
  created_at: Date;
  updated_at: Date;
}

// Define the AdminToken interface for JWT token payload
export interface AdminToken {
  id: number;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
}

// Define the AdminInput interface for creating admins
export interface AdminInput {
  name: string;
  email: string;
  password: string;
  role?: string;
}

// Hash password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Create a new admin
export const createAdmin = async (adminData: AdminInput): Promise<Admin> => {
  try {
    const { name, email, password, role = 'admin' } = adminData;
    const password_hash = await hashPassword(password);

    const query = `
      INSERT INTO admins (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role, created_at, updated_at
    `;

    const result = await pool.query(query, [name, email, password_hash, role]);
    
    if (result.rows.length === 0) {
      throw new Error('Admin creation failed');
    }

    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation error code
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Find admin by email
export const findAdminByEmail = async (email: string): Promise<Admin | null> => {
  const query = 'SELECT id, name, email, password_hash, role, created_at, updated_at FROM admins WHERE email = $1';
  const result = await pool.query(query, [email]);

  return result.rows.length > 0 ? result.rows[0] : null;
};

// Find admin by ID
export const findAdminById = async (id: number): Promise<Admin | null> => {
  const query = 'SELECT id, name, email, role, created_at, updated_at FROM admins WHERE id = $1';
  const result = await pool.query(query, [id]);

  return result.rows.length > 0 ? result.rows[0] : null;
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Get all admins
export const getAllAdmins = async (): Promise<Admin[]> => {
  const query = 'SELECT id, name, email, role, created_at, updated_at FROM admins ORDER BY created_at DESC';
  const result = await pool.query(query);
  return result.rows;
};

// Update admin role
export const updateAdminRole = async (id: number, role: string): Promise<Admin> => {
  const query = `
    UPDATE admins 
    SET role = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, name, email, role, created_at, updated_at
  `;
  const result = await pool.query(query, [id, role]);
  
  if (result.rows.length === 0) {
    throw new Error('Admin not found');
  }
  
  return result.rows[0];
};

// Delete admin
export const deleteAdmin = async (id: number): Promise<boolean> => {
  const query = 'DELETE FROM admins WHERE id = $1';
  const result = await pool.query(query, [id]);
  return result.rowCount !== null && result.rowCount > 0;
};