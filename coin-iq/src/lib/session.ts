import jwt from 'jsonwebtoken';
import { User } from './userService';

const JWT_SECRET = process.env.JWT_SECRET || 'coin_iq_secret_key';

// Create a JWT token for a user
export const createToken = (user: User): string => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      name: user.name 
    },
    JWT_SECRET,
    { expiresIn: '7d' } // Token expires in 7 days
  );
};

// Verify a JWT token and return user data
export const verifyToken = (token: string): User | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as User;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// This utility file provides functions for session management
// Use these functions in server components or API routes

// Get the current user from the session (to be used in server components)
export const getCurrentUserFromCookie = (cookieHeader: string | undefined): User | null => {
  if (!cookieHeader) {
    return null;
  }
  
  const authCookie = cookieHeader.split(';').find(cookie => cookie.trim().startsWith('auth_token='));
  if (!authCookie) {
    return null;
  }
  
  const token = authCookie.split('=')[1];
  return verifyToken(token);
};

// This function generates a Set-Cookie header value
export const getAuthCookieValue = (token: string): string => {
  const maxAge = 60 * 60 * 24 * 7; // 1 week
  return `auth_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
};

// This function generates a header to clear the auth cookie
export const getClearAuthCookieValue = (): string => {
  return 'auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict';
};