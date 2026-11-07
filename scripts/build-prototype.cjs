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
  "hintergrund-pflanze.webp",
  "wlan-einstellungen.svg",
  "suche-kein-treffer.webp",
];
const images = Object.fromEntries(
  filenames.map((filename) => [
    filename,
    `data:${imageTypes[path.extname(filename)]};base64,${fs.readFileSync(path.join(prototype, "assets", filename)).toString("base64")}`,
  ]),
);
const replacements = {
  // Use the original square signet at the left of the wordmark unchanged.
  FAVICON: "data:image/svg+xml;base64," + Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="224" height="224" viewBox="0 0 224 224">' +
    '<image width="1154" height="224" href="' + images["Elim_Logo_L_Mini_Marine.png"] + '"/></svg>',
  ).toString("base64"),
  PORTAL_CSS: fs.readFileSync(path.join(prototype, "portal.css"), "utf8"),
  CONTROL_CSS: fs.readFileSync(
    path.join(prototype, "form-controls.css"),
    "utf8",
  ),
  PORTAL_JS: require("esbuild").buildSync({
    entryPoints: [path.join(prototype, "guide-editor.js")], bundle: true,
    write: false, format: "iife", target: "es2022", minify: true,
    supported: { "template-literal": false },
    legalComments: "inline",
  }).outputFiles[0].text.replace(/<\/script/gi, "<\\/script") + "\n" + fs.readFileSync(path.join(prototype, "portal.js"), "utf8"),
  IMAGES: JSON.stringify(images),
};
const template = fs.readFileSync(
  path.join(prototype, "portal.template.html"),
  "utf8",
);
const result = template.replace(
  /\{\{(FAVICON|PORTAL_CSS|CONTROL_CSS|PORTAL_JS|IMAGES)\}\}/g,
  (_, key) => replacements[key],
);
fs.writeFileSync(path.join(prototype, "index.html"), result);
console.log(
  "prototype/index.html erstellt: " +
    Buffer.byteLength(result) +
    " Bytes, alle Bilder eingebettet.",
);
