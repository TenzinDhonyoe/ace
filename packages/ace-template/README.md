# ace-study-template

Renders an Ace `site.config.json` into a single self-contained HTML study site.
Ships an `ace-template` CLI.

Part of [Ace](https://github.com/TenzinDhonyoe/ace) — open-source infrastructure
for AI-generated interactive study content.

## Install

```bash
npm install ace-study-template
# or
bun add ace-study-template
```

## CLI

```bash
bunx ace-study-template path/to/site.config.json -o output/
# or
npx ace-study-template path/to/site.config.json -o output/
```

Writes:

- `output/index.html` — the deployable site
- `output/ace-components.js` — bundled widgets
- `output/ace-styles.css` — shared CSS

Then drag `output/` onto Vercel / Netlify, or run:

```bash
npx vercel --prod output/
```

## Programmatic

`renderSite(config, opts?)` is a pure function. No filesystem, no network, no
globals. Safe to call from Node, Bun, Deno, Cloudflare Workers, the browser.

```js
import { renderSite } from "ace-study-template";
import fs from "node:fs";

const config = JSON.parse(fs.readFileSync("site.config.json", "utf8"));
const html = renderSite(config, {
  componentsBundleUrl: "./ace-components.js",  // default
  stylesUrl: "./ace-styles.css"                // default
});
fs.writeFileSync("output/index.html", html);
```

### Use from a Cloudflare Worker (or any edge runtime)

Point `componentsBundleUrl` and `stylesUrl` at a CDN so the generated site
doesn't need co-located assets.

```js
import { renderSite } from "ace-study-template";

export default {
  async fetch(request, env) {
    const config = await request.json();
    const html = renderSite(config, {
      componentsBundleUrl: "https://unpkg.com/ace-study-components@0.2/index.js",
      stylesUrl:           "https://unpkg.com/ace-study-components@0.2/styles.css",
    });
    // Write to R2, return as response body, etc.
    await env.SITES.put(`${config.siteId}/index.html`, html, {
      httpMetadata: { contentType: "text/html; charset=utf-8" },
    });
    return new Response(config.siteId);
  },
};
```

### Contract

- **Input:** a `site.config.json`-shaped object. Validated against the
  `site-config.schema.json` in `ace-study-components`; throws on invalid input
  or unknown widget types.
- **Output:** a single complete HTML document string. UTF-8 safe.
- **Determinism:** identical input ⇒ identical output, provided
  `meta.generatedAt` is fixed. Without `generatedAt`, a `Date.now()` cache-bust
  token is injected for dev-time convenience.

## Config shape

See the schema at
[`ace-study-components/schemas/site-config`](https://github.com/TenzinDhonyoe/ace/blob/main/packages/ace-components/schemas/site-config.schema.json).

High-level:

```json
{
  "version": "0.1",
  "siteId": "course-code-yyyy-mm-dd",
  "meta": { "course": "BME804", "title": "BME804 Exam Review" },
  "sections": [
    {
      "id": "section-slug",
      "title": "Section Title",
      "subtopics": [
        {
          "id": "section-slug-topic",
          "title": "Topic",
          "widgets": [
            {
              "type": "slider-sandbox",
              "id": "widget-id",
              "props": { "...": "..." },
              "source": "Lecture 3, p. 7"
            }
          ]
        }
      ]
    }
  ]
}
```

The optional `source` field on a widget renders as a small italic footnote
beneath the widget so students can verify claims against their own lectures.

## License

[MIT](../../LICENSE).
