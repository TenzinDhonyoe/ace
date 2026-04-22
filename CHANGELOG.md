# Changelog

## v0.2.0 — 2026-04-21

### Added
- **Source citations on every widget.** New optional `source` field at the widget level (string or array of strings). Rendered as a small italic caption beneath the widget. Trust signal: every AI-generated claim is traceable to the student's own lecture material. The `ace-review` skill now requires `source` on every `slider-sandbox`, `diagram-label`, `concept-card`, and `mcq-quiz`.
- Multi-subject eval cases in `eval/` covering biology, chemistry, CS, and humanities alongside the original engineering case — gives signal on generator quality outside STEM-heavy engineering content.
- `prose` widget type for mixed prose/equation content that doesn't fit the 5 interactive widgets.
- Vercel / Netlify one-click deploy buttons in the README.

### Changed
- **Package rename.** `@ace/components` → `ace-study-components`, `@ace/template` → `ace-study-template` (unscoped, matches the `ace.study` brand). The `@ace` scope requires npm org creation; unscoped names publish immediately with no setup.

## v0.1.0 — 2026-04-21

Initial release.

### Added
- `ace-study-components` — framework-agnostic widget library with 5 types: slider-sandbox, flashcard, mcq-quiz, diagram-label, concept-card.
- `ace-study-template` — renders `site.config.json` into a self-contained HTML file, shipped with a `ace-template` CLI.
- `ace-review` Claude Code skill — end-to-end pipeline from lecture PDFs in `./inputs/` to a deployable site in `./output/`.
- JSON Schema contracts per widget + site-level schema in `packages/ace-components/schemas/`.
- localStorage persistence namespaced `ace:<siteId>:<widgetId>:<key>`, with in-memory fallback for private-mode browsers.
- Eval harness in `eval/` (one golden case).
- CI: tests + bundle-size budget (40KB raw ceiling).
