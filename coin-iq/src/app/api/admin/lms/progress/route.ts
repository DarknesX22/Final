/**
 * Admin LMS — All user progress
 * GET /api/admin/lms/progress
 */
import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';
import { COURSES } from '@/lib/lmsData';

const LESSON_COUNT: Record<string, number> = {};
COURSES.forEach(c => { LESSON_COUNT[c.slug] = c.lessons.length; });

export async function GET(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie') || undefined;
  const admin = await getCurrentAdminFromCookieAsync(cookieHeader);
  if (!admin?.isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await pool.query(`
      SELECT
        p.id, p.course_slug, p.quiz_score, p.quiz_passed as passed,
        p.completed, p.started_at, p.completed_at,
        COALESCE(array_length(p.completed_lessons, 1), 0) as lessons_done,
        u.name as user_name, u.email as user_email
      FROM lms_user_progress p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.started_at DESC
      LIMIT 200
    `);

    const progress = result.rows.map((r: any) => ({
      ...r,
      total_lessons: LESSON_COUNT[r.course_slug] ?? 0,
    }));

    return Response.json({ progress });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
