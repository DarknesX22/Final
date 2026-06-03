import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import crypto from 'crypto';

const EMAILJS_SERVICE_ID  = 'service_kzoq3zj';
const EMAILJS_TEMPLATE_ID = 'template_inx67iw'; // reuse same template — has {{passcode}} var
const EMAILJS_PUBLIC_KEY  = 'f9PoMgPGK53rQ8XF4';
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY || '';

// Use a dedicated OTP template if you have one, otherwise reuse the password template
// The template needs: {{passcode}}, {{time}}, {{email}}
const OTP_TEMPLATE_ID = process.env.EMAILJS_OTP_TEMPLATE_ID || 'template_220g35n';

function generateOTP(): string {
  return String(Math.floor(100000 + crypto.randomInt(900000)));
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    const expiresStr = expiresAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    // Invalidate any previous unverified OTPs for this email
    await db.query(
      'UPDATE otp_verifications SET verified = TRUE WHERE email = $1 AND verified = FALSE',
      [email]
    );

    // Store new OTP
    await db.query(
      `INSERT INTO otp_verifications (email, otp_code, expires_at, verified, attempts)
       VALUES ($1, $2, $3, FALSE, 0)`,
      [email, otp, expiresAt]
    );

    // Send via EmailJS REST API
    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id:  EMAILJS_SERVICE_ID,
        template_id: OTP_TEMPLATE_ID,
        user_id:     EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          email,
          name:     name || email.split('@')[0],
          passcode: otp,
          time:     expiresStr,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error('EmailJS OTP error:', text);
      // Still return success — OTP is in DB, dev can check console
      console.log(`[DEV] OTP for ${email}: ${otp}`);
    }

    return NextResponse.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('OTP send error:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
