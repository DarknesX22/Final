import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { adminEmail } = await request.json();
  if (!adminEmail) return Response.json({ error: 'adminEmail is required' }, { status: 400 });

  if (adminEmail === 'admin@coiniq.com' || adminEmail === admin.email)
    return Response.json({ error: 'Cannot demote this admin account' }, { status: 400 });

  try {
    const existing = await pool.query('SELECT id FROM admins WHERE email = $1', [adminEmail]);
    if (existing.rows.length === 0)
      return Response.json({ error: 'Admin not found' }, { status: 404 });

    await pool.query('DELETE FROM admins WHERE email = $1', [adminEmail]);
    return Response.json({ message: 'Admin demoted to regular user' });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
