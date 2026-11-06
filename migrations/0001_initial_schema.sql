PRAGMA foreign_keys = ON;

CREATE TABLE areas (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  icon TEXT NOT NULL,
  image_key TEXT,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (area_id, name)
);

CREATE TABLE concerns (
  id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('form', 'guide')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT NOT NULL DEFAULT '',
  upload_enabled INTEGER NOT NULL DEFAULT 0 CHECK (upload_enabled IN (0, 1)),
  guide_text TEXT,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE concern_categories (
  concern_id TEXT NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (concern_id, category_id)
);

CREATE TABLE form_fields (
  id TEXT PRIMARY KEY,
  concern_id TEXT NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'textarea', 'email', 'date', 'select', 'multiselect')),
  label TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),
  options_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(options_json)),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE guide_images (
  id TEXT PRIMARY KEY,
  concern_id TEXT NOT NULL REFERENCES concerns(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  alt_text TEXT NOT NULL,
  caption TEXT,
  after_paragraph INTEGER NOT NULL DEFAULT 1 CHECK (after_paragraph > 0),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE admins (
  email TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_area ON categories(area_id, sort_order);
CREATE INDEX idx_concerns_area ON concerns(area_id, published, sort_order);
CREATE INDEX idx_form_fields_concern ON form_fields(concern_id, sort_order);
CREATE INDEX idx_guide_images_concern ON guide_images(concern_id, sort_order);
