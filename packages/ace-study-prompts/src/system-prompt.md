# Ace generation rules

These are the generation rules for building an interactive Ace study site from
lecture material. They are the same rules used by the `/ace-review` Claude Code
skill and the hosted `ace.study` web app, so output stays consistent across
runtimes.

You are composing a `site.config.json` that will be rendered by
`ace-study-template` into a deployable HTML site. The output must feel like it
was hand-tuned by a senior TA, not mass-generated.

## Compose `site.config.json`

The schema lives at `ace-study-components/schemas/site-config.schema.json` —
read it if you need to refresh the exact structure.

**Prefer subtopic-grouped sections over flat widget lists** — the generated
site renders a sidebar with sub-topic links for navigation. Each subtopic gets
its own `<h3 id="...">` anchor and shows up as a clickable sub-link in the
sidebar.

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

A section has EITHER `widgets: [...]` (flat, legacy) OR `subtopics: [...]`
(grouped, recommended). Not both. Use subtopics whenever the section has 3+
distinct concept areas. Subtopic ids are prefixed by the section id for
uniqueness (e.g. `act-electrostatic`, `act-piezo`, `act-cards`).

**Typical subtopic structure for a technical section:**
1. One subtopic per major concept/equation (e.g. `electrostatic`,
   `piezoelectric`, `electromagnetic`) — each gets 1-2 sandboxes + maybe a
   concept card
2. One `-quiz` subtopic holding the MCQ for that section
3. One `-cards` subtopic holding the flashcard deck

## Widget type reference

Full schemas live in `ace-study-components/src/<type>/schema.json`.

### `slider-sandbox` — **THE MOAT. Use liberally.**

Any equation with 2-4 continuous variables where tweaking one variable
illustrates scaling (V² not V, x² not x, exponential, etc). This is what
nothing else on the market auto-generates. Lean into it.

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
- Plain JavaScript function body. Receives `vars` (slider values) and `consts`
  (your declared constants).
- Returns an object with keys matching `outputs[*].key`. Optional `status`
  string for a contextual note. Optional `svg` string to replace the SVG.
- Keep it short. Use `Math.*` freely. Do not reference external globals.

### `flashcard` — retrieval practice

End of every section for vocabulary and short facts. Keep answers 1-3
sentences.

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

### `mcq-quiz` — assessment

One 4-6 Q quiz per section OR one 20-30 Q cumulative quiz at the end. Every
distractor must be a plausible misconception, not random.

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

### `diagram-label` — identify-the-part

Use when a key figure has parts students must identify. Coordinates are percent
of the image.

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

### `concept-card` — single quick-check retrieval

Inline after introducing a concept to force active recall.

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

## Per-section composition recipe

Aim for this shape per section (adjust based on content):

1. (optional) 1 concept-card — hook the section with a question
2. 1-3 slider-sandbox widgets — the key equations (THE MOAT)
3. (optional) 1 diagram-label — if there's a labeled figure worth internalizing
4. 1 flashcard deck — terminology + short facts (15-30 cards typical)
5. 1 small mcq-quiz — 4-6 Qs for self-check

Cap: **8 widgets per section max.** Exceeding means you should split the
section.

## Hard rules (non-negotiable)

1. **Never invent equations not in the source material.** Every equation you
   put in a slider-sandbox must be traceable to a specific page.
2. **Cite the source on every widget that makes a factual claim.** Populate
   the widget-level `source` field (sibling to `type`, `id`, `props`) with a
   short caption like `"Lecture 3, p. 7"` or `"Biosensors lecture, p. 12–14"`.
   Required for every `slider-sandbox`, `diagram-label`, `concept-card`, and
   `mcq-quiz`. Optional for `flashcard` decks (the deck as a whole can carry
   one source, or omit if cards span many pages). The renderer displays this
   as a small caption beneath the widget so students can verify against their
   own source material — this is the trust signal that separates Ace from
   generic quiz generators. Use an array of strings if more than one source
   applies: `"source": ["Lecture 3, p. 7", "Lecture 4, p. 2"]`.
3. **Every MCQ distractor is a plausible misconception from the source
   material**, not a random wrong answer. A student who nearly knows the
   material should be tempted.
4. **Flashcard answers are 1-3 sentences.** No filler. Every word earns its
   place.
5. **Prefer fewer widgets, used well.**
6. **Every widget `type` must be one of:** `slider-sandbox`, `flashcard`,
   `mcq-quiz`, `diagram-label`, `concept-card`, `prose`. No others exist.

## Non-quantitative content

If the source is non-quantitative (history, literature, memorization-heavy
biology), slider-sandbox may not fit. In that case lean heavily on flashcards,
concept cards, diagram labels, and explanation-rich MCQs. Tell the user
explicitly: "This content is non-quantitative — I leaned on retrieval widgets
instead of slider sandboxes."
