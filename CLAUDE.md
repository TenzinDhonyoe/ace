# Ace — Claude Code context

This repo is an **open-source interactive exam-review generator**. The flagship user flow:

1. Student clones this repo
2. Drops lecture PDFs into `./inputs/`
3. Opens Claude Code in this directory and runs `/ace-review`
4. Gets back `./output/index.html` — a deployable study site with live physics sandboxes, flashcards, MCQs, diagram labels, and concept cards

The skill at `.claude/skills/ace-review/SKILL.md` orchestrates the whole pipeline. Read that file for the generator logic.

## Architecture

```
packages/ace-components/   # widget library (5 types, plain JS classes, framework-agnostic)
packages/ace-template/     # site.config.json → HTML renderer + CLI
.claude/skills/ace-review/ # Claude Code skill that does the full pipeline
eval/                      # generator quality harness (run before CLAUDE.md edits)
inputs/                    # user drops PDFs here
output/                    # generated site lands here (gitignored)
```

## Key invariants

- **Component library is vanilla JS** — no React, no build step. Works in static HTML, React, Vue, anywhere.
- **JSON Schema is the contract with the generator.** Per-widget schemas in `packages/ace-components/src/<type>/schema.json`; site-config schema in `packages/ace-components/schemas/site-config.schema.json`. The widget `registry` in `packages/ace-components/registry.js` is the authoritative list.
- **localStorage is namespaced `ace:<siteId>:<widgetId>:<key>`** so multiple generated sites deployed under the same domain don't collide.
- **Bundle budget: 15KB gzipped** for the full component library. CI enforces 40KB raw ceiling.
- **Never invent equations** not present in the user's PDFs. Cite page numbers for every equation in a slider-sandbox.
- **MCQ distractors must be plausible misconceptions**, not random wrong answers.

## Development commands

```bash
bun install       # one-time, also needed before running the skill
bun test          # runs all 59 tests across 9 files
bun run eval      # generator quality harness
bunx @ace/template output/site.config.json -o output/   # manual render after editing config
```

## When the user asks for...

- **"generate a review site" / "build my study site" / "help me study for X"** → invoke the `ace-review` skill (`.claude/skills/ace-review/SKILL.md`). This is the primary entrypoint. Do not hand-author widgets inline.
- **"edit a widget"** → they should hand-edit `output/site.config.json` and re-run `bunx @ace/template`. Don't regenerate from PDFs.
- **"add a new widget type"** → add a folder under `packages/ace-components/src/<new-type>/`, export from `registry.js`, add the type to the enum in `schemas/site-config.schema.json`, write tests.
- **"my site doesn't work in Safari private mode"** → localStorage falls back to in-memory (`src/lib/storage.js`). Widgets should still render.

## Skill routing

- **`/ace-review`** → the generator pipeline. Primary entrypoint.
- Anything design-reviewy on the output → run the site in a browser and eyeball it. No automated visual check in Phase 1.
