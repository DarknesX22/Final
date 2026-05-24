import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/session';
import { PASSING_SCORE } from '@/lib/lmsData';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const user  = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { courseSlug, answers } = await req.json();
  // answers: { [questionId]: selectedOptionIndex }

  // Load quiz questions from DB
  const quizRes = await pool.query(
    'SELECT * FROM lms_quiz_questions WHERE course_slug = $1 ORDER BY question_order ASC',
    [courseSlug]
  );

  if (!quizRes.rows.length) {
    return NextResponse.json({ error: 'Course or quiz not found' }, { status: 404 });
  }

  const questions = quizRes.rows;

  // Grade server-side — correct answers never sent to client
  let correct = 0;
  const results = questions.map((q: any) => {
    const opts    = Array.isArray(q.options) ? q.options : JSON.parse(q.options);
    const selected = answers[q.id];
    const isCorrect = selected === q.correct_index;
    if (isCorrect) correct++;
    return {
      id:          q.id,
      selected,
      correct:     q.correct_index,
      isCorrect,
      explanation: q.explanation,
    };
  });

  const score  = Math.round((correct / questions.length) * 100);
  const passed = score >= PASSING_SCORE;

  try {
    // Upsert progress with quiz result
    await pool.query(`
      INSERT INTO lms_user_progress (user_id, course_slug, quiz_score, quiz_passed, completed, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, course_slug) DO UPDATE
        SET quiz_score   = $3,
            quiz_passed  = $4,
            completed    = $5,
            completed_at = CASE WHEN $5 THEN $6 ELSE lms_user_progress.completed_at END
    `, [user.id, courseSlug, score, passed, passed, new Date()]);

    // Issue certificate if passed
    let certificateId: string | null = null;
    if (passed) {
      const existing = await pool.query(
        'SELECT certificate_id FROM lms_certificates WHERE user_id = $1 AND course_slug = $2',
        [user.id, courseSlug]
      );
      if (existing.rows.length > 0) {
        certificateId = existing.rows[0].certificate_id;
      } else {
        certificateId = crypto.randomBytes(16).toString('hex');
        await pool.query(
          'INSERT INTO lms_certificates (user_id, course_slug, certificate_id) VALUES ($1, $2, $3)',
          [user.id, courseSlug, certificateId]
        );
      }
    }

    return NextResponse.json({ score, passed, correct, total: questions.length, results, certificateId });
  } catch (e: any) {
    return NextResponse.json({ score, passed, correct, total: questions.length, results, certificateId: null });
  }
}
