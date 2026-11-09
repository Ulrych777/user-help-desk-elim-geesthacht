# Elim Kirche Serviceportal

**Seite:** https://serviceportal.glennritter.de

**Verwaltung:** https://serviceportal.glennritter.de/admin/

**Stand:** Beta-Abnahme durch den Benutzer am 7. November 2026. Der Versand bleibt
auf das bisherige Testpostfach begrenzt; ein Domain-/Kontoumzug ist noch nicht erfolgt.
Übergabe und Vorbereitung: [Beta-Stand](docs/BETA-UEBERGABE.md) und
[Migration und Veröffentlichung](docs/MIGRATION-UND-VEROEFFENTLICHUNG.md).

Das Serviceportal enthält die vollständige Oberfläche mit globaler Suche,
Bereichssuche, Kategorien, Formularen, Anleitungen und Bildverwaltung.
Die öffentliche Seite lädt ausschließlich veröffentlichte Inhalte aus D1.
Empfängeradressen und Entwürfe werden nur an angemeldete Administratoren geliefert.

## Anmeldung und dauerhafte Verwaltung

Cloudflare Access schützt /admin, /admin/*, /api/admin und /api/admin/*.
Verwendet wird derselbe Anmeldeanbieter wie in der bestehenden Ehrenamtplattform.
Das Serviceportal hat eine eigene Access-Anwendung. Cloudflare bestätigt die
E-Mail-Identität; die aktive Berechtigung kommt aus der Datenbank.
Das erste Konto ist glenn.ritter@elimgeesthacht.de.

Unter **Administratoren** lassen sich weitere Konten mit Name und E-Mail-Adresse
anlegen, inaktiv setzen, wieder aktivieren und löschen. Das eigene Konto sowie
der letzte aktive Administrator sind geschützt. Der Server prüft diese Regeln
und die Datenbank verhindert zusätzlich das Entfernen des letzten aktiven
Zugangs. Eine Inaktivierung sperrt auch bestehende Sitzungen beim nächsten
geschützten Aufruf. Es werden keine Einladungsmails automatisch verschickt.

Der Worker prüft zusätzlich kryptografisch die JWT-Signatur, Aussteller,
Audience, Gültigkeitsdauer und freigegebene E-Mail-Adresse. Ein behaupteter
Identitätsheader genügt nicht. Schreibzugriffe benötigen außerdem die passende
Origin. Es gibt keinen lokalen Authentifizierungs-Bypass.

Bereiche, Kategorien, Empfängeradressen, Anliegen, Formularfelder und
Anleitungstexte werden dauerhaft in D1 gespeichert. Eigene Bereichs- und
Anleitungsbilder liegen in R2. Unveröffentlichte Bilder sind nur über die
geschützte Admin-API lesbar. Uploads werden auf Größe, MIME-Typ und Dateisignatur
geprüft und erhalten zufällige Speicherpfade.

Eine Versionsnummer verhindert das Überschreiben neuerer Änderungen durch
einen älteren Browser-Tab. Bei Konflikten oder abgelaufener Anmeldung bleiben
die Eingaben im Editor erhalten.

Der echte E-Mail-Versand über Resend ist implementiert und wird erst aktiviert,
wenn die erforderlichen Worker-Secrets vorhanden sind. In der Testphase gehen
alle Anfragen an glenn.ritter@elimgeesthacht.de. Der Absender heißt Serviceportal;
die E-Mail-Adresse des Anfragenden wird als Reply-To gesetzt.
Der Portalserver speichert weder Nachrichtentexte noch Anfrageanhänge dauerhaft.
Details und Aktivierung: [E-Mail-Versand](docs/EMAIL-VERSAND.md).

## Inhalte und Quellcode

Die vollständigen Ausgangsinhalte liegen in seeds/portal.json: drei Bereiche
und neun Anliegen einschließlich Anleitung und eingebetteter Bildreferenzen.
Die Tabelle portal_content enthält den versionierten gemeinsamen Inhaltsstand,
Änderungsdatum und Identität der letzten Speicherung. Ein einzelnes bedingtes
SQL-Update speichert zusammengehörige Änderungen atomar. Die früheren
normalisierten Tabellen bleiben für die separate API-Testumgebung erhalten.

npm run db:initialize:preview initialisiert mittels INSERT OR IGNORE nur einmal.
Bestehende Admin-Änderungen werden bei Deployments nicht durch Beispieldaten
ersetzt. Ein geänderter Seed allein ändert keine bestehende Datenbank.

Die Oberflächenquellen liegen unter prototype/ in portal.template.html,
portal.css, form-controls.css und portal.js. npm run build:prototype erzeugt
prototype/index.html. Diese eigenständige Offline-Datei bleibt als Prototyp
mit temporärer Admin-Vorschau nutzbar.

npm run build:preview erzeugt unter public-preview/ die persistente Variante.
Die alten Links mit /#admin/... führen auf /admin/#admin/... weiter.
Die HTML-Metadaten serviceportal-build nennen den veröffentlichten Git-Commit.

## Lokal entwickeln

Voraussetzung: Node.js 24, npm und Python 3 für Sicherung/Prüfung. In der verwalteten Cloud-Umgebung:

    export npm_config_cache=/workspace/.cache/npm
    export XDG_CONFIG_HOME=/workspace/.config
    export WRANGLER_SEND_METRICS=false
    export CI=true
    npm ci
    npm run build:preview
    npx --no-install wrangler d1 migrations apply DB --env preview --local --persist-to=.wrangler/state
    node scripts/initialize-portal.cjs
    npx --no-install wrangler dev --env preview --local --persist-to=.wrangler/state --ip 127.0.0.1 --port 8788

Die öffentliche Seite und /api/portal benötigen lokal keinen Cloudflare-Token.
Für echte Admin-Aufrufe sind eine gültige Access-Anmeldung und die öffentlichen
JWKS des Teams erforderlich. npm run test:portal prüft die echte
Worker-Implementierung mit SQLite, R2-Testadapter, eigenen testweise signierten
JWTs und Chromium. Nur der Testprozess stellt seine eigenen öffentlichen
Testschlüssel bereit; der veröffentlichte Worker hat keinen Testzugang.

## Prüfen, committen und veröffentlichen

Der Benutzer testet die Website und gibt im Chat Feedback. Änderungen werden
geprüft, auf GitHub main committed und anschließend auf dieselbe URL
veröffentlicht. Ein GitHub-Push allein löst kein Deployment aus.

    npm run check:preview
    npm run test:portal
    npm run test:mail
    node scripts/check-prototype.cjs
    npm run test:design
    git add <bearbeitete-Dateien>
    git commit -m "Änderung beschreiben"
    git push origin main
    npm run deploy:preview

deploy:preview prüft Build und TypeScript, führt einen Wrangler-Trockenlauf aus,
vergleicht den sauberen lokalen Stand mit GitHub main, wendet Migrationen an,
initialisiert fehlende Portal-Inhalte und veröffentlicht Worker und Assets.
Vorhandene Portal-Inhalte bleiben erhalten. Cloudflare verwaltet DNS und TLS
für die Custom Domain; alternative workers.dev-Zugänge der Vorschau sind deaktiviert.

Cloudflare-Zugangsdaten ausschließlich als HTTP-Secret CLOUDFLARE_API_TOKEN für
api.cloudflare.com hinterlegen. Access-Team und Audience sind keine Secrets.
Weitere Administratoren werden ausschließlich in der geschützten Verwaltung
gepflegt; dafür ist kein Deployment und keine Änderung an Cloudflare-Listen nötig.
Nach dem erstmaligen Deployment der D1-Rechteverwaltung stellt
python3 scripts/configure-admin-authentication.py nur die Serviceportal-Policy
auf Identitätsprüfung um. Der Worker entscheidet weiter anhand aktiver Konten
in D1 über den Zugriff. Die statische ADMIN_EMAILS-Variable entfällt.

Die separate Wrangler-Umgebung test unter
https://elim-serviceportal-test.glenn-ritter5994.workers.dev bleibt für die alte
normalisierte Katalog-API bestehen. npm run dev und node scripts/check-catalog.cjs
prüfen diesen getrennten Ablauf. Sie ist nicht die maßgebliche Entwicklungsseite.

Weitere Informationen: [Administration](docs/ADMINISTRATION.md),
[E-Mail-Versand](docs/EMAIL-VERSAND.md),
[Anleitungseditor](docs/ANLEITUNGS-EDITOR.md),
[Gestaltung](docs/GESTALTUNG-UND-TEXTE.md),
[Projektplan](docs/PROJEKTPLAN.md), [historische Rekonstruktion](docs/WIEDERHERSTELLUNG.md),
[Bildherkunft](prototype/assets/README.md).

Raleway ist lokal in vier Schnitten eingebettet; der Marken-Zusatz „Serviceportal“
behält seine Systemschrift. Herkunft und Lizenz: [Schriften](prototype/fonts/README.md).
`npm run test:design` prüft Typografie, gemeinsame Seitenlinien und das responsive
Raster von 320 bis 2560 px ohne externe Schriftanfragen.

Die vollständige Beta-Prüfung lässt sich mit `npm run check:beta` ausführen.
`npm run backup:source` sichert die versionierten Arbeitsdateien einschließlich
Worker, Migrationen, Lockfile und Konfiguration nach `backups/`. Neue Dateien
vorher zu Git hinzufügen. D1-Inhalte, R2-Uploads und Secrets sind nicht Teil der
Quellcodesicherung; der Migrationsleitfaden beschreibt die getrennte Sicherung.
