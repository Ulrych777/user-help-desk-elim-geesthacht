# E-Mail-Versand

## Aktivierung

Der Code verwendet Resend über HTTPS. Der Worker benötigt folgende Secrets:

- RESEND_API_KEY: Sendeberechtigung für mail.ehrenamt.glennritter.de.
- TURNSTILE_SECRET_KEY: eigener Turnstile-Schlüssel des Serviceportals.

Secrets im Cloudflare-Dashboard unter Workers & Pages → elim-serviceportal-preview
→ Einstellungen → Variablen und Geheimnisse als Typ Secret hinterlegen.
Keinen Schlüssel in Git, Chat, Dokumentation oder normale Umgebungsvariablen kopieren.
Der Resend-Schlüssel des bestehenden Ehrenamt-Workers kann nicht ausgelesen werden;
dessen Konfiguration wird nicht verändert. Ein neuer, passend beschränkter
Resend-Schlüssel kann für diesen Worker angelegt werden.

Ein eigenes Turnstile-Widget für serviceportal.glennritter.de wurde bereits
angelegt und sein Secret direkt im Worker gespeichert. Der öffentliche Sitekey
steht in wrangler.jsonc. Der Absender verwendet zunächst die vorhandene
Versanddomain: Serviceportal <anfrage@mail.ehrenamt.glennritter.de>.
Die Adresse des Anfragenden ist Reply-To, nicht der technische Absender.

Ohne vollständige Konfiguration bleibt das Formular gesperrt und die API liefert
HTTP 503. Die öffentliche API liefert lediglich Versandbereitschaft und den
öffentlichen Sitekey, niemals Secrets. Nach Hinterlegen des fehlenden Secrets
die Seite neu laden; es ist kein weiterer Code-Commit nötig.

## Testempfänger

MAIL_TEST_TO ist derzeit glenn.ritter@elimgeesthacht.de. Dieser serverseitige
Override gilt für alle Formulare und Anleitungs-Rückfragen, auch bei später
geänderten Bereichsadressen. Zusätzlich wurden die vorhandenen Bereichsempfänger
gezielt auf diese Adresse geändert, ohne andere Admin-Inhalte zu überschreiben.
Neue Bereiche erhalten diese Adresse als Vorschlag.

Zum späteren regulären Versand MAIL_TEST_TO nur auf ausdrücklichen Auftrag
entfernen und die Bereichsempfänger in der Verwaltung prüfen. Der Client kann
keinen Empfänger und keinen Absender bestimmen.

## Ablauf und Grenzen

POST /api/requests akzeptiert Multipart-Formulardaten. Der Server prüft Origin,
Rate-Limit, Honeypot, Turnstile-Ergebnis samt Hostname und Aktion sowie die
aktuelle Veröffentlichung von Bereich und Anliegen. Dynamische Felder werden
gegen die gespeicherte Formulardefinition geprüft: Pflichtfelder, Optionen,
Mehrfachauswahl, Datum, E-Mail und Textlängen.

Anhänge: höchstens drei Dateien mit zusammen 10 MiB; PNG, JPEG, WebP oder PDF.
Dateiendung, MIME-Typ und Dateisignatur müssen zusammenpassen. Die gesamte
Multipart-Anfrage ist auf 11 MiB begrenzt. Dateinamen werden bereinigt.
Anhänge werden ausschließlich im Arbeitsspeicher verarbeitet und als Base64 an
Resend übergeben; sie werden weder in D1 noch in R2 abgelegt. Der Versanddienst
und das Empfängerpostfach erhalten die eigentlichen Inhalte.

Versendet werden Bereich, Anliegen, Name (bei Formularen), Absenderadresse,
Betreff, sämtliche dynamischen Angaben, Nachricht, Anhänge und eine
Vorgangsnummer. Anleitungs-Rückfragen benötigen nur E-Mail, Betreff und Nachricht.
Es wird keine zusätzliche automatische E-Mail an die angegebene Absenderadresse
geschickt.

