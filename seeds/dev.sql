PRAGMA foreign_keys = ON;

INSERT OR REPLACE INTO areas
  (id, slug, name, description, recipient_email, icon, image_key, published, sort_order)
VALUES
  ('it', 'it', 'IT', 'Unterstützung bei Computern, Software, Netzwerk und mehr.', 'it@example.org', 'it', 'areas/it.webp', 1, 10),
  ('haus', 'haus-und-hof', 'Haus & Hof', 'Anliegen rund um Gebäude, Technik und Außenanlagen.', 'hausmeister@example.org', 'house', 'areas/haus.webp', 1, 20),
  ('finanzen', 'finanzbuchhaltung', 'Finanzbuchhaltung', 'Fragen zu Rechnungen, Zahlungen und finanziellen Prozessen.', 'finanzen@example.org', 'finance', 'areas/finanzen.webp', 1, 30);

INSERT OR REPLACE INTO categories (id, area_id, name, sort_order) VALUES
  ('it-hilfe', 'it', 'Hilfe & Störungen', 10),
  ('it-konten', 'it', 'Konten & Zugänge', 20),
  ('it-software', 'it', 'Software & Zusammenarbeit', 30),
  ('haus-gebaeude', 'haus', 'Gebäude & Ausstattung', 10),
  ('haus-aussen', 'haus', 'Außenanlagen', 20),
  ('finanzen-erstattungen', 'finanzen', 'Erstattungen', 10);

INSERT OR REPLACE INTO concerns
  (id, area_id, slug, type, title, description, keywords, upload_enabled, guide_text, published, sort_order)
VALUES
  ('it-allgemein', 'it', 'allgemeine-it-anfrage', 'form', 'Allgemeine IT-Anfrage', 'Du brauchst Hilfe oder bist unsicher, welches Anliegen passt?', 'Hilfe Technik Computer Drucker Störung', 1, NULL, 1, 10),
  ('microsoft365', 'it', 'microsoft-365-konto', 'form', 'Microsoft-365-Konto beantragen', 'Ein neues Konto für deine Mitarbeit in der Gemeinde anfragen.', 'Microsoft Office Teams E-Mail Zugang Benutzer Lizenz M365', 0, NULL, 1, 20),
  ('wlan-anleitung', 'it', 'wlan-verbindung-pruefen', 'guide', 'WLAN-Verbindung selbst prüfen', 'Prüfe die häufigsten Ursachen einer fehlenden WLAN-Verbindung.', 'WLAN Internet Verbindung Flugmodus', 0, 'Prüfe zuerst in den Einstellungen deines Geräts, ob WLAN eingeschaltet und der Flugmodus ausgeschaltet ist.\n\nWähle das von der Gemeinde für dich vorgesehene WLAN.\n\nWenn die Verbindung weiterhin nicht klappt, beschreibe uns Ort und Gerät.', 1, 30),
  ('haus-schaden', 'haus', 'schaden-melden', 'form', 'Schaden oder Defekt melden', 'Melde einen Schaden an Gebäude, Ausstattung oder Außenanlage.', 'Schaden Defekt Gebäude Saal Außenanlage', 1, NULL, 1, 10),
  ('erstattung', 'finanzen', 'auslagenerstattung', 'form', 'Auslage erstatten lassen', 'Reiche eine private Auslage für die Gemeinde ein.', 'Erstattung Beleg Rechnung Ausgabe', 1, NULL, 1, 10);

INSERT OR REPLACE INTO concern_categories (concern_id, category_id) VALUES
  ('it-allgemein', 'it-hilfe'),
  ('microsoft365', 'it-konten'),
  ('microsoft365', 'it-software'),
  ('wlan-anleitung', 'it-hilfe'),
  ('haus-schaden', 'haus-gebaeude'),
  ('erstattung', 'finanzen-erstattungen');

INSERT OR REPLACE INTO form_fields
  (id, concern_id, type, label, required, options_json, sort_order)
VALUES
  ('m365-team', 'microsoft365', 'text', 'In welchem Team arbeitest du mit?', 1, '[]', 10),
  ('haus-ort', 'haus-schaden', 'text', 'Wo befindet sich der Schaden?', 1, '[]', 10),
  ('haus-art', 'haus-schaden', 'select', 'Was ist betroffen?', 1, '["Gebäude","Ausstattung","Außenanlage","Sonstiges"]', 20),
  ('erstattung-betrag', 'erstattung', 'text', 'Betrag', 1, '[]', 10),
  ('erstattung-datum', 'erstattung', 'date', 'Datum der Ausgabe', 1, '[]', 20);
