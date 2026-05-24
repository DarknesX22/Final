import { verifyToken } from './session';
import { User } from './userService';

// This function can only be used in server components where cookies are available
export const getCurrentUser = (cookieHeader?: string): User | null => {
  let tokenValue: string | undefined;
  
  if (cookieHeader) {
    // Extract token from cookie header
    const authCookie = cookieHeader.split(';').find(cookie => cookie.trim().startsWith('auth_token='));
    if (authCookie) {
      tokenValue = authCookie.split('=')[1];
    }
  } else {
    // If no cookie header provided, try to get from Next.js cookies (server components only)
    try {
      const { cookies } = require('next/headers');
      const cookieStore = cookies();
      const token = cookieStore.get('auth_token');
      tokenValue = token?.value;
    } catch (error) {
      // If cookies are not available (e.g., in API routes), return null
      return null;
    }
  }
  
  if (!tokenValue) {
    return null;
  }
  
  return verifyToken(tokenValue);
};

export const isAuthenticated = (cookieHeader?: string): boolean => {
  return getCurrentUser(cookieHeader) !== null;
};

// Client-side function to get user profile from API
export const getUserProfile = async (): Promise<{ id: number; name: string; email: string; created_at: string } | null> => {
  try {
    const response = await fetch('/api/auth/me');
    
    if (!response.ok) {
      if (response.status === 401) {
        // Unauthorized - user not logged in
        return null;
      }
      throw new Error('Failed to fetch user profile');
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};