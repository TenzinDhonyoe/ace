# Publishing

How to cut a release and publish `ace-study-components` + `ace-study-template` to npm,
and how to distribute the `ace-review` skill as a standalone Claude Code skill
(no repo clone required).

## npm packages

Two unscoped packages ship from this monorepo:

- `ace-study-components` — the widget library
- `ace-study-template` — the HTML renderer + `ace-template` CLI (depends on `ace-study-components`)

### One-time setup

1. `npm login` — authenticate as the npm user who will own these names.
2. Verify names are still available: `npm view ace-study-components` and `npm view ace-study-template` (should 404).

### Release a new version

```bash
# 1. Run the full test suite
bun test

# 2. Bump versions (manual — these packages version together for now)
# Edit packages/ace-components/package.json and packages/ace-template/package.json
# Use semver: 0.2.0 → 0.2.1 (patch), 0.3.0 (minor), 1.0.0 (breaking).

# 3. Rewrite the workspace dep to the published version BEFORE publishing template
# packages/ace-template/package.json:
#   "dependencies": { "ace-study-components": "^0.2.0" }   # not "workspace:*"
# Revert after publish so local dev continues to work.

# 4. Publish components first (template depends on it)
cd packages/ace-components
npm publish --access public
cd ../..

# 5. Publish template
cd packages/ace-template
npm publish --access public
cd ../..

# 6. Restore the workspace dep in packages/ace-template/package.json:
#   "dependencies": { "ace-study-components": "workspace:*" }

# 7. Tag + push
git add CHANGELOG.md packages/
git commit -m "release: vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

### Sanity test post-publish

```bash
# From a temp directory completely outside the repo
cd /tmp && mkdir ace-smoke && cd ace-smoke

# Use the published CLI to render the reference config
echo '{"version":"0.1","meta":{"course":"TEST","title":"Post-publish smoke test"},"sections":[{"id":"s1","title":"Section 1","widgets":[{"type":"concept-card","id":"c1","props":{"question":"Does the published package render?","answer":"Yes."}}]}]}' > site.config.json

bunx ace-study-template site.config.json -o out/
open out/index.html
```

## Standalone Claude Code skill

The `ace-review` skill in this repo is designed to work with or without a local
clone. For students who don't want to touch git, distribute it as a standalone skill:

### Install path (for end users)

```bash
# 1. Install Claude Code (https://claude.com/claude-code) if not already.

# 2. Pull the skill file into the user's global skills directory
mkdir -p ~/.claude/skills/ace-review
curl -fsSL https://raw.githubusercontent.com/TenzinDhonyoe/ace/main/.claude/skills/ace-review/SKILL.md \
  -o ~/.claude/skills/ace-review/SKILL.md

# 3. Install bun (https://bun.sh) — the skill uses it to run the renderer.

# 4. Create a working folder anywhere
mkdir -p ~/my-review/inputs
cp ~/Downloads/*.pdf ~/my-review/inputs/
cd ~/my-review

# 5. Run the skill
claude
> /ace-review
```

The skill uses `bunx ace-study-template` to render, which downloads the published
package on first use. No repo clone required.

### What the standalone path needs

The skill file (`.claude/skills/ace-review/SKILL.md`) is already path-independent
as of v0.2.0 — no hardcoded `/Users/` paths, falls back gracefully from `bunx` to
a local monorepo checkout if the user happens to be inside the repo.

For a future Claude Code plugin marketplace release, the skill will need:
- A `plugin.json` or equivalent manifest (format TBD by Claude Code)
- A signed release with the skill bundle
- Versioning tied to the npm package version

Track this in TODOS when the marketplace format stabilizes.
