-- Receipt metadata only: no message, email address, IP or attachment contents.
CREATE TABLE submission_receipts (
  request_id TEXT PRIMARY KEY,
  digest TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent')),
  provider_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_submission_receipts_created_at ON submission_receipts(created_at);
