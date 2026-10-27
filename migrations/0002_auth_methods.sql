-- Safe, additive migration: preserve the existing users table and its task foreign keys.
-- Google identity can be added without rebuilding/dropping users.
ALTER TABLE users ADD COLUMN google_sub TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_sub
  ON users(google_sub)
  WHERE google_sub IS NOT NULL;
