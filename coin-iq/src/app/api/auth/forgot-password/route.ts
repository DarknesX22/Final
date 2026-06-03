import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/userService';
import crypto from 'crypto';

function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  return Array.from(crypto.randomBytes(length))
    .map(b => chars[b % chars.length])
    .join('');
}

const EMAILJS_SERVICE_ID  = 'service_kzoq3zj';
const EMAILJS_TEMPLATE_ID = 'template_inx67iw';
const EMAILJS_PUBLIC_KEY  = 'f9PoMgPGK53rQ8XF4';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';

async function sendViaEmailJS(email: string, name: string, newPassword: string): Promise<void> {
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:  EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id:     EMAILJS_PUBLIC_KEY,
      accessToken: EMAILJS_PRIVATE_KEY,
      template_params: {
        email,
        name,
        new_password: newPassword,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EmailJS error ${res.status}: ${text}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    // Look up user
    const result = await db.query(
      'SELECT id, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'If an account with that email exists, a new password has been sent.' });
    }

    const { id: userId, name } = result.rows[0];

    // Generate & hash new password
    const newPassword  = generatePassword(16);
    const passwordHash = await hashPassword(newPassword);

    // Save to DB
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, userId]
    );

    // Send via EmailJS REST API
    try {
      await sendViaEmailJS(email, name, newPassword);
    } catch (mailErr: any) {
      console.error('EmailJS send failed:', mailErr.message);
      // Password already saved — log for dev fallback
      console.log(`[DEV] New password for ${email}: ${newPassword}`);
    }

    return NextResponse.json({ message: 'If an account with that email exists, a new password has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'An error occurred. Please try again.' }, { status: 500 });
  }
}
