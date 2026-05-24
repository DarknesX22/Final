-- LMS Tables for Coin-IQ Learning Module

CREATE TABLE IF NOT EXISTS lms_courses (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(20) DEFAULT 'beginner',   -- beginner | intermediate | advanced
  duration_minutes INTEGER DEFAULT 30,
  lesson_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lms_user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_slug VARCHAR(100) NOT NULL,
  lesson_index INTEGER NOT NULL DEFAULT 0,  -- which lesson they're on
  completed_lessons INTEGER[] DEFAULT '{}', -- array of completed lesson indices
  quiz_score INTEGER,                        -- null = not taken, 0-100
  quiz_passed BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_slug)
);

CREATE TABLE IF NOT EXISTS lms_certificates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  course_slug VARCHAR(100) NOT NULL,
  certificate_id VARCHAR(64) UNIQUE NOT NULL,  -- public shareable ID
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_slug)
);

CREATE INDEX IF NOT EXISTS idx_lms_progress_user ON lms_user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_progress_course ON lms_user_progress(course_slug);
CREATE INDEX IF NOT EXISTS idx_lms_certs_user ON lms_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_lms_certs_id ON lms_certificates(certificate_id);
