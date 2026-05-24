import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { findValidResetToken, markTokenAsUsed, resetUserPassword } from '@/lib/passwordResetService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword } = body;

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Password reset token is required' },
        { status: 400 }
      );
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find valid token
    const resetTokenRecord = await findValidResetToken(token);

    if (!resetTokenRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired password reset token' },
        { status: 400 }
      );
    }

    // Reset the user's password
    await resetUserPassword(resetTokenRecord.user_id, newPassword);

    // Mark the token as used
    await markTokenAsUsed(resetTokenRecord.id);

    return NextResponse.json(
      { message: 'Password has been reset successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing password reset request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}