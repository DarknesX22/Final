import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { createUser, findUserByEmail } from '@/lib/userService';
import { createToken, getAuthCookieValue } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const { email, otp, name, password } = await request.json();

    if (!email || !otp || !name || !password) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Check OTP attempts — max 5
    const otpRow = await db.query(
      `SELECT id, otp_code, expires_at, attempts, locked_until
       FROM otp_verifications
       WHERE email = $1 AND verified = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (otpRow.rows.length === 0) {
      return NextResponse.json({ error: 'No OTP found. Please request a new one.' }, { status: 400 });
    }

    const record = otpRow.rows[0];

    // Check if locked
    if (record.locked_until && new Date(record.locked_until) > new Date()) {
      return NextResponse.json({ error: 'Too many attempts. Please request a new OTP.' }, { status: 429 });
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
    }

    // Check OTP match
    if (String(record.otp_code).trim() !== String(otp).trim()) {
      const newAttempts = record.attempts + 1;
      if (newAttempts >= 5) {
        // Lock for 10 minutes
        await db.query(
          'UPDATE otp_verifications SET attempts = $1, locked_until = NOW() + INTERVAL \'10 minutes\' WHERE id = $2',
          [newAttempts, record.id]
        );
        return NextResponse.json({ error: 'Too many wrong attempts. Please request a new OTP.' }, { status: 429 });
      }
      await db.query('UPDATE otp_verifications SET attempts = $1 WHERE id = $2', [newAttempts, record.id]);
      return NextResponse.json({ error: `Invalid OTP. ${5 - newAttempts} attempts remaining.` }, { status: 400 });
    }

    // Mark OTP as verified
    await db.query('UPDATE otp_verifications SET verified = TRUE WHERE id = $1', [record.id]);

    // Check if user already exists
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }

    // Create the user
    const user  = await createUser({ name, email, password });
    const token = createToken(user);
    const { password_hash, ...userWithoutPassword } = user as any;

    const response = NextResponse.json(
      { message: 'Account created successfully', user: userWithoutPassword },
      { status: 201 }
    );
    response.headers.set('Set-Cookie', getAuthCookieValue(token));
    return response;
  } catch (error: any) {
    console.error('OTP verify-signup error:', error);
    if (error.message === 'Email already exists') {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
