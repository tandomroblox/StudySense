CREATE TABLE IF NOT EXISTS tutor_chat_link_codes (
  code_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_tutor_chat_link_codes_expiry ON tutor_chat_link_codes(expires_at);
CREATE TABLE IF NOT EXISTS tutor_chat_links (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  linked_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(user_id, linked_user_id),
  CHECK(user_id <> linked_user_id)
);
CREATE INDEX IF NOT EXISTS idx_tutor_chat_links_reverse ON tutor_chat_links(linked_user_id);
