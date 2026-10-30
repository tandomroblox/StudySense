CREATE TABLE IF NOT EXISTS desktop_login_codes (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_desktop_login_codes_expiry ON desktop_login_codes(expires_at);
