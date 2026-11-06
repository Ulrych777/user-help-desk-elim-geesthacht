const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const preview = process.argv.includes("--prototype");

const root = path.join(__dirname, ".."),
  source = path.join(root, "prototype", "index.html"),
  targetDirectory = path.join(root, preview ? "public-preview" : "public"),
  target = path.join(targetDirectory, "index.html");

fs.mkdirSync(targetDirectory, { recursive: true });
// The persistent portal starts from the complete initial content in D1.
// The standalone prototype and legacy API build remain separate.
const revision = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const html = fs.readFileSync(source, "utf8");
fs.writeFileSync(
  target,
  html.replace("<body>", preview ? '<body data-catalog-source="portal">' : '<body data-catalog-source="api">')
    .replace("</head>", `  <meta name="serviceportal-build" content="${revision}">\n</head>`),
);
console.log(`Worker-Asset erstellt: ${path.relative(root, target)}`);
