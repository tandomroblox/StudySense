CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  grade INTEGER NOT NULL DEFAULT 9 CHECK (grade BETWEEN 6 AND 10),
  school TEXT NOT NULL DEFAULT '',
  daily_goal_minutes INTEGER NOT NULL DEFAULT 60 CHECK (daily_goal_minutes BETWEEN 15 AND 600),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
