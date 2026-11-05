const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, ".."),
  prototype = path.join(root, "prototype");
const imageTypes = {
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
};
const filenames = [
  "Elim_Logo_L_Mini_Marine.png",
  "bereich-it.webp",
  "bereich-haus.webp",
  "bereich-finanzen.webp",
  "service-eingang.webp",
  "wlan-einstellungen.svg",
];
const images = Object.fromEntries(
  filenames.map((filename) => [
    filename,
    `data:${imageTypes[path.extname(filename)]};base64,${fs.readFileSync(path.join(prototype, "assets", filename)).toString("base64")}`,
  ]),
);
const replacements = {
  PORTAL_CSS: fs.readFileSync(path.join(prototype, "portal.css"), "utf8"),
  CONTROL_CSS: fs.readFileSync(
    path.join(prototype, "form-controls.css"),
    "utf8",
  ),
  PORTAL_JS: fs.readFileSync(path.join(prototype, "portal.js"), "utf8"),
  IMAGES: JSON.stringify(images),
};
const template = fs.readFileSync(
  path.join(prototype, "portal.template.html"),
  "utf8",
);
const result = template.replace(
  /\{\{(PORTAL_CSS|CONTROL_CSS|PORTAL_JS|IMAGES)\}\}/g,
  (_, key) => replacements[key],
);
fs.writeFileSync(path.join(prototype, "index.html"), result);
console.log(
  "prototype/index.html erstellt: " +
    Buffer.byteLength(result) +
    " Bytes, alle Bilder eingebettet.",
);
