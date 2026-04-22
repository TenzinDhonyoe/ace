# Security Policy

## Supported Versions

Ace is pre-1.0 software. Only the latest `0.x` release receives security fixes.

| Version  | Supported |
| -------- | --------- |
| 0.2.x    | ✅        |
| < 0.2.0  | ❌        |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.**

Email [tendhon3015@gmail.com](mailto:tendhon3015@gmail.com) with:

- A description of the vulnerability
- Steps to reproduce
- The version affected
- Any suggested fix

You should expect an initial response within 72 hours. We aim to ship a patch
release within 7 days of confirmed critical vulnerabilities.

## Scope

In scope:
- The published npm packages `ace-study-components` and `ace-study-template`
- The `ace-review` Claude Code skill
- Generated sites that follow the documented schema

Out of scope:
- Third-party PDFs users drop into `inputs/` (users own that trust boundary)
- The `compute` JS string in `slider-sandbox` widgets — documented as
  author-provided code that runs in the browser. Treat generated configs from
  untrusted sources as you would any foreign JavaScript.

## Known trust boundaries

- `compute` functions in slider-sandbox widgets execute in the browser via
  `new Function()`. By design. A site author authoring their own config is
  authoring JS. Do not render a `site.config.json` from an untrusted source
  without review.
- `site.config.json` values are HTML-escaped at render time; the template
  layer does not execute user strings as HTML.
