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

```bash
ls -la inputs/ 2>/dev/null
```

If `inputs/` is empty or missing, STOP and tell the user:
> "I need lecture PDFs in `./inputs/` to generate a site. Drop your PDFs in that folder (plus an optional `inputs/exam-structure.md` describing the exam format and sections to cover), then re-run me."

Read `inputs/exam-structure.md` if it exists. If it's missing, ask the user once for:
- Course code (e.g., BME804)
- Exam format (MCQ-heavy, problem-set, mixed)
- Sections to cover (3-8 sections ideal)

Then proceed. If the user just says "go" or the answers are too vague, infer from the PDF contents and proceed without re-asking.

## Step 2 — Read every PDF

Use the Read tool on each `inputs/*.pdf` file. Claude Code reads PDFs natively (text + images via the API).

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

Write to `./output/site.config.json`. The schema lives at `packages/ace-components/schemas/site-config.schema.json` — read it if you need to refresh the exact structure.

**Prefer subtopic-grouped sections over flat widget lists** — the generated site renders a sidebar with sub-topic links for navigation. Each subtopic gets its own `<h3 id="...">` anchor and shows up as a clickable sub-link in the sidebar.

Summary:

```json
{
  "version": "0.1",
  "siteId": "<course-code>-<yyyy-mm-dd>",
  "meta": {
    "course": "BME804",
    "title": "BME804 — Exam Review",
    "examDate": "2026-04-25",
    "institution": "optional",
    "generatedAt": "<ISO 8601 now>",
    "generatorVersion": "ace-review/0.1"
  },
  "sections": [
    {
      "id": "short-slug",
      "title": "Section Title",
      "summary": "1-2 sentence orientation",
      "subtopics": [
        {
          "id": "short-slug-electrostatic",
          "title": "Electrostatic",
          "summary": "Optional 1-line orientation under the h3",
          "widgets": [/* 1-4 widgets for this subtopic */]
        },
        {
          "id": "short-slug-cards",
          "title": "Flashcards",
          "widgets": [/* flashcard widget */]
        }
      ]
    }
  ]
}
```

A section has EITHER `widgets: [...]` (flat, legacy) OR `subtopics: [...]` (grouped, recommended). Not both. Use subtopics whenever the section has 3+ distinct concept areas. Subtopic ids are prefixed by the section id for uniqueness (e.g. `act-electrostatic`, `act-piezo`, `act-cards`).

**Typical subtopic structure for a technical section:**
1. One subtopic per major concept/equation (e.g. `electrostatic`, `piezoelectric`, `electromagnetic`) — each gets 1-2 sandboxes + maybe a concept card
2. One `-quiz` subtopic holding the MCQ for that section
3. One `-cards` subtopic holding the flashcard deck

### Widget type reference (full schemas are in `packages/ace-components/src/<type>/schema.json`)

**`slider-sandbox`** — **THE MOAT. Use liberally.** Any equation with 2-4 continuous variables where tweaking one variable illustrates scaling (V² not V, x² not x, exponential, etc). This is what nothing else on the market auto-generates. Lean into it.

```json
{
  "type": "slider-sandbox",
  "id": "electrostatic-pullin",
  "props": {
    "title": "Parallel-plate actuator — feel pull-in",
    "constants": { "eps0": 8.854e-12 },
    "variables": [
      { "key": "V", "label": "Voltage V", "unit": "V", "min": 0, "max": 300, "step": 1, "initial": 40 },
      { "key": "A", "label": "Plate area A", "unit": "µm²", "min": 10, "max": 500, "step": 1, "initial": 100 },
      { "key": "x", "label": "Gap x", "unit": "µm", "min": 0.5, "max": 10, "step": 0.1, "initial": 3 },
      { "key": "k", "label": "Spring k", "unit": "N/m", "min": 0.1, "max": 10, "step": 0.1, "initial": 1 }
    ],
    "outputs": [
      { "key": "F", "label": "Force", "unit": "N", "format": "si" },
      { "key": "vpi", "label": "Pull-in V", "unit": "V", "format": "sci" }
    ],
    "compute": "const A_m=vars.A*1e-12, x_m=vars.x*1e-6; const vpi=Math.sqrt(8*vars.k*Math.pow(x_m,3)/(27*consts.eps0*A_m)); const F=0.5*consts.eps0*A_m*vars.V*vars.V/(x_m*x_m); return { F, vpi, status: vars.V >= vpi ? '⚠ past pull-in — plates collapse' : 'stable' };",
    "description": "F = ½ε₀A·V²/x². Pull-in V_pi = √(8kx³ / 27ε₀A).",
    "tip": "Double V → force quadruples. Halve x → force quadruples again."
  }
}
```

Notes for `compute`:
- Plain JavaScript function body. Receives `vars` (slider values) and `consts` (your declared constants).
- Returns an object with keys matching `outputs[*].key`. Optional `status` string for a contextual note. Optional `svg` string to replace the SVG.
- Keep it short. Use `Math.*` freely. Do not reference external globals.

**`flashcard`** — retrieval practice. End of every section for vocabulary and short facts. Keep answers 1-3 sentences.

```json
{
  "type": "flashcard",
  "id": "act-cards",
  "props": {
    "title": "Actuators — flashcards",
    "cards": [
      { "q": "What is pull-in voltage?",
        "a": "Voltage at which the movable plate of an electrostatic actuator snaps onto and sticks to the fixed plate." }
    ]
  }
}
```

