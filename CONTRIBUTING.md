# Contributing

Thanks for considering a contribution to Ace. This project is small and
opinionated — please read this file before opening a non-trivial PR.

## What Ace is (and isn't)

Ace is open-source infrastructure for AI-generated interactive study content.
Two npm packages ship from this monorepo (`ace-study-components`,
`ace-study-template`) plus a Claude Code skill (`ace-review`) that drives the
end-to-end pipeline from lecture PDFs to a deployable study site.

**In scope:** widget library improvements, generator quality, renderer features
that serve the 5 canonical widget types, better eval coverage, DX polish.

**Not in scope:** bespoke course content, closed-source hosting features, a
Claude-API-backed service (Phase 2+ and separate repo).

See [docs/architecture.md](docs/architecture.md) for the deep rationale.

## Dev setup

```bash
bun install
bun test           # 88 tests across 11 files
bun run eval       # generator quality harness
```

Requires [Bun](https://bun.sh) 1.3+.

## Pull requests

1. Open an issue first for anything larger than a bug fix or doc tweak.
   Drive-by features rarely land.
2. One PR = one change. Don't bundle a refactor with a feature.
3. Tests are non-negotiable. If you add a new branch, add a test that exercises
   it. Co-locate widget tests next to source (`src/<widget>/index.test.js`);
   cross-cutting tests live in `packages/<pkg>/test/`.
4. Keep the diff minimal. Every new file needs a reason.
5. Update CHANGELOG.md under the `## Unreleased` section (add one if missing).

## Adding a new widget type

1. Create `packages/ace-components/src/<type>/`:
   - `index.js` — class extending `Widget`, `static type`, `static schema`, `static examples`
   - `schema.json` — JSON Schema for props
   - `index.test.js` — co-located tests
2. Export from `packages/ace-components/registry.js`.
3. Add the type to the enum in `packages/ace-components/schemas/site-config.schema.json`.
4. Update `.claude/skills/ace-review/SKILL.md` to document the new type.
5. Add an example to the `actuators-stub` eval case.

## Commit messages

Short imperative first line under 72 chars. Body explains the *why*, not the
*what* (the diff already shows what).

## Releasing

See [PUBLISHING.md](PUBLISHING.md).

## Code of conduct

Participation in this project is governed by the [Contributor Covenant](CODE_OF_CONDUCT.md).

## License

By contributing, you agree your contributions are licensed under the MIT
License, same as the project itself.
