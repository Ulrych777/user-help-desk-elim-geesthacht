# Entwicklungs- und Veröffentlichungsablauf

Die vollständige Entwicklungsseite liegt unter https://serviceportal.glennritter.de.
Der Benutzer testet diese Seite im Browser und gibt anschließend Feedback für die
nächste Änderung. Die vorhandene Admin-Vorschau gehört ausdrücklich dazu.

- Den vorhandenen Checkout und Branch main verwenden. Kein zusätzlicher Worktree.
- Änderungen in den bearbeitbaren Quellen unter prototype/ vornehmen und die
  generierte prototype/index.html mit npm run build:prototype aktualisieren.
- Die vollständige Vorschau verwendet die eingebetteten Prototypdaten samt allen
  Formularen, Anleitungen, Bildern und Admin-Editoren. Sie darf nicht durch die
  unvollständige API-Oberfläche ersetzt oder ihr Admin-Bereich ausgeblendet werden.
- Vor Veröffentlichung npm run check:preview und
  PORTAL_PREVIEW_FILE=public-preview/index.html node scripts/check-prototype.cjs
  ausführen. Bei Backendänderungen zusätzlich den betroffenen API-Workflow prüfen.
- Nach beauftragten Änderungen einen aussagekräftigen Commit erstellen und main
  auf origin pushen. Danach npm run deploy:preview ausführen. Ein GitHub-Commit
  allein aktualisiert die Webseite nicht; keine automatische GitHub-Bereitstellung
  behaupten. Der Deploymentbefehl prüft, ob der lokale Stand sauber ist und dem
  Commit auf GitHub main entspricht.
- Anschließend Startseite und Admin-Direktlink prüfen, soweit Netzwerkzugriff
  besteht. Bei einer blockierten öffentlichen Prüfung die Grenze offen benennen.
  Die HTML-Metadaten serviceportal-build enthalten den veröffentlichten Git-Commit.
- Änderungen an der Oberfläche sind über Git und erneutes Deployment dauerhaft.
  Änderungen innerhalb der derzeitigen Admin-Vorschau bleiben nur bis zum
  Neuladen erhalten. E-Mail-Versand wird simuliert. Das nicht als dauerhafte
  Verwaltung oder produktiven Versand darstellen.

Die benannte Wrangler-Umgebung preview veröffentlicht die vollständige Seite auf
serviceportal.glennritter.de. Die Umgebung test ist der separate API-Entwicklungsstand.
Keine Gemeinde- oder Ehrenamt-Domains mit diesen Deployments verändern.
Cloudflare-Zugangsdaten gehören ausschließlich in geschützte Umgebungseinstellungen.
In der verwalteten Cloud-Umgebung npm_config_cache=/workspace/.cache/npm,
XDG_CONFIG_HOME=/workspace/.config und WRANGLER_SEND_METRICS=false verwenden.
