# Ace self-check

Run through this checklist before declaring a generated `site.config.json`
ready to render. Every bullet is a hard requirement — if one fails, fix the
config, don't ship.

- [ ] `site.config.json` is valid JSON and validates against
      `site-config.schema.json`.
- [ ] Every widget `type` is one of:
      `slider-sandbox`, `flashcard`, `mcq-quiz`, `diagram-label`,
      `concept-card`, `prose`.
- [ ] **Every section contains at least one interactive widget**
      (`slider-sandbox`, `flashcard`, `mcq-quiz`, `diagram-label`, or
      `concept-card`). `prose` does NOT count. If a section is prose-only,
      add a flashcard deck, MCQ, or concept card before shipping.
- [ ] **At least 70% of all widgets across the site are interactive.**
      Count interactives ÷ total widgets. If under 70%, replace prose
      with retrieval widgets or delete prose blocks.
- [ ] Every section has ≤ 8 widgets (counting subtopic widgets).
- [ ] Every equation in a `slider-sandbox` is traceable to a specific page of
      the source material. No invented equations.
- [ ] Every `slider-sandbox`, `diagram-label`, `concept-card`, and `mcq-quiz`
      has a non-empty `source` field.
- [ ] Every MCQ distractor is a plausible misconception, not a random wrong
      answer.
- [ ] Every flashcard answer is 1-3 sentences. No filler.
- [ ] Subtopic ids are prefixed by their parent section id
      (e.g. `act-electrostatic`, not `electrostatic`).
- [ ] `meta.course`, `meta.title`, and `meta.generatedAt` are populated.
