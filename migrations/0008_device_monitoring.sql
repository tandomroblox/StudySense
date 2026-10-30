-- Account-scoped aggregated usage snapshots from the user's own StudySense devices.
-- Stores app labels, website hostnames, and time totals only. No full URLs or page content.
CREATE TABLE IF NOT EXISTS monitoring_devices (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('windows','android')),
  device_name TEXT NOT NULL DEFAULT '',
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS monitoring_devices_user_seen ON monitoring_devices(user_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS monitoring_daily_usage (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES monitoring_devices(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  apps_json TEXT NOT NULL DEFAULT '{}',
  websites_json TEXT NOT NULL DEFAULT '{}',
  entertainment_seconds INTEGER NOT NULL DEFAULT 0 CHECK (entertainment_seconds BETWEEN 0 AND 86400),
  cooldown_until TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, device_id, day)
);
CREATE INDEX IF NOT EXISTS monitoring_daily_usage_user_day ON monitoring_daily_usage(user_id, day DESC);
