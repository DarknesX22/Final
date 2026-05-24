import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import { findUserByEmail } from '@/lib/userService';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { userEmail, role = 'admin' } = await request.json();
  if (!userEmail) return Response.json({ error: 'userEmail is required' }, { status: 400 });

  const user = await findUserByEmail(userEmail);
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 });

  try {
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [userEmail]);
    if (existing.rows.length > 0)
      return Response.json({ error: 'User is already an admin' }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO admins (name, email, password_hash, role) VALUES ($1,$2,$3,$4)
       RETURNING id, name, email, role`,
      [user.name, user.email, user.password_hash, role]
    );
    return Response.json({ message: 'User promoted to admin', admin: result.rows[0] });
  } catch (e: any) {
    if (e.code === '23505') return Response.json({ error: 'User is already an admin' }, { status: 400 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