Neue Anfragen erhalten eine HTML-Version im dunkelblau-cremefarbenen Portaldesign
und eine gegliederte Textalternative. Betreff und Vorgangsnummer stehen im Kopf;
Anliegen, Kontakt, individuelle Angaben, Nachricht und Anhänge sind getrennt.
Individuelle Angaben folgen der im Anliegeneditor gespeicherten Reihenfolge.
Auf schmalen Bildschirmen stehen Beschriftungen über ihren Werten. Der Button
„Per E-Mail antworten“ verwendet die eingetragene Kontaktadresse und übernimmt
den Betreff einschließlich Vorgangsnummer. Reply-To bleibt zusätzlich gesetzt.
Die Nachricht und andere Eingaben werden als Text maskiert; es werden keine
externen Bilder, Schriftarten oder Tracking-Ressourcen eingebunden.

Die Übermittlung ist synchron: Erst nach bestätigter Annahme durch Resend erscheint
die Erfolgsmeldung. Das ist keine Garantie für die spätere Postfachzustellung.
Es gibt keine dauerhafte Versandqueue. Bei Ausfall oder Zeitüberschreitung bleiben
Eingaben und Dateien im Browser erhalten und können erneut versucht werden.

Eine stabile Anfrage-UUID wird als Resend-Idempotency-Key verwendet. D1 enthält
nur UUID, Eingabefingerabdruck, Versandstatus, Provider-ID, Erstellungszeit und
eine technische Vorlagenversion.
Parallele oder wiederholte identische Versuche erzeugen dadurch keine zweite
Nachricht im geschützten Wiederholungszeitraum. Abweichende Daten unter derselben
Kennung werden abgewiesen. Ein länger als 23 Stunden unbestätigter Vorgang wird
nicht automatisch neu versandt, weil der Idempotency-Zeitraum des Dienstes ausläuft.
Technische Belege werden nach sieben Tagen bei der stündlichen Bereinigung
gelöscht. Es werden keine Nachrichteninhalte, E-Mail-Adressen oder IP-Adressen
in dieser Tabelle gespeichert.

Migration `0005_mail_template_version.sql` setzt bestehende Belege auf Version 1.
Ihre unbestätigten Wiederholungen verwenden weiterhin den unveränderten alten
Text-Payload. Neue Vorgänge erhalten Version 2 (HTML und Text). Die Vorlage ist
deterministisch und enthält keine bei jedem Versuch neu erzeugten Zeitstempel.
Bei künftigen Vorlagenänderungen muss eine neue Version ergänzt und die bisherige
Vorlage für unbestätigte Wiederholungen erhalten werden, damit Resends
Idempotency-Key weiterhin exakt denselben Payload bezeichnet.

Die Ratenbegrenzung erlaubt fünf Versuche pro Minute je IP und Cloudflare-Standort.
Turnstile verhindert, dass ein bloßes automatisiertes POST das Formular umgeht.
Der Einmalcode zur Admin-Anmeldung und Turnstile sind getrennte Mechanismen.

## Prüfung

    npm run check:preview
    npm run test:portal
    npm run test:mail
    node scripts/check-prototype.cjs

test:mail prüft die echte Worker-Implementierung gegen temporäre SQLite-Daten
und simulierte Turnstile-/Resend-Antworten. Es werden keine echten E-Mails gesendet.
Geprüft werden Feld- und Dateiprüfung, Spam-Schutz, feste Testempfänger,
Reply-To, vollständige Anhänge, verlorene Antworten, doppelte Versuche und
das Browser-Verhalten bei Fehlern und erfolgreichem Versand. Die eigenständige
Offline-Prototypdatei behält ihre Versand-Simulation.

Den ersten echten Versand anschließend über die veröffentlichte Seite mit
Sicherheitsprüfung durchführen und den Eingang im Zielpostfach kontrollieren.
Ein erfolgreicher Test mit simuliertem Provider ist kein Nachweis echter
Resend-Autorisierung oder Postfachzustellung.
