/**
 * Admin LMS — Single course CRUD
 * GET    /api/admin/lms/courses/[slug]  — get course with lessons + quiz
 * PUT    /api/admin/lms/courses/[slug]  — update course metadata
 * DELETE /api/admin/lms/courses/[slug]  — delete course + all lessons/quiz
 */
import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

async function auth(req: NextRequest) {
  const admin = await getCurrentAdminFromCookieAsync(req.headers.get('cookie') || undefined);
  return admin?.isAdmin ? admin : null;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  try {
    const [course, lessons, quiz] = await Promise.all([
      pool.query('SELECT * FROM lms_courses WHERE slug = $1', [slug]),
      pool.query('SELECT * FROM lms_lessons WHERE course_slug = $1 ORDER BY lesson_index', [slug]),
      pool.query('SELECT * FROM lms_quiz_questions WHERE course_slug = $1 ORDER BY question_order', [slug]),
    ]);
    if (!course.rows[0]) return Response.json({ error: 'Course not found' }, { status: 404 });
    return Response.json({ course: course.rows[0], lessons: lessons.rows, quiz: quiz.rows });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  const { title, description, level, duration_minutes, icon } = await req.json();
  try {
    const result = await pool.query(
      `UPDATE lms_courses SET title=$1, description=$2, level=$3, duration_minutes=$4, icon=$5, updated_at=NOW()
       WHERE slug=$6 RETURNING *`,
      [title, description, level, duration_minutes, icon, slug]
    );
    if (!result.rows[0]) return Response.json({ error: 'Course not found' }, { status: 404 });
    return Response.json({ course: result.rows[0] });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { slug } = await params;
  try {
    // Cascade deletes lessons, quiz, progress, certs via FK
    await pool.query('DELETE FROM lms_courses WHERE slug = $1', [slug]);
    return Response.json({ message: 'Course deleted' });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
