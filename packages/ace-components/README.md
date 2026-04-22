# ace-study-components

Framework-agnostic interactive study widgets. Vanilla JS. Zero deps. ~10KB gzipped.

Part of [Ace](https://github.com/TenzinDhonyoe/ace) — open-source infrastructure
for AI-generated interactive study content.

## Install

```bash
npm install ace-study-components
# or
bun add ace-study-components
```

## Widgets

| Type             | What it does                                                                    |
| ---------------- | ------------------------------------------------------------------------------- |
| `slider-sandbox` | Live physics/math sandbox. Sliders wired to a compute function + optional SVG.  |
| `flashcard`      | Blur-to-reveal deck with mastery tracking. Persists to localStorage.            |
| `mcq-quiz`       | Multiple choice with distractors, explanations, and per-question state.         |
| `diagram-label`  | Numbered hotspots on an image; student drags labels to the right spot.          |
| `concept-card`   | One quick-check retrieval card. Good for section hooks.                         |
| `prose`          | Mixed prose + equations (KaTeX-rendered). For content that doesn't interact.    |

## Use in any HTML page

```html
<link rel="stylesheet" href="https://unpkg.com/ace-study-components/styles.css">
<div id="mount"></div>
<script type="module">
  import { SliderSandbox } from "https://unpkg.com/ace-study-components";
  new SliderSandbox().mount(
    document.getElementById("mount"),
    {
      id: "ohms-law",
      title: "Ohm's law",
      variables: [
        { key: "V", label: "Voltage", unit: "V", min: 0, max: 12, step: 0.1, initial: 5 },
        { key: "R", label: "Resistance", unit: "Ω", min: 1, max: 1000, step: 1, initial: 100 }
      ],
      outputs: [
        { key: "I", label: "Current", unit: "A", format: "si" },
        { key: "P", label: "Power", unit: "W", format: "si" }
      ],
      compute: "const I = vars.V / vars.R; return { I, P: vars.V * I };"
    },
    { siteId: "my-page" }
  );
</script>
```

No React. No build step. Works in plain HTML, React, Vue, anywhere.

## Use in JavaScript / TypeScript

```js
import { SliderSandbox, Flashcard, MCQQuiz, DiagramLabel, ConceptCard, Prose } from "ace-study-components";
import { registry, widgetTypes } from "ace-study-components/registry";
import { validate } from "ace-study-components";
import siteConfigSchema from "ace-study-components/schemas/site-config";
```

## Schemas

Every widget validates its props against a JSON Schema at mount time. Schemas
live in `src/<widget>/schema.json` and are importable:

```js
import sliderSchema from "ace-study-components/widgets/slider-sandbox/schema";
```

The site-level schema (what the `ace-review` generator emits) lives in
`schemas/site-config.schema.json`.

## localStorage

State is namespaced `ace:<siteId>:<widgetId>:<key>` so multiple generated sites
on the same origin don't collide. Falls back to in-memory storage in private
browsing mode.

## License

[MIT](../../LICENSE).
