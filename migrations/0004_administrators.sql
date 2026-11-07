-- The pre-existing table is also created here for isolated portal installations.
CREATE TABLE IF NOT EXISTS admins (
  email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE admins ADD COLUMN version INTEGER NOT NULL DEFAULT 1;
CREATE UNIQUE INDEX idx_admins_email_casefold ON admins(lower(email));

-- Initial migration only. Deployments must never recreate a deleted account.
INSERT INTO admins (email, display_name, active)
SELECT 'glenn.ritter@elimgeesthacht.de', 'Glenn Ritter', 1
WHERE NOT EXISTS (SELECT 1 FROM admins);

CREATE TRIGGER admins_keep_last_active_on_update
BEFORE UPDATE OF active ON admins
WHEN OLD.active = 1 AND NEW.active = 0
  AND (SELECT COUNT(*) FROM admins WHERE active = 1) <= 1
BEGIN
  SELECT RAISE(ABORT, 'last_active_admin');
END;

CREATE TRIGGER admins_keep_last_active_on_delete
BEFORE DELETE ON admins
WHEN OLD.active = 1 AND (SELECT COUNT(*) FROM admins WHERE active = 1) <= 1
BEGIN
  SELECT RAISE(ABORT, 'last_active_admin');
END;
