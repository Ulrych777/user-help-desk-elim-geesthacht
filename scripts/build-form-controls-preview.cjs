const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "..");
const file = path.join(root, "prototype/formular-design-vorschau.html");
const css = fs.readFileSync(
  path.join(root, "prototype/form-controls.css"),
  "utf8",
);
const html = fs.readFileSync(file, "utf8");
const marker =
  /<!-- BEGIN FORM CONTROL STYLES -->[\s\S]*?<!-- END FORM CONTROL STYLES -->/;
if (!marker.test(html))
  throw new Error("Style-Markierung in der Vorschau fehlt.");
fs.writeFileSync(
  file,
  html.replace(
    marker,
    () =>
      `<!-- BEGIN FORM CONTROL STYLES -->\n  <style>\n${css}\n  </style>\n  <!-- END FORM CONTROL STYLES -->`,
  ),
);
