import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { createPasswordResetToken } from '@/lib/passwordResetService';
import { sendPasswordResetEmail } from '@/lib/emailService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email format
    if (!email || typeof email !== 'string' || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      // Don't reveal if user exists or not for security reasons
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    const user = userResult.rows[0];

    // Create a password reset token
    const token = await createPasswordResetToken(user.id);

    // Send password reset email
    const emailSent = await sendPasswordResetEmail(email, token);
    
    if (!emailSent) {
      // If email fails to send, we should delete the token
      await db.query(
        'DELETE FROM password_reset_tokens WHERE token = $1',
        [token]
      );
      
      // In development or if email service is not configured, we can still return success
      // to prevent leaking information about whether an email exists
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing forgot password request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}