import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { validateResetToken } from '@/lib/passwordResetService';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    // Validate token parameter
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Password reset token is required' },
        { status: 400 }
      );
    }

    // Validate the token
    const tokenRecord = await validateResetToken(token);

    if (!tokenRecord) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { valid: true, message: 'Token is valid' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating password reset token:', error);
    return NextResponse.json(
      { error: 'An error occurred while validating the token' },
      { status: 500 }
    );
  }
}