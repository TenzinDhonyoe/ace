# Changelog

## v0.1.0 — 2026-04-21

Initial release.

### Added
- `@ace/components` — framework-agnostic widget library with 5 types: slider-sandbox, flashcard, mcq-quiz, diagram-label, concept-card.
- `@ace/template` — renders `site.config.json` into a self-contained HTML file, shipped with a `ace-template` CLI.
- `ace-review` Claude Code skill — end-to-end pipeline from lecture PDFs in `./inputs/` to a deployable site in `./output/`.
- JSON Schema contracts per widget + site-level schema in `packages/ace-components/schemas/`.
- localStorage persistence namespaced `ace:<siteId>:<widgetId>:<key>`, with in-memory fallback for private-mode browsers.
- Eval harness in `eval/` (one golden case).
- CI: tests + bundle-size budget (40KB raw ceiling).

### Known limitations
- `@ace/components` and `@ace/template` are not yet published to npm. Use via the monorepo for now.
- Widget coverage is optimized for quantitative engineering content. Non-STEM subjects may produce weaker output.
