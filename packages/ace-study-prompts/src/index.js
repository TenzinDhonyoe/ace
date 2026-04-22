// Exports the generation rules and self-check checklist as strings, so any
// Ace generator (the /ace-review Claude Code skill, the hosted ace.study
// worker, third-party consumers) can load them without filesystem access.
//
// The markdown files beside this module are the source of truth. We read
// them at import time via `import ... with { type: "text" }` when the runtime
// supports it (Node 22+, Bun, most bundlers). Workers / Deno / older Node
// should bundle the markdown at build time.

import systemPrompt from "./system-prompt.md" with { type: "text" };
import selfCheck from "./self-check.md" with { type: "text" };

export { systemPrompt, selfCheck };

/**
 * The current version of the prompt package. Consumers (evals, generators)
 * should log this alongside generations so drift shows up in traces.
 */
export const PROMPTS_VERSION = "0.1.0";
