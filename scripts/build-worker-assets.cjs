const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const preview = process.argv.includes("--prototype");

const root = path.join(__dirname, ".."),
  source = path.join(root, "prototype", "index.html"),
  targetDirectory = path.join(root, preview ? "public-preview" : "public"),
  target = path.join(targetDirectory, "index.html");

fs.mkdirSync(targetDirectory, { recursive: true });
// The complete preview preserves the prototype's admin UI and embedded data.
// The API build remains available for incremental backend development.
const revision = execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
  cwd: root,
  encoding: "utf8",
}).trim();
const html = fs.readFileSync(source, "utf8");
fs.writeFileSync(
  target,
  (preview ? html : html.replace("<body>", '<body data-catalog-source="api">'))
    .replace("</head>", `  <meta name="serviceportal-build" content="${revision}">\n</head>`),
);
console.log(`Worker-Asset erstellt: ${path.relative(root, target)}`);
