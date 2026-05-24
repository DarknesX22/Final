import { SignJWT, jwtVerify } from 'jose';
import { Admin, AdminToken } from './adminService';

const JWT_SECRET = process.env.JWT_SECRET || 'coin_iq_secret_key';
const secret = new TextEncoder().encode(JWT_SECRET);

// Create a JWT token for an admin
export const createAdminToken = async (admin: Admin): Promise<string> => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 7 * 24 * 60 * 60; // 7 days

  return new SignJWT({ 
      id: admin.id, 
      email: admin.email,
      name: admin.name,
      role: admin.role,
      isAdmin: true
    })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(secret);
};

// Verify a JWT token and return admin data
export const verifyAdminToken = async (token: string): Promise<AdminToken | null> => {
  try {
    const verified = await jwtVerify(token, secret);
    const payload = verified.payload as unknown as AdminToken;
    if (payload.isAdmin) {
      return payload;
    }
    return null;
  } catch (error) {
    console.error('Admin token verification error:', error);
    return null;
  }
};

// This utility file provides functions for admin session management
// Use these functions in server components or API routes

// Get the current admin from the session (to be used in server components)
// Note: This function is synchronous and used primarily in middleware
// For async operations, use verifyAdminToken directly
export const getCurrentAdminFromCookie = (cookieHeader: string | null | undefined): AdminToken | null => {
  if (!cookieHeader) {
    return null;
  }
  
  const authCookie = cookieHeader.split(';').find(cookie => cookie.trim().startsWith('admin_auth_token='));
  if (!authCookie) {
    return null;
  }
  
  const token = authCookie.split('=')[1];
  
  // Decode JWT without verification to check isAdmin flag
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function(c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    
    const payload = JSON.parse(jsonPayload);
    if (payload.isAdmin) {
      return payload as AdminToken;
    }
    return null;
  } catch (error) {
    console.error('Error decoding admin token in middleware:', error);
    return null;
  }
};

// Async version for server components
export const getCurrentAdminFromCookieAsync = async (cookieHeader: string | null | undefined): Promise<AdminToken | null> => {
  if (!cookieHeader) {
    return null;
  }
  
  const authCookie = cookieHeader.split(';').find(cookie => cookie.trim().startsWith('admin_auth_token='));
  if (!authCookie) {
    return null;
  }
  
  const token = authCookie.split('=')[1];
  return await verifyAdminToken(token);
};

// This function generates a Set-Cookie header value for admin
export const getAdminAuthCookieValue = (token: string): string => {
  const maxAge = 60 * 60 * 24 * 7; // 1 week
  return `admin_auth_token=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;
};

// This function generates a header to clear the admin auth cookie
export const getClearAdminAuthCookieValue = (): string => {
  return 'admin_auth_token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict';
};

// Function to destroy admin session (clear the cookie)
export const destroyAdminSession = async () => {
  // In a Next.js API route, we can't directly clear cookies here
  // Instead, this function will be used to return the appropriate response
  // with the cookie clearing header
  const response = new Response(JSON.stringify({ message: 'Logged out successfully' }), {
    status: 200,
    headers: {
      'Set-Cookie': getClearAdminAuthCookieValue(),
      'Content-Type': 'application/json',
    },
  });
  
  return response;
};