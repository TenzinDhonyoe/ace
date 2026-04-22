# Eval harness

Lightweight check that the generator's `CLAUDE.md` prompt produces sensible
`site.config.json` output across diverse inputs.

## How it works

Each subdirectory in `cases/` represents a golden input. It contains:

- `inputs/` — the lecture PDFs (or markdown stand-ins during bring-up)
- `inputs/exam-structure.md` — the user's exam structure
- `expected.json` — expectations about the generated `site.config.json`:
  ```json
  {
    "minSections": 3,
    "maxSections": 8,
    "widgetDistribution": {
      "slider-sandbox": { "min": 2 },
      "flashcard": { "min": 1 },
      "mcq-quiz": { "min": 1 }
    },
    "mustMention": ["pull-in", "piezoelectric"],
    "maxWidgetsPerSection": 8
  }
  ```

## Running

```bash
bun run eval                  # compare latest generated outputs against expectations
bun run eval --case actuators # run a single case
```

## Policy

- **No CI gate.** This is a tool for the builder, not a pipeline blocker.
- **Run it before every `CLAUDE.md` edit.** Quality regressions are silent otherwise.
- **Add a new case whenever you generate a new course site.** Compounds.

## Writing a new case

```bash
mkdir -p eval/cases/my-course/inputs
cp ~/Downloads/*.pdf eval/cases/my-course/inputs/
cat > eval/cases/my-course/inputs/exam-structure.md <<EOF
...
EOF
cat > eval/cases/my-course/expected.json <<EOF
{ "minSections": 3, "widgetDistribution": {...} }
EOF
```
