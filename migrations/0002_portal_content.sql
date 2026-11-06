CREATE TABLE portal_content (
  id TEXT PRIMARY KEY CHECK (id = 'main'),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  data_json TEXT NOT NULL CHECK (json_valid(data_json)),
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by TEXT
);
