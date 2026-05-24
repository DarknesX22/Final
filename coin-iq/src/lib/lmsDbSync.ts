/**
 * Syncs the hardcoded COURSES array into the database.
 * Called once at app startup (or manually via npm run lms:sync).
 * Idempotent — safe to run multiple times.
 */
import pool from './db';
import { COURSES } from './lmsData';

let synced = false;

export async function syncLmsToDb(): Promise<void> {
  if (synced) return;
  synced = true;

  try {
    for (const course of COURSES) {
      // Upsert course
      await pool.query(`
        INSERT INTO lms_courses (slug, title, description, level, duration_minutes, lesson_count, quiz_count, icon, color)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (slug) DO UPDATE SET
          title            = EXCLUDED.title,
          description      = EXCLUDED.description,
          level            = EXCLUDED.level,
          duration_minutes = EXCLUDED.duration_minutes,
          lesson_count     = EXCLUDED.lesson_count,
          quiz_count       = EXCLUDED.quiz_count,
          icon             = EXCLUDED.icon,
          color            = EXCLUDED.color,
          updated_at       = CURRENT_TIMESTAMP
      `, [
        course.slug, course.title, course.description,
        course.level, course.durationMinutes,
        course.lessons.length, course.quiz.length,
        course.icon, course.color,
      ]);

      // Upsert lessons
      for (const lesson of course.lessons) {
        await pool.query(`
          INSERT INTO lms_lessons (course_slug, lesson_index, title, content, duration_minutes)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (course_slug, lesson_index) DO UPDATE SET
            title            = EXCLUDED.title,
            content          = EXCLUDED.content,
            duration_minutes = EXCLUDED.duration_minutes
        `, [course.slug, lesson.index, lesson.title, lesson.content, lesson.duration]);
      }

      // Upsert quiz questions
      for (let i = 0; i < course.quiz.length; i++) {
        const q = course.quiz[i];
        await pool.query(`
          INSERT INTO lms_quiz_questions (course_slug, question_order, question, options, correct_index, explanation)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (course_slug, question_order) DO UPDATE SET
            question      = EXCLUDED.question,
            options       = EXCLUDED.options,
            correct_index = EXCLUDED.correct_index,
            explanation   = EXCLUDED.explanation
        `, [course.slug, i + 1, q.question, JSON.stringify(q.options), q.correct, q.explanation]);
      }
    }
    console.log(`[LMS] Synced ${COURSES.length} courses to DB`);
  } catch (e: any) {
    console.error('[LMS] DB sync failed:', e.message);
  }
}
