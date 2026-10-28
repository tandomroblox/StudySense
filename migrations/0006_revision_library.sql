-- Revision scheduling and a structured personal study library.
-- Additive-only schema: existing account and study data is preserved.
CREATE TABLE IF NOT EXISTS chapter_revision_state (
  chapter_id TEXT PRIMARY KEY NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  next_review_on TEXT NOT NULL DEFAULT (date('now')),
  last_reviewed_at TEXT,
  interval_days INTEGER NOT NULL DEFAULT 1 CHECK (interval_days BETWEEN 1 AND 60),
  repetitions INTEGER NOT NULL DEFAULT 0 CHECK (repetitions >= 0),
  last_rating TEXT NOT NULL DEFAULT 'new' CHECK (last_rating IN ('new','again','hard','good','easy')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_revision_state_user_due
  ON chapter_revision_state(user_id, next_review_on);

CREATE TABLE IF NOT EXISTS chapter_revision_logs (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  rating TEXT NOT NULL CHECK (rating IN ('again','hard','good','easy')),
  previous_interval_days INTEGER NOT NULL DEFAULT 0 CHECK (previous_interval_days BETWEEN 0 AND 60),
  next_interval_days INTEGER NOT NULL CHECK (next_interval_days BETWEEN 1 AND 60),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_revision_logs_user_date
  ON chapter_revision_logs(user_id, created_at);

CREATE TABLE IF NOT EXISTS study_library_items (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade INTEGER NOT NULL CHECK (grade BETWEEN 6 AND 10),
  subject TEXT NOT NULL,
  textbook TEXT NOT NULL DEFAULT '',
  book_part TEXT NOT NULL DEFAULT '',
  chapter_title TEXT NOT NULL DEFAULT '',
  item_type TEXT NOT NULL CHECK (item_type IN ('note','formula','definition','doubt')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_library_user_updated
  ON study_library_items(user_id, updated_at);
