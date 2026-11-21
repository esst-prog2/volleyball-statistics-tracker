const { copyFileSync, mkdirSync } = require("node:fs");
const { dirname, join } = require("node:path");

const root = join(__dirname, "..");
for (const file of [
  "src/app.js",
  "src/core.js",
  "src/styles.css",
  "samples/cev-82223-full-match.csv",
  "samples/cev-82229-full-match.csv",
]) {
  const destination = join(root, "docs", "app", file);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(join(root, file), destination);
}
