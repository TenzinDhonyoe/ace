#!/usr/bin/env bun
// Serve output/ over HTTP so ES module imports work.
// Browsers refuse module imports over file:// — opening output/index.html
// directly will silently fail to mount any widgets.

import { existsSync, statSync, readFileSync } from "node:fs";
import { join, extname, resolve } from "node:path";

const root = resolve(process.argv[2] ?? "output");
const port = Number(process.env.PORT ?? 8765);

if (!existsSync(root)) {
  console.error(`Directory not found: ${root}`);
  console.error(`Run /ace-review first to generate output/.`);
  process.exit(1);
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

Bun.serve({
  port,
  fetch(req) {
    const url = new URL(req.url);
    let path = decodeURIComponent(url.pathname);
    if (path === "/" || path.endsWith("/")) path += "index.html";

    const filePath = join(root, path);
    if (!filePath.startsWith(root)) return new Response("Forbidden", { status: 403 });
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(readFileSync(filePath), {
      headers: { "content-type": mime[extname(filePath)] ?? "application/octet-stream" },
    });
  },
});

console.log(`Serving ${root} at http://localhost:${port}/`);
console.log(`Press Ctrl+C to stop.`);
