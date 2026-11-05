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
files = [root / "README.md", root / ".gitignore"]
for directory in ("prototype", "docs", "scripts"):
    files.extend(path for path in (root / directory).rglob("*") if path.is_file() and "__pycache__" not in path.parts)
manifest = {"created_utc": datetime.now(timezone.utc).isoformat(), "files": {}}
try:
    manifest["commit"] = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root, text=True).strip()
    manifest["branch"] = subprocess.check_output(["git", "branch", "--show-current"], cwd=root, text=True).strip()
except subprocess.CalledProcessError:
    pass
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(files):
        data = path.read_bytes()
        name = path.relative_to(root).as_posix()
        archive.writestr(name, data)
        manifest["files"][name] = sha256(data).hexdigest()
    archive.writestr("BACKUP-MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2))
print(f"Sicherung erstellt: {output} ({output.stat().st_size} Bytes)")
