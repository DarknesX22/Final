import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const search = url.searchParams.get('search') || '';
  const page   = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit  = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    // Get admin emails for role tagging
    const adminEmails = await pool.query('SELECT email, role FROM admins');
    const adminMap: Record<string, string> = {};
    adminEmails.rows.forEach((r: any) => { adminMap[r.email] = r.role; });

    const where = search ? `WHERE u.name ILIKE $3 OR u.email ILIKE $3` : '';
    const params = search ? [limit, offset, `%${search}%`] : [limit, offset];

    const result = await pool.query(`
      SELECT u.id, u.name, u.email, u.created_at,
             COALESCE(p.completed_courses, 0) as completed_courses
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) FILTER (WHERE completed = true) as completed_courses
        FROM lms_user_progress GROUP BY user_id
      ) p ON p.user_id = u.id
      ${where}
      ORDER BY u.created_at DESC
      LIMIT $1 OFFSET $2
    `, params);

    const countResult = await pool.query(
      search ? `SELECT COUNT(*) FROM users WHERE name ILIKE $1 OR email ILIKE $1` : `SELECT COUNT(*) FROM users`,
      search ? [`%${search}%`] : []
    );

    const users = result.rows.map((u: any) => ({
      ...u,
      role:   adminMap[u.email] ?? 'user',
      isAdmin: !!adminMap[u.email],
    }));

    return Response.json({
      users,
      total:      parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// DELETE a user
export async function DELETE(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { userId } = await request.json();
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 });

  try {
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    return Response.json({ message: 'User deleted' });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
