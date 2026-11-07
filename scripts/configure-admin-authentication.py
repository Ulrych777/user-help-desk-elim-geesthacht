"""Set this portal's identity gateway after deployment of D1 authorization.

Cloudflare authenticates the email; the Worker authorizes active D1 administrators.
No API credential is stored in the Worker and no invitation email is sent.
"""
import json
import os
import sys
import urllib.request

ACCOUNT = "7557223ab991a08ac213c7adf79966d9"
APP = "de882c6d-1468-4eb7-b676-8cfac32300f6"
POLICY = "13381ac6-cbaa-4e39-873c-3030a35cc299"
WORKER = "elim-serviceportal-preview"
DATABASE = "2744e50d-35ba-4ffb-b76c-57a2fbc08396"
BASE = "https://api.cloudflare.com/client/v4/accounts/" + ACCOUNT + "/"


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def call(path, body=None, method=None):
    request = urllib.request.Request(
        BASE + path,
        headers={
            "Authorization": "Bearer " + os.environ["CLOUDFLARE_API_TOKEN"],
            "Content-Type": "application/json",
        },
        data=None if body is None else json.dumps(body).encode(),
        method=method,
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        data = json.load(response)
    if not data.get("success"):
        raise RuntimeError("Cloudflare hat die Konfiguration nicht bestätigt.")
    return data["result"]


app = call("access/apps/" + APP)
require(app["domain"] == "serviceportal.glennritter.de/admin", "Unerwartete Anwendung.")
require(set(app["self_hosted_domains"]) == {
    "serviceportal.glennritter.de/admin",
    "serviceportal.glennritter.de/admin/*",
    "serviceportal.glennritter.de/api/admin",
    "serviceportal.glennritter.de/api/admin/*",
}, "Unerwartete geschützte Pfade.")
require(app.get("allowed_idps") and app.get("auto_redirect_to_identity"), "Anmeldung muss eingerichtet bleiben.")
settings = call("workers/scripts/" + WORKER + "/settings")
bindings = {binding["name"]: binding for binding in settings["bindings"]}
require(bindings["CF_ACCESS_AUD"]["text"] == app["aud"], "Falsche JWT-Audience.")
require("ADMIN_EMAILS" not in bindings, "Zuerst den Worker mit D1-Rechteprüfung veröffentlichen.")
rows = call("d1/database/" + DATABASE + "/query", {
    "sql": "SELECT COUNT(*) AS active FROM admins WHERE active = 1",
})[0]["results"]
require(rows[0]["active"] >= 1, "Mindestens ein aktiver Administrator muss vorhanden sein.")
policy = call("access/apps/" + APP + "/policies/" + POLICY)
require(policy["decision"] == "allow" and not policy.get("reusable"), "Keine gemeinsam genutzte Policy ändern.")
expected = [{"everyone": {}}]
old = [{"email": {"email": "glenn.ritter@elimgeesthacht.de"}}]
require(policy["include"] in [old, expected], "Die Policy wurde anderweitig geändert; erst prüfen.")
if "--check" in sys.argv:
    require(policy["include"] == expected, "Identitätsprüfung ist noch nicht umgestellt.")
elif policy["include"] != expected:
    body = {key: policy[key] for key in [
        "name", "decision", "include", "exclude", "require", "precedence",
        "session_duration", "approval_required", "approval_groups",
        "purpose_justification_required", "purpose_justification_prompt",
    ] if key in policy}
    body["name"] = "Serviceportal - Identitaetspruefung (Adminrechte in D1)"
    body["include"] = expected
    policy = call("access/apps/" + APP + "/policies/" + POLICY, body, "PUT")
    require(policy["include"] == expected, "Cloudflare hat die Policy nicht bestätigt.")
confirmed = call("access/apps/" + APP + "/policies/" + POLICY)
require(confirmed["include"] == expected and confirmed["decision"] == "allow", "Policy-Prüfung fehlgeschlagen.")
print("Bestätigt: Cloudflare prüft die Identität; aktive D1-Administratoren erhalten die Rechte.")
