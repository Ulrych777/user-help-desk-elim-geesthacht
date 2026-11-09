"""Check that a source archive can reconstruct the application without credentials."""
from hashlib import sha256
from pathlib import Path
import json
import subprocess
import tempfile
import zipfile

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix="portal-source-backup-") as directory:
    archive_path = Path(directory) / "source.zip"
    subprocess.run(["python3", "scripts/backup-project.py", str(archive_path)], cwd=root, check=True)
    with zipfile.ZipFile(archive_path) as archive:
        names = set(archive.namelist())
        expected = {
            "README.md", "AGENTS.md", "package.json", "package-lock.json", "tsconfig.json",
            "wrangler.jsonc", "wrangler.production.example.jsonc", "src/index.ts", "src/mail.ts",
            "prototype/index.html", "prototype/date-picker.js", "seeds/portal.json",
            "migrations/0001_initial_schema.sql", "migrations/0005_mail_template_version.sql",
            "docs/MIGRATION-UND-VEROEFFENTLICHUNG.md",
            "prototype/fonts/raleway-latin-400-normal.woff2",
            "prototype/fonts/raleway-latin-500-normal.woff2",
            "prototype/fonts/raleway-latin-600-normal.woff2",
            "prototype/fonts/raleway-latin-700-normal.woff2", "prototype/fonts/OFL.txt",
        }
        assert expected <= names, f"Fehlende Projektdateien: {expected - names}"
        assert not any(part in {".git", "node_modules", ".wrangler", "backups"} for name in names for part in Path(name).parts)
        assert not any(Path(name).name.startswith((".env", ".dev.vars")) for name in names)
        manifest = json.loads(archive.read("BACKUP-MANIFEST.json"))
        assert manifest["kind"] == "source-only"
        assert len(manifest["commit"]) == 40
        assert set(manifest["files"]) == names - {"BACKUP-MANIFEST.json"}
        for name, digest in manifest["files"].items():
            assert sha256(archive.read(name)).hexdigest() == digest, name
        # Actually unpack and compare byte-for-byte, including binary assets.
        restore = Path(directory) / "restored"
        archive.extractall(restore)
        for name in manifest["files"]:
            assert (restore / name).read_bytes() == (root / name).read_bytes(), name
print("OK: vollständige Quellcode-Sicherung, Ausschlüsse, Prüfsummen und Wiederherstellung.")
