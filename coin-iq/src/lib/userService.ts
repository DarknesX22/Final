import pool from './db';
import bcrypt from 'bcrypt';

// Define the User interface
export interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

// Define the UserInput interface for creating users
export interface UserInput {
  name: string;
  email: string;
  password: string;
}

// Update user profile function
export const updateUserProfile = async (userId: number, userData: Partial<Omit<User, 'id' | 'created_at' | 'password_hash'>> & { password?: string }) => {
  try {
    const { name, email, password } = userData;
    let updateFields: string[] = [];
    let queryParams: any[] = [];
    let paramIndex = 1;

    if (name) {
      updateFields.push(`name = $${paramIndex}`);
      queryParams.push(name);
      paramIndex++;
    }

    if (email) {
      updateFields.push(`email = $${paramIndex}`);
      queryParams.push(email);
      paramIndex++;
    }

    if (password) {
      const hashedPassword = await hashPassword(password);
      updateFields.push(`password_hash = $${paramIndex}`);
      queryParams.push(hashedPassword);
      paramIndex++;
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updateFields.length === 1) {
      // Only updated_at was changed, nothing else to update
      throw new Error('No fields to update');
    }

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, created_at, updated_at
    `;
    
    queryParams.push(userId);

    const result = await pool.query(query, queryParams);
    
    if (result.rows.length === 0) {
      throw new Error('User not found or update failed');
    }

    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation error code
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Hash password using bcrypt
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Create a new user
export const createUser = async (userData: UserInput): Promise<User> => {
  try {
    const { name, email, password } = userData;
    const password_hash = await hashPassword(password);

    const query = `
      INSERT INTO users (name, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, created_at, updated_at
    `;

    const result = await pool.query(query, [name, email, password_hash]);
    
    if (result.rows.length === 0) {
      throw new Error('User creation failed');
    }

    return result.rows[0];
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation error code
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Find user by email
export const findUserByEmail = async (email: string): Promise<User | null> => {
  const query = 'SELECT id, name, email, password_hash, created_at, updated_at FROM users WHERE email = $1';
  const result = await pool.query(query, [email]);

  return result.rows.length > 0 ? result.rows[0] : null;
};

// Find user by ID
export const findUserById = async (id: number): Promise<User | null> => {
  const query = 'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1';
  const result = await pool.query(query, [id]);

  return result.rows.length > 0 ? result.rows[0] : null;
};

// Verify password
export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Function to get user by ID
export const getUserById = async (id: number): Promise<User | null> => {
  try {
    const query = 'SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};