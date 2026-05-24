import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/session';
import { getCourse } from '@/lib/lmsData';

// POST — mark a lesson complete
export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseSlug, lessonIndex } = await req.json();
  if (!courseSlug || lessonIndex === undefined)
    return NextResponse.json({ error: 'courseSlug and lessonIndex required' }, { status: 400 });

  const course = getCourse(courseSlug);
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

  try {
    // Upsert progress row
    await pool.query(`
      INSERT INTO lms_user_progress (user_id, course_slug, lesson_index, completed_lessons)
      VALUES ($1, $2, $3, ARRAY[$3::int])
      ON CONFLICT (user_id, course_slug) DO UPDATE
        SET lesson_index = GREATEST(lms_user_progress.lesson_index, $3),
            completed_lessons = (
              SELECT ARRAY(SELECT DISTINCT unnest(lms_user_progress.completed_lessons || ARRAY[$3::int]) ORDER BY 1)
            )
    `, [user.id, courseSlug, lessonIndex]);

    // Fetch updated progress
    const res = await pool.query(
      'SELECT * FROM lms_user_progress WHERE user_id = $1 AND course_slug = $2',
      [user.id, courseSlug]
    );
    return NextResponse.json({ progress: res.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET — fetch all progress for current user
export async function GET(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await pool.query(
      'SELECT * FROM lms_user_progress WHERE user_id = $1',
      [user.id]
    );
    return NextResponse.json({ progress: res.rows });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
