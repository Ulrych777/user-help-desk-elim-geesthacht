const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, ".."),
  source = path.join(root, "prototype", "index.html"),
  targetDirectory = path.join(root, "public"),
  target = path.join(targetDirectory, "index.html");

fs.mkdirSync(targetDirectory, { recursive: true });
// Only the Worker build loads D1 data. The standalone prototype stays offline.
fs.writeFileSync(
  target,
  fs.readFileSync(source, "utf8").replace("<body>", '<body data-catalog-source="api">'),
);
console.log(`Worker-Asset erstellt: ${path.relative(root, target)}`);
