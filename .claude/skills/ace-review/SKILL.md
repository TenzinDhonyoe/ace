---
name: ace-review
description: Generate an interactive exam review site from lecture PDFs in the inputs/ directory. Reads every PDF, maps content onto 5 widget types (sliders, flashcards, MCQs, diagram labels, concept cards), writes site.config.json, renders to output/index.html. Trigger phrases - "/ace-review", "generate review site", "build my study site", "make exam review from these pdfs", "ace review".
---

# Ace Review — end-to-end exam review site generator

You are generating an interactive exam review site from the lecture PDFs in `./inputs/`. The output must feel like it was hand-tuned by a senior TA, not mass-generated. This skill orchestrates the whole pipeline in one run:

1. Discover inputs
2. Read every PDF
3. Compose `site.config.json`
4. Render HTML via `ace-study-template`
5. Report completion

## Step 1 — Discover and orient

Run these checks first, in this order. Never skip.

**Bun preflight.** Ace depends on Bun for both `bun install` and the renderer CLI. Check it exists:

```bash
command -v bun >/dev/null 2>&1 && bun --version || echo "BUN_MISSING"
```

If the output is `BUN_MISSING`, STOP and tell the user:
> "Bun is required. Install it from https://bun.sh (one-line install), then run `/ace-review` again."

Do not attempt to fall back to `npm` or `npx` — the renderer CLI and the test suite both assume Bun.

**Inputs check.**

```bash
ls -la inputs/ 2>/dev/null
```

If `inputs/` is empty or missing, STOP and tell the user:
> "I need lecture PDFs in `./inputs/` to generate a site. Drop your PDFs in that folder (plus an optional `inputs/exam-structure.md` describing the exam format and sections to cover), then run `/ace-review` again in this same session."

Read `inputs/exam-structure.md` if it exists. If it's missing, ask the user once for:
- Course code (e.g., BME804)
- Exam format (MCQ-heavy, problem-set, mixed)
- Sections to cover (3-8 sections ideal)

Then proceed. If the user just says "go" or the answers are too vague, infer from the PDF contents and proceed without re-asking.

## Step 2 — Read every PDF

Use the Read tool on each `inputs/*.pdf` file. Claude Code reads PDFs natively (text + images via the API).

**After reading each PDF, emit one progress line** so the user knows something is happening during long multi-PDF runs. Format:

> `Read <filename> — N pages, E equations, F figures.`

Count what you actually saw. Ballpark figures are fine; this is a status signal, not a metric.

**If a single PDF exceeds ~30 pages or you get close to token limits:**
- Read it in chunks (pages 1–20, then 21–40, etc.)
- Take short notes per lecture (1 short paragraph of key concepts + equations + figures)
- Synthesize from your notes rather than re-reading the full PDFs when composing widgets

Build a mental outline:
- What are the 3–8 major topic areas?
- What equations appear, with their page numbers (you will cite these)?
- What figures appear that could become diagram-labels?
- What vocabulary needs flashcards?
- What misconceptions are likely to trip up students (for MCQ distractors)?

## Step 3 — Compose `site.config.json`

Read the shared generation rules first:

```
packages/ace-study-prompts/src/system-prompt.md
```

That file is the single source of truth for how to compose a site config —
widget type reference, per-section recipe, hard rules, non-quantitative
guidance. The hosted `ace.study` web app uses the same file, so output quality
stays aligned across runtimes. Don't duplicate those rules here; always read
from the package.

Then write `./output/site.config.json` following the rules you just read. The
schema lives at `packages/ace-components/schemas/site-config.schema.json` —
consult it for exact field shapes.

## Step 3.5 — Self-validate the config before rendering

Before calling the renderer, re-open `packages/ace-components/schemas/site-config.schema.json` and check `output/site.config.json` against it. You do not need a validator tool — do the check by reading:

- Every widget's `type` is one of the enum values (`slider-sandbox`, `flashcard`, `mcq-quiz`, `diagram-label`, `concept-card`).
- Every widget has an `id` and every required field for its type.
- Every section has `id`, `title`, and a `widgets` array.
- `site.id`, `site.title`, and `site.sections` are all present.

If anything fails, fix the config in place and re-check before moving on. This catches ~90% of the errors that would otherwise surface as a renderer stack trace.

## Step 4 — Render to HTML

After writing `output/site.config.json`, resolve the renderer in this order (try each; stop at the first that works):

**A. Local monorepo checkout (the default today — student cloned the ace repo):**
```bash
test -f packages/ace-template/bin/cli.js && bun install 2>&1 | tail -3
bun packages/ace-template/bin/cli.js output/site.config.json -o output/
```

**B. npm-published (works once the packages are on npm — currently unpublished, so this path will 404):**
```bash
bunx ace-study-template output/site.config.json -o output/
# or, if bun isn't available:
npx --yes ace-study-template output/site.config.json -o output/
```

**C. Arbitrary cwd but repo is elsewhere on disk:**
Locate the repo root by looking for `packages/ace-template/bin/cli.js` upward from the user's cwd, or ask the user for the path. Then:
```bash
bun "<repo>/packages/ace-template/bin/cli.js" output/site.config.json -o output/
```

Never hardcode an absolute path. The skill should work for any user on any machine. Path A is preferred while the packages are unpublished because it avoids a network round-trip and a guaranteed 404. Flip A/B once `ace-study-template` is live on npm.

This produces:
- `output/index.html` — open in a browser
- `output/ace-components.js` — the widget bundle
- `output/ace-styles.css` — shared styles

## Step 5 — Self-check + report

Read the shared self-check checklist and run through every item:

```
packages/ace-study-prompts/src/self-check.md
```

Then confirm `output/index.html` exists (the renderer step succeeded).

Report to the user. Use this template and fill in the actual counts and percentages:

> "Generated `<course>` review site: N sections, W widgets total.
>
> **Widget mix:** S% sliders · F% flashcards · M% MCQs · D% diagrams · C% concept cards.
> (Target for quantitative courses: sliders ≥ 30%. For humanities, expect flashcards/concept cards to dominate — that's fine.)
>
> **Inferred structure:** [only include this line if `inputs/exam-structure.md` was missing or too vague] course code `<course>`, format `<format>`, `<N>` sections — inferred from PDF contents. If wrong, edit the `sections` array in `output/site.config.json` and re-render.
>
> **Open it:** `open output/index.html` — or drag `output/` onto https://app.netlify.com/drop.
>
> **Edit without regenerating:** hand-edit `output/site.config.json`, then re-render with:
> ```
> bun packages/ace-template/bin/cli.js output/site.config.json -o output/
> ```
> (Keep in sync with Step 4 path A — this is the same command.)"

## Failure modes and what to do

| Symptom | What to do |
|---|---|
| `inputs/` is empty | STOP, tell user to add PDFs |
| PDF won't read (scanned image, corrupted) | Tell user, skip that PDF, proceed with the rest |
| Context window pressure mid-generation | Write partial `site.config.json` to disk every section, summarize prior sections from the written file |
| `ace-study-template` not installed | Fall back to the absolute-path invocation of `cli.js` |
| Renderer rejects the config | Read the error, fix the specific field in `site.config.json`, re-run |
| Content doesn't fit any widget | Use `concept-card` as a fallback (it's just Q/A) |
