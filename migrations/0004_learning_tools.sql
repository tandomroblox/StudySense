CREATE TABLE IF NOT EXISTS flashcards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  prompt TEXT NOT NULL,
  answer TEXT NOT NULL,
  next_review TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_review ON flashcards(user_id, next_review);
CREATE TABLE IF NOT EXISTS practice_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  questions INTEGER NOT NULL CHECK(questions >= 1 AND questions <= 10000),
  correct INTEGER NOT NULL CHECK(correct >= 0 AND correct <= questions),
  practiced_on TEXT NOT NULL DEFAULT (date('now')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_practice_user_date ON practice_logs(user_id, practiced_on);
