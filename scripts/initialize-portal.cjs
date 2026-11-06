// Initialize once; existing saved portal content is never overwritten.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const remote = process.argv.includes("--remote");
const data = JSON.parse(fs.readFileSync(path.join(root, "seeds", "portal.json"), "utf8"));
const sql = "INSERT OR IGNORE INTO portal_content (id, version, data_json) VALUES ('main', 1, '" +
  JSON.stringify(data).replaceAll("'", "''") + "')";
const result = spawnSync(path.join(root, "node_modules", ".bin", "wrangler"), [
  "d1", "execute", "DB", "--env", "preview",
  remote ? "--remote" : "--local", ...(remote ? [] : ["--persist-to=.wrangler/state"]),
  "--command", sql,
], { cwd: root, stdio: "inherit" });
process.exitCode = result.status ?? 1;
