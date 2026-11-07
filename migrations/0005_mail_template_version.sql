-- Keep retries of previously pending submissions on their original mail format.
-- Only technical metadata is stored, never mail content or contact details.
ALTER TABLE submission_receipts ADD COLUMN mail_template_version INTEGER NOT NULL DEFAULT 1;
