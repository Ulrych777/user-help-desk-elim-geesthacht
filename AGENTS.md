# Entwicklungs- und Veröffentlichungsablauf

Die vollständige Entwicklungsseite liegt unter https://serviceportal.glennritter.de.
Der Benutzer testet diese Seite im Browser und gibt anschließend Feedback für die
nächste Änderung. Die vollständige, geschützte Verwaltung gehört ausdrücklich dazu.

- Den vorhandenen Checkout und Branch main verwenden. Kein zusätzlicher Worktree.
- Änderungen in den bearbeitbaren Quellen unter prototype/ vornehmen und die
  generierte prototype/index.html mit npm run build:prototype aktualisieren.
- Die vollständigen Ausgangsinhalte liegen in seeds/portal.json; die
  veröffentlichte Seite lädt ihren versionierten Inhaltsstand aus D1. Alle neun
  ursprünglichen Anliegen und die Admin-Editoren erhalten. Nicht durch den
  unvollständigen Katalog der alten API-Testumgebung ersetzen.
- Vor Veröffentlichung npm run check:preview, npm run test:portal,
  npm run test:mail und
  node scripts/check-prototype.cjs ausführen. Die letzte Prüfung betrifft die
  eigenständige Offline-Datei; die persistente Seite wird durch test:portal geprüft.
- Nach beauftragten Änderungen einen aussagekräftigen Commit erstellen und main
  auf origin pushen. Danach npm run deploy:preview ausführen. Ein GitHub-Commit
  allein aktualisiert die Webseite nicht; keine automatische GitHub-Bereitstellung
  behaupten. Der Deploymentbefehl prüft, ob der lokale Stand sauber ist und dem
  Commit auf GitHub main entspricht.
- Anschließend Startseite und Admin-Direktlink prüfen, soweit Netzwerkzugriff
  besteht. Bei einer blockierten öffentlichen Prüfung die Grenze offen benennen.
  Die HTML-Metadaten serviceportal-build enthalten den veröffentlichten Git-Commit.
- Oberflächen-Code über Git und Deployment aktualisieren. Inhalte werden in der
  geschützten Verwaltung dauerhaft gespeichert. Initialisierung verwendet
  INSERT OR IGNORE; bestehende Admin-Inhalte niemals durch Seeds überschreiben.
  Ein geänderter Seed allein aktualisiert keine bestehende Inhaltsdatenbank.
- Admin-Seiten und Admin-API immer serverseitig mit Cloudflare Access UND
  JWT-Prüfung schützen. Keine lokale Auth-Umgehung einbauen. Admin-Adressen müssen
  Access-Policy und ADMIN_EMAILS erfüllen. Empfängeradressen, Entwürfe und
  unveröffentlichte Bilder nicht öffentlich liefern.
- Der echte E-Mail-Versand benötigt RESEND_API_KEY und TURNSTILE_SECRET_KEY als
  Worker-Secrets sowie die Versandvariablen in wrangler.jsonc. Fehlende
  Voraussetzungen sperren den Versand. Erst nach erfolgreicher Annahme durch den
  Versanddienst eine Bestätigung anzeigen; Annahme nicht als Zustellung ausgeben.
- In der aktuellen Testphase alle Anfragen über MAIL_TEST_TO an
  glenn.ritter@elimgeesthacht.de leiten. Diesen Empfänger-Override nicht ohne
  ausdrücklichen Auftrag entfernen. Auch die gespeicherten Bereichsempfänger
  wurden auf diese Adresse gestellt. Dienste/Secrets der Ehrenamtplattform
  nicht verändern und keine Schlüssel aus deren Worker auslesen.
- Anfragen und Anhänge nicht dauerhaft speichern. Es gibt nur kurzlebige
  technische Versandbelege ohne Nachrichtentexte, Adressen oder Dateien. Einen
  verlorenen Versandstatus über dieselbe Anfragekennung erneut prüfen/senden,
  nicht unbemerkt eine neue Kennung erzeugen und damit Doppelversand riskieren.

Die benannte Wrangler-Umgebung preview veröffentlicht die vollständige Seite auf
serviceportal.glennritter.de. Die Umgebung test ist der separate API-Entwicklungsstand.
Keine Gemeinde- oder Ehrenamt-Domains mit diesen Deployments verändern.
Cloudflare-Zugangsdaten gehören ausschließlich in geschützte Umgebungseinstellungen.
In der verwalteten Cloud-Umgebung npm_config_cache=/workspace/.cache/npm,
XDG_CONFIG_HOME=/workspace/.config und WRANGLER_SEND_METRICS=false verwenden.
