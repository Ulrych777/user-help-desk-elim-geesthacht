// Publish only the exact, clean commit already available on GitHub main.
const { execFileSync } = require("node:child_process");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
try {
  if (git("status", "--porcelain"))
    throw new Error("Änderungen zuerst prüfen, committen und auf GitHub sichern.");
  if (git("branch", "--show-current") !== "main")
    throw new Error("Die vollständige Vorschau wird vom Branch main veröffentlicht.");
  const head = git("rev-parse", "HEAD");
  const remote = git("ls-remote", "origin", "refs/heads/main").split(/\s+/)[0];
  if (head !== remote)
    throw new Error("Der lokale Commit stimmt noch nicht mit GitHub main überein.");
  console.log("Veröffentlichungsquelle bestätigt: GitHub main, Commit " + head.slice(0, 12));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
