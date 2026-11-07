# Migration und Veröffentlichung

Stand: 7. November 2026. Vorbereitung für die abgenommene Beta; ein Umzug wurde
noch nicht ausgeführt. Die aktive Seite bleibt `serviceportal.glennritter.de`.

## Entscheidungen für den Umzug

Vor dem Einrichten der Zielressourcen festlegen:

- Endgültiger Hostname, beispielsweise `serviceportal.elimgeesthacht.de` oder
  `helpdesk.elimgeesthacht.de`. Die Hauptwebsite der Gemeinde bleibt erhalten.
- Cloudflare-Konto der Gemeinde, verantwortliche Person und zwei erreichbare
  Administratoren. Access-Anmeldung und Maildomain müssen diesem Betrieb zugeordnet sein.
- Zuständige Empfänger je Bereich sowie Absenderdomain bei Resend.
- Zeitpunkt, kurze Änderungspause und Rückfallentscheidung.

Die Vorlage [wrangler.production.example.jsonc](../wrangler.production.example.jsonc)
enthält alle Worker-Bindings, aber absichtlich keine nutzbaren Konto-/Ressourcen-IDs.
Sie ist keine eingerichtete Produktionsumgebung. Für den Umzug als
`wrangler.production.jsonc` kopieren, Platzhalter ersetzen und die fertige
Konfiguration ohne Secrets versionieren. Andere Projekte oder Domains nicht ändern.

## Was zusammengehört

| Bestandteil | Aktuelle Quelle | Im Ziel erforderlich |
| --- | --- | --- |
| Anwendung und Illustrationen | GitHub `main`, `prototype/`, `src/` | Derselbe geprüfte Commit, neu gebaut |
| Inhalte einschließlich Entwürfen | D1 `portal_content`, Zeile `main` | JSON, IDs und Versionsnummer unverändert |
| Adminrechte | D1 `admins` mit Triggern | Aktive/inaktive Konten, Versionen und Schutz des letzten Kontos |
| Hochgeladene Bilder | R2 `elim-serviceportal-test-media`, Präfix `portal/` | Gleiche Objektschlüssel und passende Content-Types |
| Wiederholungsbelege | D1 `submission_receipts` | Metadaten samt Vorlagenversion und Fristen erhalten |
| Migrationen | `migrations/` und D1 `d1_migrations` | Abgeglichenes Schema und Migrationshistorie |
| Anmeldung | Eigene Access-Anwendung im bisherigen Konto | Neue App, Team-Domain, Audience und Einmalcode-Anbieter |
| Versand / Bot-Schutz | Worker-Secrets und Variablen | Eigene Resend-/Turnstile-Konfiguration für den Zielhost |

Die Vorschau und die alte API-Testumgebung teilen heute dieselbe D1-Datenbank und
denselben R2-Bucket. Für die Gemeinde separate Ressourcen anlegen. Die Quellressourcen
nicht löschen, zurücksetzen oder durch einen leeren Seed ersetzen.

Bildreferenzen sind relativ (`/media/<kennung>`); R2 verwendet dafür
`portal/<kennung>`. IDs und Pfade erhalten, dann funktionieren Anleitungsbilder,
Entwürfe und Direktlinks ohne Neuanlage. Git enthält nur Ausgangsinhalte und
eingebaute Illustrationen, keine nachträglichen Adminänderungen oder R2-Uploads.

## 1. Quellstand sichern

Alle Änderungen committen und auf `main` pushen; Commit und Deployment-Version
notieren. Einen Verantwortlichen für die folgende Änderungspause benennen.
Dateisicherungen enthalten Verwaltungsdaten und gehören in einen geschützten
Speicher außerhalb des Workspace, nicht nach GitHub.

```sh
npm run backup:source
npm run test:backup
mkdir -p backups/migration
npx --no-install wrangler d1 export DB --env preview --remote --output backups/migration/source.sql
```

`backup:source` erzeugt eine ZIP mit allen versionierten Arbeitsdateien und
SHA-256-Manifest. Neue Dateien vorher mit `git add` aufnehmen. Eine Kennzeichnung
im Manifest zeigt uncommittierte Änderungen. Diese ZIP ist ausschließlich eine
Quellcodesicherung; Datenbank, Medien und Secrets sind separat zu behandeln.
Ein Git-Bundle (`git bundle create backups/migration/source.bundle --all`) sichert
zusätzlich die lokale Git-Historie.

Für eine neue Arbeitskopie bevorzugt GitHub oder das Bundle klonen und den im
Manifest genannten Commit auschecken. Die ZIP lässt sich ohne Installation als
Offline-Oberfläche öffnen. Soll allein aus der ZIP weitergebaut werden, zuerst
ein lokales Git-Repository anlegen und die entpackten Dateien committen: Der
Asset-Build benötigt `git rev-parse` für seine Buildkennung. Das Originalmanifest
für die Zuordnung zum gesicherten Commit aufbewahren; der neue lokale Commit hat
eine andere Kennung. Erst danach `npm ci` und `npm run check:beta` ausführen.

