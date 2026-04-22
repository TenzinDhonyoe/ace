#!/usr/bin/env bun
// CLI: ace-template <config.json> -o <out-dir>
// Writes index.html + copies ace-components bundle + styles.

import { readFileSync, writeFileSync, mkdirSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { renderSite } from "../src/render.js";

const args = process.argv.slice(2);
if (args.length < 1 || args.includes("--help") || args.includes("-h")) {
  console.log("Usage: ace-template <config.json> [-o <out-dir>] [--bundle-url <url>]");
  process.exit(args.length < 1 ? 1 : 0);
}

const configPath = args[0];
let outDir = "./output";
let bundleUrl = "./ace-components.js";
let stylesUrl = "./ace-styles.css";

for (let i = 1; i < args.length; i++) {
  if (args[i] === "-o" || args[i] === "--out") outDir = args[++i];
  else if (args[i] === "--bundle-url") bundleUrl = args[++i];
  else if (args[i] === "--styles-url") stylesUrl = args[++i];
}

const config = JSON.parse(readFileSync(configPath, "utf8"));
const html = renderSite(config, { componentsBundleUrl: bundleUrl, stylesUrl });

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), html);

// Copy ace-components as a single ESM file (users re-serve as-is)
const componentsDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../ace-components");
try {
  cpSync(componentsDir, join(outDir, "_ace-components"), {
    recursive: true,
    filter: (src) => !/\/(node_modules|test|__tests__|.*\.test\.js)$/.test(src)
  });
  writeFileSync(
    join(outDir, "ace-components.js"),
    `export * from "./_ace-components/index.js";\n`
  );
  cpSync(join(componentsDir, "styles.css"), join(outDir, "ace-styles.css"));
  console.log(`Wrote ${outDir}/index.html (${html.length} bytes) + ace-components`);
} catch (e) {
  console.warn(`Wrote HTML but failed to copy components: ${e.message}`);
  console.warn(`Point --bundle-url at a URL hosting ace-study-components.`);
}
