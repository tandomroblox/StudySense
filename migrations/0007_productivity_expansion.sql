-- StudySense productivity expansion: calendar, mistake notebook, and study-session history.
-- Additive-only migration. Existing user data and tables are untouched.
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('study','assignment','revision','personal')),
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  completed INTEGER NOT NULL DEFAULT 0 CHECK (completed IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS calendar_events_user_start ON calendar_events(user_id, starts_at);
CREATE TABLE IF NOT EXISTS mistake_notebook (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL DEFAULT '',
  question TEXT NOT NULL,
  user_answer TEXT NOT NULL DEFAULT '',
  correct_answer TEXT NOT NULL DEFAULT '',
  explanation TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual',
  mastered INTEGER NOT NULL DEFAULT 0 CHECK (mastered IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS mistake_notebook_user_created ON mistake_notebook(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS study_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT '',
  topic TEXT NOT NULL DEFAULT '',
  started_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 1 AND 1440),
  session_type TEXT NOT NULL DEFAULT 'focus',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS study_sessions_user_started ON study_sessions(user_id, started_at DESC);
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light','system')),
  notifications_enabled INTEGER NOT NULL DEFAULT 1 CHECK (notifications_enabled IN (0,1)),
  reminder_time TEXT NOT NULL DEFAULT '18:00',
  weekly_goal_minutes INTEGER NOT NULL DEFAULT 600 CHECK (weekly_goal_minutes BETWEEN 30 AND 10080),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