R2 über ein S3-kompatibles Werkzeug sichern. Beispiel mit zuvor sicher
konfigurierten, auf die jeweiligen Buckets begrenzten rclone-Profilen:

```sh
rclone copy portal-source:elim-serviceportal-test-media backups/migration/r2 --include 'portal/**'
rclone check portal-source:elim-serviceportal-test-media backups/migration/r2 --include 'portal/**' --download
```

S3-Zugangsdaten nur im geschützten Profil, niemals im Repository oder Chat.
Objektanzahl, Größen und Dateiprüfsummen dokumentieren. Alle `portal/`-Objekte
sichern, auch Bilder von Entwürfen und derzeit nicht referenzierte Uploads.

Unmittelbar vor dem endgültigen Kopieren: Adminbearbeitung pausieren, laufende
Versandversuche abschließen lassen und neue Sendungen auf der Quelle für das
Wartungsfenster sperren. Danach finalen D1-Export und R2-Abgleich wiederholen.
Ein Export während laufender Änderungen ist keine verlässliche gemeinsame Momentaufnahme.

## 2. Zielkonto vorbereiten

Für die Arbeiten einen Cloudflare-API-Token mit passenden, auf das Zielkonto und
die Portalressourcen begrenzten Berechtigungen verwenden. Der bisherige Token
berechtigt nicht automatisch für ein anderes Konto. In der Cloud-Umgebung bleibt
er ein HTTP-Secret für `api.cloudflare.com`; keinen Tokenwert in Dateien übernehmen.

1. Eigene leere D1-Datenbank und eigenen privaten R2-Bucket anlegen. Kein öffentlicher
   Bucketzugriff und keine r2.dev-Freigabe; Medien werden vom Worker freigegeben.
2. Eigene Access-Anwendung für `/admin`, `/admin/*`, `/api/admin` und `/api/admin/*`
   am Zielhost anlegen. Einmalcode-Anbieter einrichten. Team-Domain und neue
   Audience in die Zielkonfiguration übernehmen. Identitätsanmeldung ohne Bypass;
   die eigentlichen Rechte bleiben in D1. Bestehende Ehrenamt-Apps nicht bearbeiten.
3. Turnstile für den Zielhost einrichten; Sitekey in die Konfiguration und Secret
   in den Zielworker. Der Worker prüft zusätzlich Hostname und Aktion `service-request`.
4. Versanddomain in Resend verifizieren, erforderliche DNS-Einträge prüfen und
   eigenen beschränkten Schlüssel hinterlegen. SPF/DKIM und Zustelltest gehören
   zur Abnahme. Access-Einmalcodes und Resend-Anfragen sind getrennte Dienste.
5. `RESEND_API_KEY` und `TURNSTILE_SECRET_KEY` als Worker-Secrets setzen, etwa über
   das Dashboard oder interaktive `wrangler secret put` mit der Zielkonfiguration.
   Alte Secrets können nicht aus dem Worker ausgelesen werden; bei Bedarf neu ausstellen.
6. Account-ID, DB-ID, Bucket, Rate-Limit-Namespace, Route, `PUBLIC_HOSTNAME`,
   Access-Werte, Absender und Sitekey in der Konfiguration prüfen. Cron zur
   Bereinigung der Versandbelege erhalten. `workers_dev` und Preview-URLs bleiben aus.

Die Vorlage startet mit `MAIL_ENABLED=false` und dem bisherigen Testempfänger.
Für Abnahmemails später bewusst aktivieren; den Testempfänger zunächst beibehalten.
Die vorhandenen Skripte `configure-admin-authentication.py` und
`initialize-portal.cjs` sind an die bisherige Vorschau gebunden. Nicht als
Migrationsskripte für das Zielkonto ausführen.

## 3. Daten übernehmen und Wiederherstellung prüfen

Vollständigen SQL-Export in die **leere** Zieldatenbank importieren, bevor dort
Migrationen oder Initialisierungen ausgeführt werden:

```sh
npx --no-install wrangler d1 execute DB --config wrangler.production.jsonc --remote --file backups/migration/source.sql
npx --no-install wrangler d1 migrations list DB --config wrangler.production.jsonc --remote
rclone copy backups/migration/r2 portal-target:elim-serviceportal-production-media --immutable
rclone check backups/migration/r2 portal-target:elim-serviceportal-production-media --download
```

Das SQL enthält bereits Schema, Daten und Trigger. Vor weiteren Migrationen
prüfen, ob `d1_migrations` mit übernommen wurde. Bei fehlender Historie den
tatsächlich importierten Schemastand fachgerecht abgleichen und dokumentieren;
vorhandene `CREATE TABLE`-/`ALTER TABLE`-Migrationen nicht blind erneut anwenden.
Nie die produktive Quelle als Versuchsziel für einen Restore verwenden.

