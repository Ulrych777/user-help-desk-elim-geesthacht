"""Create a portable source backup; never include Git internals or credentials."""
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path
import json
import subprocess
import sys
import zipfile

root = Path(__file__).resolve().parents[1]
stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
output = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / "backups" / f"elim-serviceportal-{stamp}.zip"
output.parent.mkdir(parents=True, exist_ok=True)
def git(*arguments):
    return subprocess.check_output(["git", *arguments], cwd=root, text=True)


# Archive the complete versioned application, not only the former prototype.
# Untracked uploads, ignored secrets, dependencies and build directories stay out.
names = git("ls-files", "-z").split("\0")
files = []
for name in names:
    if not name:
        continue
    path = root / name
    if any(part in {".git", ".aws", ".codex", "node_modules", ".wrangler", "__pycache__"} for part in path.relative_to(root).parts):
        continue
    if path.name.startswith((".env", ".dev.vars")) or path.suffix.lower() in {".pem", ".key", ".p12"}:
        continue
    if path.is_symlink():
        raise ValueError(f"Symbolischen Link vor der Sicherung prüfen: {name}")
    if path.is_file():
        files.append(path)
if output in files:
    raise ValueError("Die Sicherungsdatei darf keine Projektdatei überschreiben.")
required = {"src/index.ts", "migrations/0001_initial_schema.sql", "seeds/portal.json", "package-lock.json", "wrangler.jsonc"}
missing = required - {path.relative_to(root).as_posix() for path in files}
if missing:
    raise ValueError(f"Unvollständiger Projektstand: {', '.join(sorted(missing))}")
manifest = {
    "created_utc": datetime.now(timezone.utc).isoformat(),
    "kind": "source-only",
    "commit": git("rev-parse", "HEAD").strip(),
    "branch": git("branch", "--show-current").strip(),
    "working_tree_dirty": bool(git("status", "--porcelain").strip()),
    "note": "Versionierte Arbeitsdateien; D1, R2 und Secrets separat sichern. Neue Dateien vorher git add hinzufügen.",
    "files": {},
}
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(files):
        data = path.read_bytes()
        name = path.relative_to(root).as_posix()
        archive.writestr(name, data)
        manifest["files"][name] = sha256(data).hexdigest()
    archive.writestr("BACKUP-MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2))
print(f"Sicherung erstellt: {output} ({output.stat().st_size} Bytes)")
