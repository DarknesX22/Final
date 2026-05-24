import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/session';

export async function GET(request: NextRequest) {
  try {
    // Get the auth token from cookies
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the token
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Return user data (excluding sensitive information)
    const { password_hash, ...userWithoutSensitiveData } = user as any;
    
    return NextResponse.json(
      { user: userWithoutSensitiveData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Profile error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}