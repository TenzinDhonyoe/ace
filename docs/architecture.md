# Architecture

How Ace is structured and why. This doc is the authoritative engineering reference.
For user-facing usage, see the [root README](../README.md).

## Overview

Ace is a monorepo of two npm packages plus a Claude Code skill:

```
ace-study-components    widget library (6 types, vanilla JS, no build step)
ace-study-template      site.config.json → HTML renderer + `ace-template` CLI
.claude/skills/ace-review   Claude Code pipeline: PDFs → site.config.json → HTML
```

The **component library is the product**. The generator and renderer are reference
consumers that prove the library works end-to-end from raw lecture PDFs to a
deployable study site.

## Pipeline

```
  ./inputs/*.pdf                    ./output/site.config.json              ./output/index.html
      │                                      │                                     │
      │   ace-review (Claude skill)          │   ace-study-template                │
      └──────────────────────────────────────┴─────────────────────────────────────┘
           reads PDFs, maps content              validates config,
           to 6 widget types, writes             mounts widgets from
           a structured JSON config              the registry, emits
                                                 self-contained HTML
```

Each step is independently usable:
- A developer can hand-author `site.config.json` and run only the renderer.
- A user can hand-edit `site.config.json` after generation and re-render.
- Any other AI generator can emit the same schema and hand it to the renderer.

## Key design decisions

1. **Plain-JS classes with `mount(el, props)` / `destroy()`.** Not React, not Web
   Components. The library works in static HTML (primary target), React, Vue, or
   any other runtime. A Web Components wrapper can ship later as opt-in.

2. **JSON Schema per widget, co-located with source** (`src/<widget>/schema.json`).
   Machine-readable by Claude without a compiler. Runtime-validated at `mount()`.
   TS types auto-generated via `json-schema-to-typescript`.

3. **Explicit `registry` object** exported from `ace-study-components` root.
   Adding a widget type = one import + one key. The registry is the API contract
   with the generator prompt.

4. **BEM-prefixed CSS** (`.ace-slider-sandbox__track`). No Shadow DOM. Grep-able,
   restyleable by site authors. Every class is scoped under `.ace-root` to avoid
   leaking into host pages.

5. **ESM primary, CDN-consumable via unpkg.** Widgets load via
   `<script type="module">` from a single URL. No build step required for the
   common case.

6. **`site.config.json` is the contract.** The generator emits it; the renderer
   reads it. Swappable generators (future: other AI providers) without touching
   the renderer.

7. **Error boundaries per widget.** Every `mount()` is try/catch-wrapped. A failed
   widget renders an inline error card rather than breaking the whole page.

8. **localStorage namespacing:** `ace:<siteId>:<widgetId>:<key>`. The `siteId` is
   injected at render time so multiple generated sites deployed under the same
   origin don't collide. Falls back to in-memory storage in private-mode browsers.

9. **Bundle budget: ~15KB gzipped** target for the full component library.
   Current: ~10.6KB gzipped / ~30KB raw. CI enforces a 32KB raw ceiling so
   regressions land loudly.

10. **Source citations at the widget level.** An optional `source` field on any
    widget renders as a small italic caption beneath it ("from Lecture 3, p. 7").
    Trust signal: every AI-generated claim is traceable to the user's own
    lecture material.

## Widget types

Six types cover the vast majority of concept-visualization material:

| Type | Purpose |
|---|---|
| `slider-sandbox` | Interactive equation sandbox. 1–6 sliders wired to a compute function + optional SVG. |
| `flashcard` | Blur-to-reveal deck with mastery tracking. Persists to localStorage. |
| `mcq-quiz` | Multiple choice with distractors, explanations, and per-question state. |
| `diagram-label` | Numbered hotspots on an image; student drags labels into place. |
| `concept-card` | Single quick-check retrieval card. |
| `prose` | Mixed prose + KaTeX-rendered equations for content that doesn't interact. |

New types go under `packages/ace-components/src/<new-type>/` with `index.js`,
`schema.json`, and `index.test.js`, plus an entry in `registry.js` and the
`type` enum in `schemas/site-config.schema.json`. See [CONTRIBUTING.md](../CONTRIBUTING.md).

## Site config contract

`site.config.json` is the boundary between generator and renderer. The schema
lives at [`packages/ace-components/schemas/site-config.schema.json`](../packages/ace-components/schemas/site-config.schema.json).

Shape (simplified):

```jsonc
{
  "version": "0.1",
  "siteId": "<course-code>-<yyyy-mm-dd>",
  "meta": { "course": "BME804", "title": "BME804 Exam Review", "examDate": "2026-04-25" },
  "sections": [
    {
      "id": "act",
      "title": "Microactuators",
      "summary": "Intro to actuators.",
      "subtopics": [
        {
          "id": "act-electrostatic",
          "title": "Electrostatic",
          "widgets": [
            { "type": "slider-sandbox", "id": "pull-in", "props": { /* ... */ }, "source": "Lecture 3, p. 7" }
          ]
        }
      ]
    }
  ]
}
```

A section contains **either** a flat `widgets` array **or** `subtopics[]`, not
both. Subtopics produce `<h3 id>` anchors and appear as sidebar sub-links.

## Storage model

Widget state persists to `localStorage` under `ace:<siteId>:<widgetId>:<key>`:

- `siteId` — injected at render time from `meta.course` + `meta.examDate`
- `widgetId` — the widget's `id` field in the config
- `key` — widget-specific (e.g. `flashcard/got`, `mcq/answer-3`)

If `localStorage` throws or is unavailable (private-mode Safari, etc.), the
library falls back to an in-memory object so widgets still render and function
for the session.

## Quality invariants

Enforced in code or CI:

- **No invented equations.** The generator prompt requires every equation in a
  `slider-sandbox` to be traceable to a specific page in the user's PDFs.
- **MCQ distractors are plausible misconceptions**, not random wrong answers —
  a lecture-material rule, not a runtime check.
- **Bundle stays under 32KB raw.** CI fails the build if it grows past that.
- **Every `slider-sandbox`, `diagram-label`, `concept-card`, and `mcq-quiz` has
  a `source` field** in the generator's output (checked in the skill's
  self-check step).
- **All widget examples validate against their own schema.** Enforced by
  `packages/ace-components/test/registry.test.js`.

## Known limitations

- **PDF chunking:** large lecture decks (>30 pages) may exceed a single model
  context. The skill instructs Claude to read in chunks and synthesize from
  per-lecture notes. No deterministic fallback yet.
- **Non-quantitative subjects:** `slider-sandbox` has no natural home in
  history, literature, or memorization-heavy biology. The skill instructs the
  generator to lean on flashcards, concept cards, and explanation-rich MCQs
  when the course is non-quantitative.
- **Equation hallucination risk.** Mitigated (not solved) by the eval harness
  and the mandatory `source` field. Residual risk is accepted for v0.x.
- **Not yet published to npm.** Use the monorepo locally until publish lands
  (see [PUBLISHING.md](../PUBLISHING.md)).

## Distribution

- **Packages:** `ace-study-components`, `ace-study-template` (unscoped npm,
  unpublished as of v0.2).
- **Skill:** `.claude/skills/ace-review/SKILL.md` ships in this repo. Can be
  copied to `~/.claude/skills/ace-review/` for standalone use once npm publish
  lands.
- **License:** MIT.
