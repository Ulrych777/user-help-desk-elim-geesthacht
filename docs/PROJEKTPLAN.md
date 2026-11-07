# Elim Kirche Serviceportal

Rekonstruierter Planungsstand vom 5. November 2026.

## Ziel und Umfang

Ein öffentliches, einfach bedienbares Serviceportal für Anliegen der Gemeinde ersetzt das überdimensionierte Atlassian-Portal. Anfragen gehen zur Bearbeitung an das zuständige E-Mail-Postfach. Eine eigene Ticketverwaltung, Nutzerkonten für Anfragende und eine Speicherung der Anfragen im Portal sind zunächst nicht vorgesehen.

Die spätere Gemeindedomain ist vorhanden; für Entwicklung und Abnahme wurde `glennritter.de` genannt. Als Betriebsplattform ist Cloudflare vorgesehen, analog zur Ehrenamtplattform. Nach Auskunft des Nutzers ist dort bereits eine Domainanbindung vorbereitet; die konkrete Konfiguration muss noch aus dem Referenzprojekt übernommen beziehungsweise geprüft werden. Die bestehende Weiterleitung von `helpdesk.elimgeesthacht.de` wird erst nach erfolgreicher Abnahme umgestellt.

## Vereinbarte Funktionen

1. Startseite mit globaler Suche und großen Bereichskacheln. Kategorien strukturieren Anliegen innerhalb eines Bereichs; sie verändern nicht den Empfänger.
2. Eigene Bereichsseiten mit Bereichssuche und Kategorienfilter. Ein Anliegen gehört einem Bereich und kann dort mehreren Kategorien angehören, wird aber nur einmal gepflegt und angezeigt.
3. Anliegen sind Formulare oder Anleitungen. Beide öffnen als Dialog mit teilbarem Link. Anleitungen enden immer mit einem Kontaktformular aus E-Mail-Adresse, Betreff und Nachricht.
4. Zentrale Verwaltung durch das IT-Team für Bereiche, Kategorien, Empfängeradressen, Formulare und Anleitungen. Die späteren Adminzugänge müssen geschützt werden; die Empfängerteams bearbeiten ihre Postfächer ohne eigenen Portalzugang.
5. Ein Bereich benötigt ein passendes Bild zur Veröffentlichung. Im Editor wird ausschließlich das Bild dieses Bereichs angezeigt, heruntergeladen oder durch einen transparenten Upload ersetzt. Das IT-Team beurteilt die thematische Eignung und den einheitlichen Illustrationsstil.
6. Formularfelder: kurzer/langer Text, E-Mail, Datum, Einfach- und Mehrfachauswahl, Pflichtfelder und optionaler Dateiupload. Ein bedingter Formularbaukasten ist zunächst nicht erforderlich.
7. Lokale Suche mit Synonymen und Tippfehlertoleranz. Eine spätere optionale semantische oder LLM-Suche darf ausschließlich veröffentlichte Katalogeinträge empfehlen und keine Anfrage selbstständig versenden. Anbieter, Kosten und Datenverarbeitung sind offen.

## E-Mail und Dateien im späteren Betrieb

- Jede Bereichsverwaltung enthält eine Empfängeradresse. Die Absenderadresse des Versanddienstes wird fest konfiguriert; die Adresse des Anfragenden wird als Reply-To verwendet.
- Die Nachricht enthält Bereich, Anliegen, alle ausgefüllten Felder und eine Vorgangsnummer. Die konkrete Bestätigungsmail an Anfragende ist noch festzulegen.
- Anfrageanhänge werden vorübergehend geprüft und verarbeitet, als Anhänge verschickt und nach Annahme durch den Versanddienst gelöscht. Die Annahme ist noch kein Nachweis der endgültigen Zustellung.
- Bei Fehlern erscheint keine Erfolgsmeldung. Wiederholungsversuche und automatische Bereinigung verwaister temporärer Dateien sind nötig; eine maximale Aufbewahrungsdauer muss festgelegt werden.
- Bereichs- und Anleitungsbilder sind dauerhaft gespeicherte Portalmedien und werden mit der Konfiguration gesichert. Sie werden beim Versand einer Anfrage nicht gelöscht.
- Spam-Schutz, Ratenbegrenzung, verbindliche serverseitige Eingabe- und Dateiprüfung sowie Datenschutz-/Kontaktinformationen gehören vor die Veröffentlichung.

## Gestaltung

