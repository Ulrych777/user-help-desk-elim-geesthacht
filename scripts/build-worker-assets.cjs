const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, ".."),
  source = path.join(root, "prototype", "index.html"),
  targetDirectory = path.join(root, "public"),
  target = path.join(targetDirectory, "index.html");

fs.mkdirSync(targetDirectory, { recursive: true });
fs.copyFileSync(source, target);
console.log(`Worker-Asset erstellt: ${path.relative(root, target)}`);