**`mcq-quiz`** — assessment. One 4-6 Q quiz per section OR one 20-30 Q cumulative quiz at the end. Every distractor must be a plausible misconception, not random.

```json
{
  "type": "mcq-quiz",
  "id": "self-test",
  "props": {
    "questions": [
      { "q": "Electrostatic force between parallel plates scales as:",
        "options": ["V, A, 1/x", "V², A, 1/x²", "V², A², 1/x", "V, A², 1/x³"],
        "answer": 1,
        "explanation": "F = ½ε₀A·V²/x². V squared, area linear, inverse square of gap.",
        "topic": "electrostatic" }
    ]
  }
}
```

**`diagram-label`** — identify-the-part. Use when a key figure has parts students must identify. Coordinates are percent of the image.

```json
{
  "type": "diagram-label",
  "id": "elisa-parts",
  "props": {
    "title": "Identify the ELISA components",
    "image": { "src": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'>...</svg>", "width": 300, "height": 200 },
    "hotspots": [
      { "label": "Capture antibody", "x": 25, "y": 40 },
      { "label": "Antigen", "x": 50, "y": 55 }
    ]
  }
}
```

**`concept-card`** — single quick-check retrieval. Inline after introducing a concept to force active recall.

```json
{
  "type": "concept-card",
  "id": "pullin-recall",
  "props": {
    "question": "What physically happens above pull-in voltage, and why?",
    "answer": "Deflection exceeds x/3. The spring cannot balance the electrostatic force, so the movable plate collapses onto the fixed plate."
  }
}
```

### Per-section composition recipe

Aim for this shape per section (adjust based on content):

1. (optional) 1 concept-card — hook the section with a question
2. 1-3 slider-sandbox widgets — the key equations (THE MOAT)
3. (optional) 1 diagram-label — if there's a labeled figure worth internalizing
4. 1 flashcard deck — terminology + short facts (15-30 cards typical)
5. 1 small mcq-quiz — 4-6 Qs for self-check

Cap: **8 widgets per section max.** Exceeding means you should split the section.

### Hard rules (non-negotiable)

1. **Never invent equations not in the PDFs.** Every equation you put in a slider-sandbox must be traceable to a specific page.
2. **Cite the source on every widget that makes a factual claim.** Populate the widget-level `source` field (sibling to `type`, `id`, `props`) with a short caption like `"Lecture 3, p. 7"` or `"Biosensors lecture, p. 12–14"`. Required for every `slider-sandbox`, `diagram-label`, `concept-card`, and `mcq-quiz`. Optional for `flashcard` decks (the deck as a whole can carry one source, or omit if cards span many pages). The renderer displays this as a small caption beneath the widget so students can verify against their own PDFs — this is the trust signal that separates Ace from generic quiz generators. Use an array of strings if more than one source applies: `"source": ["Lecture 3, p. 7", "Lecture 4, p. 2"]`.
3. **Every MCQ distractor is a plausible misconception from the lecture**, not a random wrong answer. A student who nearly knows the material should be tempted.
4. **Flashcard answers are 1-3 sentences.** No filler. Every word earns its place.
5. **Prefer fewer widgets, used well.**
6. **Every widget `type` must be one of:** `slider-sandbox`, `flashcard`, `mcq-quiz`, `diagram-label`, `concept-card`, `prose`. No others exist.

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

Before declaring done, verify:

- [ ] `output/site.config.json` exists and is valid JSON
- [ ] Every widget `type` is one of the 5 known types
- [ ] Every section has ≤ 8 widgets
- [ ] Every equation in a slider-sandbox is traceable to the PDFs
- [ ] Every `slider-sandbox`, `diagram-label`, `concept-card`, and `mcq-quiz` has a `source` field populated
- [ ] Every MCQ distractor is a plausible misconception
- [ ] Every flashcard answer is 1-3 sentences
- [ ] `output/index.html` exists

Report to the user:

> "Generated `<course>` review site: N sections, W widgets total (S sliders, F flashcards, M MCQs, D diagrams, C concept cards). Open `output/index.html` in a browser, or drag `output/` onto Vercel to deploy.
>
> To edit: hand-edit `output/site.config.json` then re-run `bunx ace-study-template output/site.config.json -o output/`."

## Non-quantitative content

If the course is non-quantitative (history, literature, memorization-heavy biology), slider-sandbox may not fit. In that case lean heavily on flashcards, concept cards, diagram labels, and explanation-rich MCQs. Tell the user explicitly: "This content is non-quantitative — I leaned on retrieval widgets instead of slider sandboxes."

## Failure modes and what to do

| Symptom | What to do |
|---|---|
| `inputs/` is empty | STOP, tell user to add PDFs |
| PDF won't read (scanned image, corrupted) | Tell user, skip that PDF, proceed with the rest |
| Context window pressure mid-generation | Write partial `site.config.json` to disk every section, summarize prior sections from the written file |
| `ace-study-template` not installed | Fall back to the absolute-path invocation of `cli.js` |
| Renderer rejects the config | Read the error, fix the specific field in `site.config.json`, re-run |
| Content doesn't fit any widget | Use `concept-card` as a fallback (it's just Q/A) |