Gewählt ist das geteilte Layout (Variante E): dunkelblaue Suchfläche links, warme cremefarbene Bereichskarten rechts, dezente Rundungen, schmale Lichtkanten und Schatten. Der starke Polstereffekt wurde zugunsten einer leichten Wölbung zurückgenommen. In Bereichskarten steht kein zusätzlicher Linktext. Die originale Wort-Bild-Marke bleibt unverändert; „Serviceportal“ wird nach einer feinen senkrechten Linie ergänzt (Variante B), auch im Footer. Dort steht „Admin-Bereich“ ohne Unterstreichung.

Die Rekonstruktion übernimmt diese Anordnung und die zuletzt überarbeitete Feldgestaltung. Die neuen Illustrationen und einzelne Abstände können vom verlorenen Entwurf abweichen. Die ursprünglichen Mockup-Dateien sind in dieser Umgebung nicht vorhanden.

## Technische Zielarchitektur auf Cloudflare

- Ein Cloudflare Worker liefert die öffentliche Anwendung und die statischen Assets aus und stellt die serverseitigen API-Endpunkte bereit.
- Cloudflare D1 speichert Bereiche, Kategorien, Anliegen, dynamische Formularfelder und Veröffentlichungszustände.
- Cloudflare R2 speichert dauerhafte Bereichs- und Anleitungsbilder getrennt von temporären Anfrageanhängen.
- Cloudflare Access schützt die Verwaltungsseiten und die zugehörigen Admin-API-Endpunkte. Der bisherige Hash-Pfad für die Verwaltung wird dafür auf eine serverseitig erkennbare Route umgestellt.
- Cloudflare Turnstile, serverseitige Ratenbegrenzung und ein unsichtbares Formularfeld schützen öffentliche Anfragen vor automatisiertem Missbrauch.
- Die erste Versandstufe übermittelt synchron an Resend und verwendet stabile Anfragekennungen gegen doppelten Versand. Anfrageanhänge bleiben ausschließlich im Arbeitsspeicher. Eine persistente Queue wird derzeit nicht verwendet; bei Fehlern bleiben Eingaben im Browser für einen erneuten Versuch erhalten.
- Der ausgehende E-Mail-Versand verwendet Resend über HTTPS. Die aktive Testphase leitet alle Anliegen an glenn.ritter@elimgeesthacht.de; der Start benötigt einen eigenen RESEND_API_KEY im Serviceportal-Worker.
- Geheimnisse wie Versand- und API-Zugangsdaten werden ausschließlich als Cloudflare-Secrets hinterlegt und nicht in Git gespeichert.

## Nächste Projektphasen

1. Die vollständige Entwicklungsseite unter https://serviceportal.glennritter.de wird aus GitHub main veröffentlicht. Die Verwaltung unter /admin/ ist durch eine eigene Cloudflare-Access-Anwendung und zusätzliche JWT-Prüfung im Worker geschützt. Die Gemeinde-Domain bleibt bis zur Abnahme unverändert.
2. Die vollständigen Ausgangsinhalte (drei Bereiche, neun Anliegen) sind dauerhaft in D1 übernommen. Die öffentliche Seite lädt veröffentlichte Inhalte, die Verwaltung speichert Inhalte und R2-Bilder dauerhaft. Parallele Änderungen werden über Versionsprüfung abgefangen.
3. Cloudflare Access und serverseitiger Schutz der Admin-Seiten und Admin-API sind eingerichtet; die erste echte Anmeldung per Code wird vom Benutzer im Browser geprüft.
4. E-Mail-Versand mit Resend, Anhängen, geprüften Feldern, Idempotenz und Fehleranzeige ist implementiert. Aktivierung und echter Zustelltest benötigen den Resend-Schlüssel im Worker. Technische Versandbelege ohne Nachrichteninhalte werden nach sieben Tagen bereinigt.
5. Turnstile, Ratenbegrenzung sowie serverseitige Datei- und Eingabeprüfung sind implementiert. Datenschutz- und Kontaktinformationen vor einem regulären Gemeindebetrieb vervollständigen.
6. Mit den zuständigen Teams auf Desktop und Smartphone testen: Zuständigkeit, Suchtreffer, Pflichtangaben, Bildverwaltung, Anhänge, Direktlinks und Datenschutz.
7. Nach funktionaler Abnahme den gestalterischen Feinschliff durchführen und erst danach die Gemeinde-Domain umstellen. Regelmäßige Sicherungen, Zuständigkeiten und Wartung dokumentieren.

Die vollständige Entwicklungsseite lädt ihren Inhaltsstand aus D1. Die geschützte Verwaltung speichert Änderungen und Medien dauerhaft. Die eigenständige Prototypdatei bleibt offline nutzbar. Der Resend-Versand ist vorbereitet und wird bei vollständiger Secret-Konfiguration aktiviert; die tatsächliche Zustellung wird anschließend im Browser getestet.
