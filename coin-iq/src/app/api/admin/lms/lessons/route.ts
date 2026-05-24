/**
 * Admin LMS — Lesson CRUD
 * POST   /api/admin/lms/lessons  — add lesson to a course
 * PUT    /api/admin/lms/lessons  — update a lesson
 * DELETE /api/admin/lms/lessons  — delete a lesson
 */
import { NextRequest } from 'next/server';
import { getCurrentAdminFromCookieAsync } from '@/lib/adminSession';
import pool from '@/lib/db';

async function auth(req: NextRequest) {
  const admin = await getCurrentAdminFromCookieAsync(req.headers.get('cookie') || undefined);
  return admin?.isAdmin ? admin : null;
}

export async function POST(req: NextRequest) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { courseSlug, title, content, duration_minutes } = await req.json();
  if (!courseSlug || !title) return Response.json({ error: 'courseSlug and title required' }, { status: 400 });

  try {
    // Get next lesson index
    const maxIdx = await pool.query(
      'SELECT COALESCE(MAX(lesson_index), -1) as max FROM lms_lessons WHERE course_slug=$1', [courseSlug]
    );
    const nextIndex = parseInt(maxIdx.rows[0].max) + 1;

    const result = await pool.query(
      `INSERT INTO lms_lessons (course_slug, lesson_index, title, content, duration_minutes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [courseSlug, nextIndex, title, content || '', duration_minutes || 5]
    );
    // Update lesson_count
    await pool.query(
      'UPDATE lms_courses SET lesson_count = (SELECT COUNT(*) FROM lms_lessons WHERE course_slug=$1) WHERE slug=$1',
      [courseSlug]
    );
    return Response.json({ lesson: result.rows[0] }, { status: 201 });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, title, content, duration_minutes } = await req.json();
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  try {
    const result = await pool.query(
      'UPDATE lms_lessons SET title=$1, content=$2, duration_minutes=$3 WHERE id=$4 RETURNING *',
      [title, content, duration_minutes, id]
    );
    return Response.json({ lesson: result.rows[0] });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, courseSlug } = await req.json();
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  try {
    await pool.query('DELETE FROM lms_lessons WHERE id=$1', [id]);
    if (courseSlug) {
      await pool.query(
        'UPDATE lms_courses SET lesson_count = (SELECT COUNT(*) FROM lms_lessons WHERE course_slug=$1) WHERE slug=$1',
        [courseSlug]
      );
    }
    return Response.json({ message: 'Lesson deleted' });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
