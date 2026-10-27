
-- Allow accounts to use Google sign-in without a local password.
-- Preserve existing users and their password hashes.

CREATE TABLE users_new (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    google_sub TEXT UNIQUE,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        password_hash IS NOT NULL OR google_sub IS NOT NULL
    )
);

INSERT INTO users_new (id, email, password_hash, created_at)
SELECT id, email, password_hash, created_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;
