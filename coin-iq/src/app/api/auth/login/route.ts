import { NextRequest, NextResponse } from 'next/server';
import { findUserByEmail, verifyPassword } from '@/lib/userService';
import { findAdminByEmail, verifyPassword as verifyAdminPassword } from '@/lib/adminService';
import { createToken, getAuthCookieValue } from '@/lib/session';
import { createAdminToken, getAdminAuthCookieValue } from '@/lib/adminSession';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // ── 1. Check admins table first ───────────────────────────────────────────
    const admin = await findAdminByEmail(email);
    if (admin) {
      const validAdmin = await verifyAdminPassword(password, admin.password_hash);
      if (!validAdmin) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Issue admin token
      const adminToken = await createAdminToken(admin);
      const { password_hash: _ph, ...adminWithoutPassword } = admin as any;

      const response = NextResponse.json(
        {
          message: 'Login successful',
          user: { ...adminWithoutPassword, isAdmin: true },
          isAdmin: true,
          redirect: '/admin',
        },
        { status: 200 }
      );

      // Set both cookies so admin can also access user-protected routes
      const userToken = createToken({
        id: admin.id,
        email: admin.email,
        name: admin.name,
        password_hash: admin.password_hash,
        created_at: admin.created_at,
        updated_at: admin.updated_at,
      });

      response.headers.append('Set-Cookie', getAuthCookieValue(userToken));
      response.headers.append('Set-Cookie', getAdminAuthCookieValue(adminToken));

      return response;
    }

    // ── 2. Fall back to regular users table ───────────────────────────────────
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const validUser = await verifyPassword(password, user.password_hash);
    if (!validUser) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const token = createToken(user);
    const { password_hash, ...userWithoutPassword } = user as any;

    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: { ...userWithoutPassword, isAdmin: false },
        isAdmin: false,
        redirect: '/dashboard',
      },
      { status: 200 }
    );

    response.headers.set('Set-Cookie', getAuthCookieValue(token));
    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
