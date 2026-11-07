# Projektstand und nächste Schritte

Stand: 7. November 2026. Die Beta ist vom Benutzer funktional abgenommen.

Das Serviceportal ersetzt einen umfangreicheren Helpdesk durch einen öffentlichen
Katalog aus Formularen und Anleitungen. Teams bearbeiten Anfragen im jeweiligen
E-Mail-Postfach; Anfragende benötigen kein Konto. Eine eigene Ticketverwaltung
gehört nicht zum vereinbarten Umfang.

## Umgesetzt

Die vollständige Anwendung ist unter https://serviceportal.glennritter.de
veröffentlicht. D1 hält Inhalte und Adminrechte, R2 eigene Portalbilder.
Cloudflare Access und zusätzliche JWT-/D1-Prüfungen schützen die Verwaltung.
Resend, Turnstile, Ratenbegrenzung und geprüfte Anhänge sind angebunden.
Die Adresse der anfragenden Person ist Reply-To. Der Benutzer hat echte Anmeldung,
Speicherung und Zustellung getestet. Alle Bereiche senden derzeit weiterhin an
das vereinbarte Testpostfach.

Die Oberfläche umfasst die abgestimmte Gestaltung, Suche, Bereiche, eigene Bilder,
Richtext-Anleitungen, sortierbare Formularfelder, passende Kalenderauswahl und
responsive Ansichten. Die Offline-Datei und die alte Katalog-API bleiben getrennte
Entwicklungs-/Prüfvarianten; maßgeblich ist das persistente Portal.

## Nächste Phase

1. Zielhost und Cloudflare-Konto der Gemeinde festlegen.
2. Gemeinsame D1-/R2-Sicherung und Probe-Wiederherstellung vorbereiten und durchführen.
3. Zielressourcen, Adminanmeldung, Mailabsender und Turnstile einrichten.
4. Datenschutz-/Kontaktinformationen, Postfachzuständigkeiten und Wartung abschließen.
5. Zielseite gemeinsam abnehmen; erst danach Links/Domain und auf ausdrücklichen
   Auftrag den Testempfänger umstellen. Bisherige Weiterleitungen bis dahin erhalten.

Details: [Beta-Übergabe](BETA-UEBERGABE.md),
[Migration und Veröffentlichung](MIGRATION-UND-VEROEFFENTLICHUNG.md).
Die frühere Rekonstruktion ist in [Wiederherstellung](WIEDERHERSTELLUNG.md)
als historischer Stand dokumentiert.
