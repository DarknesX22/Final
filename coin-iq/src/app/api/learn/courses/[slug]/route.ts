import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/session';

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Load course from DB
  const courseRes = await pool.query('SELECT * FROM lms_courses WHERE slug = $1', [slug]);
  if (!courseRes.rows[0]) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  const dbCourse = courseRes.rows[0];

  // Load lessons from DB
  const lessonsRes = await pool.query(
    'SELECT * FROM lms_lessons WHERE course_slug = $1 ORDER BY lesson_index ASC',
    [slug]
  );

  // Load quiz questions from DB
  const quizRes = await pool.query(
    'SELECT * FROM lms_quiz_questions WHERE course_slug = $1 ORDER BY question_order ASC',
    [slug]
  );

  // Shape into the format the frontend expects (matches lmsData.ts Course interface)
  const course = {
    slug:            dbCourse.slug,
    title:           dbCourse.title,
    description:     dbCourse.description,
    level:           dbCourse.level,
    durationMinutes: dbCourse.duration_minutes,
    icon:            dbCourse.icon  || '📚',
    color:           dbCourse.color || 'bg-gray-50 border-gray-200',
    lessons: lessonsRes.rows.map((l: any) => ({
      index:    l.lesson_index,
      title:    l.title,
      duration: l.duration_minutes,
      content:  l.content,
    })),
    quiz: quizRes.rows.map((q: any) => ({
      id:          q.id,
      question:    q.question,
      options:     Array.isArray(q.options) ? q.options : JSON.parse(q.options),
      correct:     q.correct_index,
      explanation: q.explanation,
    })),
  };

  // Load user progress if logged in
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? verifyToken(token) : null;
  let progress = null;
  if (user) {
    try {
      const res = await pool.query(
        'SELECT * FROM lms_user_progress WHERE user_id = $1 AND course_slug = $2',
        [user.id, slug]
      );
      progress = res.rows[0] ?? null;
    } catch { /* ignore */ }
  }

  return NextResponse.json({ course, progress });
}
