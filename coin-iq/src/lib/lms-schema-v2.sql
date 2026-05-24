-- LMS Schema v2 — stores all course content in DB
-- Run this after lms-schema.sql

-- Extend lms_courses with full metadata
ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS icon VARCHAR(10) DEFAULT '📚';
ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS color VARCHAR(100) DEFAULT 'bg-gray-50 border-gray-200';
ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS quiz_count INTEGER DEFAULT 0;
ALTER TABLE lms_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Lessons table
CREATE TABLE IF NOT EXISTS lms_lessons (
  id SERIAL PRIMARY KEY,
  course_slug VARCHAR(100) NOT NULL REFERENCES lms_courses(slug) ON DELETE CASCADE,
  lesson_index INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_slug, lesson_index)
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS lms_quiz_questions (
  id SERIAL PRIMARY KEY,
  course_slug VARCHAR(100) NOT NULL REFERENCES lms_courses(slug) ON DELETE CASCADE,
  question_order INTEGER NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,        -- ["option1", "option2", ...]
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_slug, question_order)
);

CREATE INDEX IF NOT EXISTS idx_lms_lessons_course ON lms_lessons(course_slug);
CREATE INDEX IF NOT EXISTS idx_lms_quiz_course ON lms_quiz_questions(course_slug);
