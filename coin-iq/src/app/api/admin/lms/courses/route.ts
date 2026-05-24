/**
 * Admin LMS — Course management
 * GET  /api/admin/lms/courses  — list all courses with enrollment stats
 * POST /api/admin/lms/courses  — create a new course
 */
import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

async function auth(req: NextRequest) {
  const admin = await getCurrentAdminFromCookieAsync(req.headers.get('cookie') || undefined);
  return admin?.isAdmin ? admin : null;
}

export async function GET(request: NextRequest) {
  if (!await auth(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [coursesRes, statsRes] = await Promise.all([
      pool.query('SELECT * FROM lms_courses ORDER BY created_at ASC'),
      pool.query(`
        SELECT course_slug,
          COUNT(*) as enrolled,
          COUNT(*) FILTER (WHERE completed = true) as completed,
          COUNT(*) FILTER (WHERE quiz_passed = true) as passed,
          ROUND(AVG(quiz_score) FILTER (WHERE quiz_score IS NOT NULL), 1) as avg_score
        FROM lms_user_progress GROUP BY course_slug
      `).catch(() => ({ rows: [] as any[] })),
    ]);

    const statsMap: Record<string, any> = {};
    statsRes.rows.forEach((r: any) => { statsMap[r.course_slug] = r; });

    // Merge DB courses with lesson/quiz counts
    const courses = await Promise.all(coursesRes.rows.map(async (c: any) => {
      const [lessonCount, quizCount] = await Promise.all([
        pool.query('SELECT COUNT(*) FROM lms_lessons WHERE course_slug=$1', [c.slug]),
        pool.query('SELECT COUNT(*) FROM lms_quiz_questions WHERE course_slug=$1', [c.slug]),
      ]);
      const lessons = await pool.query(
        'SELECT lesson_index, title, duration_minutes FROM lms_lessons WHERE course_slug=$1 ORDER BY lesson_index',
        [c.slug]
      );
      return {
        ...c,
        lessonCount:   parseInt(lessonCount.rows[0].count),
        quizQuestions: parseInt(quizCount.rows[0].count),
        lessons:       lessons.rows.map((l: any) => ({ title: l.title, duration: l.duration_minutes })),
        enrolled:      parseInt(statsMap[c.slug]?.enrolled ?? 0),
        completed:     parseInt(statsMap[c.slug]?.completed ?? 0),
        passed:        parseInt(statsMap[c.slug]?.passed ?? 0),
        avgScore:      parseFloat(statsMap[c.slug]?.avg_score ?? 0),
      };
    }));

    return Response.json({ courses });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  if (!await auth(request)) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug, title, description, level, duration_minutes, icon } = await request.json();
  if (!slug || !title) return Response.json({ error: 'slug and title are required' }, { status: 400 });

  try {
    const result = await pool.query(
      `INSERT INTO lms_courses (slug, title, description, level, duration_minutes, icon, lesson_count, quiz_count)
       VALUES ($1,$2,$3,$4,$5,$6,0,0) RETURNING *`,
      [slug, title, description || '', level || 'Beginner', duration_minutes || 30, icon || '📚']
    );
    return Response.json({ course: result.rows[0] }, { status: 201 });
  } catch (e: any) {
    if (e.code === '23505') return Response.json({ error: 'A course with this slug already exists' }, { status: 409 });
    return Response.json({ error: e.message }, { status: 500 });
  }
}
