# ace-study-prompts

The generation rules and self-check checklist that every Ace generator follows.
Shipped as a package so the `/ace-review` Claude Code skill, the hosted
`ace.study` web app, and any third-party generator all produce consistent
output.

Part of [Ace](https://github.com/TenzinDhonyoe/ace) — open-source
infrastructure for AI-generated interactive study content.

## Why a separate package

Before v0.1, the generation rules lived only inside
`.claude/skills/ace-review/SKILL.md`. The hosted web app needs the same rules
to produce the same quality of output. Copy-pasting invites drift; the eval
harness would test one prompt and the hosted app would run another.

This package is the single source of truth. The markdown files are the
authoritative content; the JS module re-exports them as strings for any
runtime.

## Install

```bash
bun add ace-study-prompts
# or
npm install ace-study-prompts
```

## Use from JavaScript (Bun, Node 22+, Workers with a text loader)

```js
import { systemPrompt, selfCheck, PROMPTS_VERSION } from "ace-study-prompts";

// Pass to any LLM as the system prompt
const response = await anthropic.messages.create({
  model: "claude-opus-4-7",
  system: systemPrompt,
  messages: [{ role: "user", content: userPdfText }],
});

// Run the self-check after generation
console.log(selfCheck);
```

## Use from Claude Code (or any file-reading agent)

The same markdown files ship in the package so an agent can read them
directly:

- `packages/ace-study-prompts/src/system-prompt.md` — generation rules
- `packages/ace-study-prompts/src/self-check.md` — pre-flight checklist

The `/ace-review` Claude Code skill reads these at the start of a run.

## Contract

- **systemPrompt** — the full generation rules as a markdown string. Stable
  across the v0.x line; content changes trigger an eval-harness run before
  release.
- **selfCheck** — the pre-flight invariants as a markdown checklist.
- **PROMPTS_VERSION** — semver string. Log alongside generations so drift
  shows up in traces.

## License

[MIT](../../LICENSE).
