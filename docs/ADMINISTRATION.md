# Administration

Einstieg: https://serviceportal.glennritter.de/admin/

Die Anmeldung verwendet die bestehende Cloudflare-Access-Anmeldeart. Für das
Serviceportal ist ausschließlich glenn.ritter@elimgeesthacht.de freigegeben.
Nach der Anmeldung stehen die bisherigen Bereiche-, Kategorien- und
Anliegeneditoren zur Verfügung. „Speichern“ schreibt dauerhaft in D1; eigene
Bereichs- und Anleitungsbilder werden in R2 gespeichert.

Die öffentliche Seite erhält nur veröffentlichte Bereiche und deren
veröffentlichte Anliegen. Entfernte Kategorien werden beim Speichern aus den
betroffenen Anliegen entfernt. Empfängeradressen erscheinen ausschließlich in
der Verwaltung. Bei parallelen Änderungen wird ein Konflikt gemeldet; Eingaben
bleiben im Editor erhalten. Einen zweiten Tab mit dem aktuellen Stand öffnen
und die Änderungen abgleichen. Abmeldung über den Link im Admin-Bereich.

## Technische Zuordnung

- Access-Anwendung: Serviceportal - Administration
- App-ID: de882c6d-1468-4eb7-b676-8cfac32300f6
- Policy-ID: 13381ac6-cbaa-4e39-873c-3030a35cc299
- Team-Domain: cold-cell-4312.cloudflareaccess.com
- Audience: CF_ACCESS_AUD in den Vorschau-Variablen in wrangler.jsonc
- Bestehender Anmeldeanbieter: e238d958-147a-4c5e-a2f6-ee9476cba2ee
- Geschützte Pfade: /admin, /admin/*, /api/admin, /api/admin/*
- Sessiondauer: acht Stunden
- Policy: nur die freigegebene E-Mail-Adresse; keine Everyone-Regel

Der Worker validiert das signierte Access-JWT bei jedem Admin-Dokument und jeder
Admin-API-Anfrage: RSA-Signatur, Key-ID, Algorithmus, Aussteller, Audience,
Gültigkeitszeit und E-Mail-Freigabe. Schreibende Methoden prüfen zusätzlich
die Origin. Fehlende Konfiguration und nicht abrufbare Schlüssel gewähren
keinen Zugriff. Es gibt keine Auth-Ausnahme für lokale Aufrufe.

GET /api/admin/portal liefert den vollständigen Stand samt Version.
PUT /api/admin/portal validiert das Datenmodell und speichert atomar, wenn die
mitgesandte Version aktuell ist. Konflikte liefern HTTP 409.
GET /api/portal liefert den öffentlichen Katalog ohne Empfängeradressen.
Die D1-Tabelle portal_content enthält JSON-Daten, Version, Änderungsdatum und
Identität der letzten Speicherung. Migration und Initialisierung sind in Git.

POST /api/admin/media akzeptiert PNG, WebP und JPEG bis 5 MiB, prüft MIME-Typ und
Dateisignatur und vergibt zufällige R2-Schlüssel. SVG-Uploads und externe
Bild-URLs werden nicht akzeptiert; die bekannte eingebettete WLAN-Illustration
bleibt nutzbar. Speichern verlangt existierende Bildreferenzen.
Admin-Bilder werden über /api/admin/media/<schlüssel> gelesen.
/media/<schlüssel> ist nur lesbar, solange ein veröffentlichtes Element darauf
verweist. Medienantworten werden nicht öffentlich zwischengespeichert.
Nicht mehr verwendete R2-Objekte bleiben vorerst erhalten.

## Prüfnachweise und Grenzen

npm run test:portal kompiliert die echte Worker-Implementierung und prüft sie mit
SQLite, R2-Testadapter und eigenen testweise signierten JWTs. Die Browserprüfung
umfasst Speichern/Neuladen, öffentliche Sichtbarkeit, zwei neue Entwürfe nach
Neuladen, Formularänderungen, Bereichs- und Anleitungsbilder, parallele Änderungen
und eine abgelaufene Sitzung. Auth-Tests prüfen gefälschte Signaturen, falsche
Audience/Identität, fehlende Anmeldung und CSRF. Nur temporäre Testdaten werden
angelegt; der veröffentlichte Worker enthält keinen Testzugang.

Zustellung des echten Access-Anmeldecodes und erste Benutzeranmeldung sind im
Browser des Benutzers zu prüfen. Der öffentliche Host ist aus der Agent-Umgebung
derzeit durch deren Netzwerkpolicy blockiert. Die bestehende Ehrenamt-Anwendung
und deren Policies bleiben unverändert. Der echte E-Mail-Versand benötigt die
gesonderten Secrets und Einstellungen aus EMAIL-VERSAND.md. Die aktuelle
Testphase leitet sämtliche Bereiche an glenn.ritter@elimgeesthacht.de weiter.
