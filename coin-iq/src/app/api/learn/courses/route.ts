import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/session';
import { syncLmsToDb } from '@/lib/lmsDbSync';

export async function GET(req: NextRequest) {
  // Seed hardcoded courses into DB on first call (idempotent)
  await syncLmsToDb();

  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? verifyToken(token) : null;

  // Fetch user progress if logged in
  let progressMap: Record<string, any> = {};
  if (user) {
    try {
      const res = await pool.query(
        'SELECT course_slug, completed_lessons, quiz_score, quiz_passed, completed FROM lms_user_progress WHERE user_id = $1',
        [user.id]
      );
      res.rows.forEach((r: any) => { progressMap[r.course_slug] = r; });
    } catch { /* ignore */ }
  }

  // Read ALL courses from DB (includes admin-created ones)
  const dbCourses = await pool.query(
    'SELECT * FROM lms_courses ORDER BY created_at ASC'
  );

  // For each course get lesson + quiz counts from DB
  const courses = await Promise.all(dbCourses.rows.map(async (c: any) => {
    const [lc, qc] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM lms_lessons WHERE course_slug=$1', [c.slug]),
      pool.query('SELECT COUNT(*) FROM lms_quiz_questions WHERE course_slug=$1', [c.slug]),
    ]);
    return {
      slug:            c.slug,
      title:           c.title,
      description:     c.description,
      level:           c.level,
      durationMinutes: c.duration_minutes,
      icon:            c.icon  || '📚',
      color:           c.color || 'bg-gray-50 border-gray-200',
      lessonCount:     parseInt(lc.rows[0].count),
      quizCount:       parseInt(qc.rows[0].count),
      progress:        progressMap[c.slug] ?? null,
    };
  }));

  return NextResponse.json({ courses });
}
