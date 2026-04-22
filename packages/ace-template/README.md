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
