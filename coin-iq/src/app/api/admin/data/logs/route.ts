import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url   = new URL(request.url);
  const page  = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const limit = parseInt(url.searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  try {
    // Build a unified activity log from real DB events
    const result = await pool.query(`
      SELECT * FROM (
        SELECT
          u.id::text as id,
          u.name as actor_name,
          u.email as actor_email,
          'User registered' as action,
          'signup' as type,
          u.created_at
        FROM users u

        UNION ALL

        SELECT
          'cert-' || c.id::text,
          u.name,
          u.email,
          'Certificate earned: ' || c.course_slug,
          'certificate',
          c.issued_at
        FROM lms_certificates c
        JOIN users u ON u.id = c.user_id

        UNION ALL

        SELECT
          'prog-' || p.id::text,
          u.name,
          u.email,
          'Completed course: ' || p.course_slug,
          'course',
          p.completed_at
        FROM lms_user_progress p
        JOIN users u ON u.id = p.user_id
        WHERE p.completed = true AND p.completed_at IS NOT NULL
      ) logs
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const countResult = await pool.query(`
      SELECT (
        (SELECT COUNT(*) FROM users) +
        (SELECT COUNT(*) FROM lms_certificates) +
        (SELECT COUNT(*) FROM lms_user_progress WHERE completed = true)
      ) as total
    `);

    return Response.json({
      logs:       result.rows,
      total:      parseInt(countResult.rows[0].total),
      page,
      totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
    });
  } catch (e: any) {
    // Fallback if LMS tables don't exist yet
    try {
      const result = await pool.query(
        `SELECT id::text, name as actor_name, email as actor_email, 'User registered' as action, 'signup' as type, created_at
         FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      const count = await pool.query('SELECT COUNT(*) FROM users');
      return Response.json({
        logs: result.rows,
        total: parseInt(count.rows[0].count),
        page,
        totalPages: Math.ceil(parseInt(count.rows[0].count) / limit),
      });
    } catch (e2: any) {
      return Response.json({ error: e2.message }, { status: 500 });
    }
  }
}
