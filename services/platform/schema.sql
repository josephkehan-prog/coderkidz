-- Suite platform schema. Display names only — never store real/full names.
CREATE TABLE IF NOT EXISTS classes (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  teacher_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS roster (
  class_code TEXT NOT NULL REFERENCES classes(code),
  name TEXT NOT NULL,
  team TEXT,
  PRIMARY KEY (class_code, name)
);

CREATE TABLE IF NOT EXISTS scores (
  class_code TEXT NOT NULL,
  game_id TEXT NOT NULL,
  season_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (class_code, game_id, season_id, player_name)
);

CREATE INDEX IF NOT EXISTS idx_scores_board
  ON scores (class_code, game_id, season_id, score DESC);
