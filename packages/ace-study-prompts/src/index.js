// Exports the generation rules and self-check checklist as strings, so any
// Ace generator (the /ace-review Claude Code skill, the hosted ace.study
// server, third-party consumers) can load them at runtime.
//
// The markdown files beside this module are the source of truth. We read
// them synchronously at import time via Node's `fs` + `url` — this works on
// Node 20+ and Bun without extra build steps or loader config. For edge
// runtimes (Cloudflare Workers, Deno Deploy), bundle the markdown at build
// time using your bundler's raw-text loader.
//
// The sync reads happen exactly once per process on first import; the file
// contents are small (system-prompt ~5KB, self-check ~1KB).

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

export const systemPrompt = readFileSync(
  join(__dirname, "system-prompt.md"),
  "utf8",
);

export const selfCheck = readFileSync(
  join(__dirname, "self-check.md"),
  "utf8",
);

/**
 * The current version of the prompt package. Consumers (evals, generators)
 * should log this alongside generations so drift shows up in traces.
 */
export const PROMPTS_VERSION = "0.1.0";
