// Seed only an empty test database. Use the D1 query endpoint without SQL uploads.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const wrangler = path.join(root, "node_modules", ".bin", "wrangler");
function execute(sql) {
  const result = spawnSync(wrangler, [
    "d1", "execute", "DB", "--env", "test", "--remote", "--json", "--command", sql,
  ], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || "");
    process.stderr.write(result.stdout || "");
    throw new Error("Die Testdatenbank konnte nicht vorbereitet werden.");
  }
  const data = JSON.parse(result.stdout);
  if (!data.length || data.some((item) => !item.success))
    throw new Error("D1 hat die SQL-Ausführung nicht bestätigt.");
  return data;
}
const tables = ["areas", "categories", "concerns", "concern_categories", "form_fields", "guide_images", "admins"];
const count = execute("SELECT (" + tables.map((name) => "(SELECT COUNT(*) FROM " + name + ")").join(" + ") + ") AS count")[0].results[0].count;
if (!Number.isInteger(count) || count < 0) throw new Error("Ungültiger D1-Datenbestand.");
if (count === 0) {
  execute(fs.readFileSync(path.join(root, "seeds", "dev.sql"), "utf8"));
  console.log("Beispieldaten in die leere Testdatenbank geladen.");
} else {
  console.log("Vorhandene Testdaten bleiben erhalten; kein erneutes Laden der Beispieldaten.");
}
