CREATE TABLE IF NOT EXISTS exams (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, exam_date TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_exams_user_date ON exams(user_id, exam_date);
CREATE TABLE IF NOT EXISTS chapters (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE, subject TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'not_started' CHECK(status IN ('not_started','learning','revising','mastered')), created_at TEXT NOT NULL DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_chapters_user_exam ON chapters(user_id, exam_id);
