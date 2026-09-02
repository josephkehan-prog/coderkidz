-- Suite platform schema. ZERO child PII by design: no names, not even
-- display names. A class is a set of anonymous seats; a scholar claims a
-- seat with a seat code and invents a persona (mayor name + avatar).
-- The teacher maps seat codes to real students on paper, offline.
CREATE TABLE IF NOT EXISTS classes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_key TEXT NOT NULL,
  -- JSON array of team names, e.g. ["Hamilton","Alfred"]. Empty = no teams.
  teams TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seats (
  class_code TEXT NOT NULL REFERENCES classes(code),
  seat_code TEXT NOT NULL,
  persona TEXT,            -- invented mayor name, NULL until claimed
  avatar TEXT,             -- one emoji
  team TEXT,
  claimed_at TEXT,
  PRIMARY KEY (class_code, seat_code)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_seats_persona
  ON seats (class_code, persona);

CREATE TABLE IF NOT EXISTS scores (
  class_code TEXT NOT NULL,
  game_id TEXT NOT NULL,
  season_id TEXT NOT NULL,
  seat_code TEXT NOT NULL,
  score INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (class_code, game_id, season_id, seat_code)
);

CREATE INDEX IF NOT EXISTS idx_scores_board
  ON scores (class_code, game_id, season_id, score DESC);

-- Abuse control for the open, self-serve class-creation endpoint.
-- Stores a SHA-256 hash of (day + client IP), never the IP itself, so the
-- zero-PII posture holds: rows are unlinkable to a person and roll over daily.
CREATE TABLE IF NOT EXISTS creation_limits (
  ip_hash TEXT NOT NULL,
  window_day TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, window_day)
);
