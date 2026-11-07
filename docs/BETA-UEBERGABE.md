# Beta-Übergabe

Stand: 7. November 2026. Der Benutzer betrachtet die Beta funktional als fertig.
Aktive URL: https://serviceportal.glennritter.de, Verwaltung unter `/admin/`.

## Vorhandener Stand

- Öffentlicher Katalog aus D1 mit Suche, Bereichen, Kategorien, Formularen und
  Richtext-Anleitungen. Vorhandene Direktlinks und Inhalts-IDs bleiben erhalten.
- Geschützte dauerhafte Verwaltung, eigene Bereichsbilder, Bilder im Textfluss,
  sortierbare Formularfelder und Administratorverwaltung mit Selbst-/Letztschutz.
- Resend-Versand mit HTML/Text, Reply-To, Anhängen, Turnstile, Ratenbegrenzung,
  serverseitiger Prüfung und Wiederholungsschutz. Der Benutzer hat Anmeldung,
  Speichern und echte Zustellung im bisherigen Testbetrieb bestätigt.
- Einheitliche Schrift-/Feldgestaltung, weiche Kartenränder, orange/blaue Tags,
  illustrierte Leer- und Erfolgszustände, angepasster Kalender und reduzierte
  Bewegung auf Wunsch des Betriebssystems.
- Footer ohne Testbetriebszeile; der Adminzugang ist eine orange Schaltfläche mit
  weichen Innenkanten. Der serverseitige Testempfänger bleibt unverändert aktiv.

## Dokumentation und Bereinigung

Die Betriebs- und Bedienungsdokumentation liegt in
[Administration](ADMINISTRATION.md), [Versand](EMAIL-VERSAND.md),
[Anleitungseditor](ANLEITUNGS-EDITOR.md) und [Gestaltung](GESTALTUNG-UND-TEXTE.md).
README und Projektplan unterscheiden den aktuellen Betrieb jetzt vom historischen
Offline-Prototyp. Die Rekonstruktionsnotizen bleiben als Historie gekennzeichnet.

Die Bereinigung entfernt die ungenutzte Footer-Zeile samt CSS/JavaScript und einen
überholten Kommentar. Das Sicherungsskript erfasst jetzt die ganze versionierte
Anwendung einschließlich `src/`, Migrationen, Seeds, Abhängigkeitssperrdatei und
Konfiguration. Archivprüfsummen und tatsächliches Entpacken werden geprüft.

Es gab bewusst keinen umfassenden Umbau der inzwischen getesteten Anwendung.
`portal.js` enthält weiterhin Oberfläche und Offline-Ausgangsinhalte; der Editor,
die Feldsortierung und der Kalender sind bereits eigene Module. Die getrennte alte
Katalog-API und ihre Tabellen bleiben erhalten, weil sie noch eine Testumgebung
versorgen. Größere Modularisierung und Umbenennung der Buildbefehle sind mögliche
spätere Wartungsarbeiten, keine Voraussetzung für die Übergabe.

## Reproduzierbar prüfen

```sh
npm ci
npm run check:beta
```

Enthalten sind Build, TypeScript, Wrangler-Trockenlauf, Tests der echten
Worker-Implementierung mit SQLite und Test-JWTs, Admin-/Formular-Browsertests,
simulierter Mailversand, Offline-Oberfläche bei mehreren Bildschirmgrößen und
Quellcode-Sicherung samt Wiederherstellung. Die Tests senden keine echten E-Mails.
Vor `test:backup` neue Dateien mit `git add` aufnehmen, damit sie versioniert sind.

Das Deployment erfolgt nach sauberem Commit und Push mit `npm run deploy:preview`.
Buildkennung im HTML und Cloudflare-Version dokumentieren. Ein Push allein
aktualisiert die Seite nicht. Die öffentliche Live-URL ist aus der verwalteten
Agent-Umgebung derzeit netzwerkseitig gesperrt; lokale Browserprüfung und die
Deploymentbestätigung ersetzen keine echte Zielhost-Abnahme im Benutzerbrowser.

## Noch vor regulärem Gemeindebetrieb

- Endgültige Domain und Konto festlegen, Access/Turnstile und verifizierten
  Mailabsender im Zielkonto einrichten; Daten und Bilder gesichert übernehmen.
- Datenschutz-, Impressums- und Kontaktinformationen sowie Zuständigkeit und
  Sicherungs-/Wiederherstellungsrhythmus abschließen.
- Testempfänger nur auf ausdrücklichen Auftrag abschalten, echte Bereichspostfächer
  einstellen und je Bereich den Versand prüfen. Diese Umstellung ist noch offen.
- Keine automatische Eingangs-Mail an Anfragende, keine Ticketverwaltung und keine
  dauerhafte Speicherung von Anfragen/Anhängen im Portal versprechen. Technische
  Versandbelege bleiben sieben Tage; ungenutzte Portalbilder bleiben vorerst in R2.
- Zielhost, Medien, Adminrechte, Antwortfunktion und Rückfallweg gemeinsam abnehmen.

Konkrete Schritte und Konfigurationsvorlage:
[Migration und Veröffentlichung](MIGRATION-UND-VEROEFFENTLICHUNG.md).
Ein echter D1-/R2-Export, eine Wiederherstellung im Zielkonto und der Domainwechsel
stehen noch aus. Die vorbereitete Quellcode-ZIP ersetzt diese Betriebssicherungen nicht.
