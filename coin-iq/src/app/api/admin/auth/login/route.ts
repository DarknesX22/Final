import { NextRequest } from 'next/server';
import { findAdminByEmail, verifyPassword } from '@/lib/adminService';
import { createAdminToken, getAdminAuthCookieValue } from '@/lib/adminSession';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return Response.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email
    const admin = await findAdminByEmail(email);
    if (!admin) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.password_hash);
    if (!isValidPassword) {
      return Response.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create admin session token
    const token = await createAdminToken(admin);

    // Set cookie with the token
    const response = Response.json(
      { 
        message: 'Login successful', 
        admin: { 
          id: admin.id, 
          name: admin.name, 
          email: admin.email,
          role: admin.role
        } 
      },
      { status: 200 }
    );

    // Set the admin auth token cookie
    response.headers.append('Set-Cookie', getAdminAuthCookieValue(token));

    return response;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return Response.json(
      { error: error.message || 'An error occurred during login' },
      { status: 500 }
    );
  }
}