/**
 * Admin LMS — Quiz question CRUD
 * POST   /api/admin/lms/quiz  — add question
 * PUT    /api/admin/lms/quiz  — update question
 * DELETE /api/admin/lms/quiz  — delete question
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
  const { courseSlug, question, options, correct_index, explanation } = await req.json();
  if (!courseSlug || !question || !options) return Response.json({ error: 'courseSlug, question, options required' }, { status: 400 });

  try {
    const maxOrder = await pool.query(
      'SELECT COALESCE(MAX(question_order), 0) as max FROM lms_quiz_questions WHERE course_slug=$1', [courseSlug]
    );
    const nextOrder = parseInt(maxOrder.rows[0].max) + 1;

    const result = await pool.query(
      `INSERT INTO lms_quiz_questions (course_slug, question_order, question, options, correct_index, explanation)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [courseSlug, nextOrder, question, JSON.stringify(options), correct_index ?? 0, explanation || '']
    );
    await pool.query(
      'UPDATE lms_courses SET quiz_count = (SELECT COUNT(*) FROM lms_quiz_questions WHERE course_slug=$1) WHERE slug=$1',
      [courseSlug]
    );
    return Response.json({ question: result.rows[0] }, { status: 201 });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function PUT(req: NextRequest) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, question, options, correct_index, explanation } = await req.json();
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  try {
    const result = await pool.query(
      'UPDATE lms_quiz_questions SET question=$1, options=$2, correct_index=$3, explanation=$4 WHERE id=$5 RETURNING *',
      [question, JSON.stringify(options), correct_index, explanation, id]
    );
    return Response.json({ question: result.rows[0] });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}

export async function DELETE(req: NextRequest) {
  if (!await auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const { id, courseSlug } = await req.json();
  if (!id) return Response.json({ error: 'id required' }, { status: 400 });

  try {
    await pool.query('DELETE FROM lms_quiz_questions WHERE id=$1', [id]);
    if (courseSlug) {
      await pool.query(
        'UPDATE lms_courses SET quiz_count = (SELECT COUNT(*) FROM lms_quiz_questions WHERE course_slug=$1) WHERE slug=$1',
        [courseSlug]
      );
    }
    return Response.json({ message: 'Question deleted' });
  } catch (e: any) { return Response.json({ error: e.message }, { status: 500 }); }
}