Vergleichen: `portal_content.version`, SHA-256 des unveränderten `data_json`,
Anzahl der Bereiche/Anliegen, aktive/inaktive Admins, Trigger, Beleganzahl und
`mail_template_version`. Alle gespeicherten `/media/`-Referenzen müssen im Ziel
als `portal/`-Objekte existieren. Bytes und Content-Type der Bilder prüfen.

Bereits unbestätigte Sendungen dürfen nicht mit neuer Kennung nochmals verschickt
werden. Vor einem Wechsel des Resend-Kontos unklare Vorgänge klären; Idempotenz
über verschiedene Providerkonten hinweg ist nicht zugesichert. Den Ausgangszustand
und die Quelle für Rückfragen erhalten. Eine Migration sendet selbst keine E-Mails.

## 4. Bauen, veröffentlichen und abnehmen

```sh
npm ci
npm run check:preview
npm run test:portal
npm run test:mail
node scripts/check-prototype.cjs
npm run test:backup
npm run build:preview
npx --no-install wrangler deploy --config wrangler.production.jsonc --dry-run
```

`build:preview` baut trotz seines bisherigen Namens die vollständige persistente
Oberfläche; `npm run build` baut die separate alte Katalog-API-Variante. Die
Zielvorlage verwendet deshalb `public-preview/`. Ein Umbenennen dieser Abläufe
ist für die Migration nicht erforderlich.

Vor dem tatsächlichen Zieldeployment müssen Hostname, Datenabgleich und Zeitpunkt
abgestimmt sein. `wrangler deploy --config wrangler.production.jsonc` aktiviert die
angegebene Custom Domain. Der bisherige Befehl `deploy:preview` veröffentlicht
weiterhin ausschließlich auf `serviceportal.glennritter.de`.

Abnahme im Browser am Zielhost, einschließlich Smartphone:

- Startseite, Suche, bestehende Bereichs-/Formularlinks und Richtext-Anleitungen.
- Veröffentlichte Bilder sichtbar; Entwürfe, Empfänger und unveröffentlichte Bilder
  anonym nicht zugänglich. `/api/health` prüft nur die Datenbankverbindung.
- Anmeldung mit zwei aktiven Admins, Speichern und Neuladen, Inaktivierung sowie
  Schutz des eigenen und letzten aktiven Kontos. Ungültige/alte JWTs sperren.
- Turnstile am Zielhost, Formular und Anleitungsrückfrage mit Anhang, HTML-Mail,
  Reply-To und echte Zustellung im Testpostfach. Fehler bestätigen keinen Versand.
- Datenschutz-, Impressums- und Kontaktangaben sowie interne Zuständigkeit für
  Betrieb, Postfächer, Störungen und regelmäßige Sicherungen abschließen.
- HTML-Metadatum `serviceportal-build` entspricht dem abgenommenen Commit.

Es gibt derzeit keine automatische Eingangs-E-Mail an Anfragende. Sie sehen die
Bestätigung im Browser; Antworten erfolgen im zuständigen Postfach.

## 5. Freigabe und Rückfallweg

Die Entfernung des Footer-Hinweises hebt den Testempfänger **nicht** auf.
Erst auf ausdrücklichen Auftrag `MAIL_TEST_TO` entfernen und die echten
Bereichsadressen in der Verwaltung einstellen; auch der Vorschlag für neue
Bereiche muss geprüft werden. Je Bereich eine kontrollierte Zustellprobe durchführen.

Erst nach Abnahme bestehende Links/Weiterleitungen umstellen. Alte Hash-Links
erhalten (`#form/...` und `#area/...`); Fragmente erreichen den Server nicht und
müssen beim gewählten Weiterleitungsweg im Browser mitgeprüft werden.
POST-Anfragen nicht ungeprüft zwischen Hosts weiterleiten: Origin, Turnstile und
Versandkennungen gehören zum ursprünglichen Vorgang.

Vor dem Wechsel bisherige DNS-/Weiterleitungswerte und Worker-Version notieren.
Bei fehlgeschlagener Abnahme die Quellseite wieder freigeben und die bisherigen
Links beibehalten. Bei Problemen nach Freigabe zuerst neue Sendungen stoppen,
unklare Vorgänge prüfen und das Team informieren. Ein Worker-Rollback stellt
keine D1-/R2-Daten wieder her; zwischenzeitliche Adminänderungen müssen vor einem
Daten-Restore gesichert und abgeglichen werden. Quelle und Sicherungen erst nach
einer vereinbarten Beobachtungszeit aufräumen.

Regelmäßig D1 und R2 gemeinsam sichern und die Wiederherstellung in separaten
Ressourcen testen. Löschfrist und geschützten Ablageort der Sicherungen festlegen.
Der bestehende Cron entfernt nur technische Versandbelege nach sieben Tagen,
nicht ungenutzte Portalbilder oder externe Sicherungen.
