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
- Eine Queue übernimmt den Versand mit Wiederholungsversuchen. Temporäre Anhänge werden über R2-Schlüssel referenziert und nach erfolgreichem Versand gelöscht; ein geplanter Cron-Lauf entfernt liegen gebliebene Dateien nach einer festgelegten Frist.
- Der ausgehende E-Mail-Versand erfolgt über eine HTTPS-fähige Versandlösung. Cloudflare Workers können keinen klassischen SMTP-Server direkt ansprechen. Als Varianten kommen ein Transaktionsmaildienst oder Microsoft Graph für ein vorhandenes Microsoft-365-Postfach infrage.
- Geheimnisse wie Versand- und API-Zugangsdaten werden ausschließlich als Cloudflare-Secrets hinterlegt und nicht in Git gespeichert.

## Nächste Projektphasen

1. Die Cloudflare-Konfiguration der Ehrenamtplattform wurde als Referenz geprüft. Das lokale Worker-/D1-/R2-Grundgerüst und eine lesende öffentliche Katalog-API sind angelegt und getestet. Offen sind die echten Cloudflare-Ressourcen, deren IDs und die Entwicklungsdomain.
2. Den vorhandenen Prototyp schrittweise an die API anbinden: zuerst öffentliche Katalogdaten, danach dauerhafte Verwaltung und Medien.
3. Cloudflare Access für den IT-Adminbereich einrichten und alle Admin-Endpunkte serverseitig schützen.
4. E-Mail-Weg auswählen und den vollständigen Anfrageablauf mit Queue, Anhängen, Wiederholungsversuchen und automatischer Löschung umsetzen.
5. Turnstile, Ratenbegrenzung, verbindliche Datei- und Eingabeprüfung sowie Datenschutzinformationen ergänzen.
6. Mit den zuständigen Teams auf Desktop und Smartphone testen: Zuständigkeit, Suchtreffer, Pflichtangaben, Bildverwaltung, Anhänge, Direktlinks und Datenschutz.
7. Nach funktionaler Abnahme den gestalterischen Feinschliff durchführen und erst danach die Gemeinde-Domain umstellen. Regelmäßige Sicherungen, Zuständigkeiten und Wartung dokumentieren.

Der aktuelle Prototyp deckt die Oberfläche und simulierte Abläufe ab. Das Cloudflare-Grundgerüst liefert bereits die Website und liest Katalogdaten aus D1; die Oberfläche greift noch nicht auf diese API zu. Produktiver Versand und Verwaltung folgen in den nächsten Phasen.
