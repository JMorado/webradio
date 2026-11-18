CREATE TABLE programmes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  host TEXT NOT NULL,
  description TEXT NOT NULL,
  starts_on TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes BETWEEN 5 AND 1440),
  weekly INTEGER NOT NULL CHECK (weekly IN (0, 1)),
  published INTEGER NOT NULL CHECK (published IN (0, 1)),
  revision INTEGER NOT NULL DEFAULT 1
) STRICT;

CREATE INDEX published_programmes_by_date ON programmes (published, starts_on);

CREATE TABLE admin_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL
) STRICT;
