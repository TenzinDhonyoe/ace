import { describe, it, expect } from "bun:test";
import { renderSite } from "../src/render.js";

const validConfig = {
  version: "0.1",
  siteId: "test-site-1",
  meta: { course: "BME804", title: "BME804 Exam Review" },
  sections: [
    {
      id: "act",
      title: "Microactuators",
      summary: "Intro to actuators.",
      widgets: [
        {
          type: "concept-card",
          id: "c1",
          props: { question: "What is pull-in?", answer: "Plate collapse above V_pi." }
        },
        {
          type: "mcq-quiz",
          id: "q1",
          props: {
            questions: [{ q: "Best?", options: ["a", "b"], answer: 0, explanation: "a." }]
          }
        }
      ]
    }
  ]
};

describe("renderSite", () => {
  it("renders valid config to HTML", () => {
    const html = renderSite(validConfig);
    expect(html).toMatch(/<!DOCTYPE html>/);
    expect(html).toMatch(/BME804 Exam Review/);
    expect(html).toMatch(/id="act"/);
    expect(html).toMatch(/id="ace-act-c1"/);
    expect(html).toMatch(/id="ace-act-q1"/);
  });

  it("throws on invalid config", () => {
    expect(() => renderSite({})).toThrow(/Invalid site.config/);
  });

  it("throws on unknown widget type", () => {
    const bad = {
      ...validConfig,
      sections: [{
        ...validConfig.sections[0],
        widgets: [{ type: "concept-card", id: "c1", props: { question: "a", answer: "b" } }, ...validConfig.sections[0].widgets]
      }]
    };
    bad.sections[0].widgets[0].type = "nonexistent-widget";
    expect(() => renderSite(bad)).toThrow(/Unknown widget type|Invalid site/);
  });

  it("escapes HTML in title and summary", () => {
    const malicious = {
      ...validConfig,
      meta: { ...validConfig.meta, title: "<script>alert(1)</script>" }
    };
    const html = renderSite(malicious);
    expect(html).not.toMatch(/<script>alert/);
    expect(html).toMatch(/&lt;script&gt;/);
  });

  it("respects componentsBundleUrl + stylesUrl options", () => {
    const html = renderSite(validConfig, {
      componentsBundleUrl: "https://cdn.example.com/ace.js",
      stylesUrl: "https://cdn.example.com/ace.css"
    });
    expect(html).toMatch(/cdn\.example\.com\/ace\.js/);
    expect(html).toMatch(/cdn\.example\.com\/ace\.css/);
  });

  it("renders source caption when widget has a source string", () => {
    const cited = {
      ...validConfig,
      sections: [{
        ...validConfig.sections[0],
        widgets: [{
          type: "concept-card",
          id: "c1",
          props: { question: "q", answer: "a" },
          source: "Lecture 3, p. 7"
        }]
      }]
    };
    const html = renderSite(cited);
    expect(html).toMatch(/class="ace-source">from Lecture 3, p\. 7/);
    expect(html).toMatch(/class="ace-widget-wrap"/);
  });

  it("joins multiple sources with middle dot", () => {
    const cited = {
      ...validConfig,
      sections: [{
        ...validConfig.sections[0],
        widgets: [{
          type: "concept-card",
          id: "c1",
          props: { question: "q", answer: "a" },
          source: ["Lecture 3, p. 7", "Lecture 4, p. 2"]
        }]
      }]
    };
    const html = renderSite(cited);
    expect(html).toMatch(/Lecture 3, p\. 7 · Lecture 4, p\. 2/);
  });

  it("omits source wrapper when no source provided", () => {
    const html = renderSite(validConfig);
    expect(html).not.toMatch(/ace-widget-wrap/);
    expect(html).not.toMatch(/ace-source/);
  });

  it("escapes HTML in source", () => {
    const cited = {
      ...validConfig,
      sections: [{
        ...validConfig.sections[0],
        widgets: [{
          type: "concept-card",
          id: "c1",
          props: { question: "q", answer: "a" },
          source: "<script>alert(1)</script>"
        }]
      }]
    };
    const html = renderSite(cited);
    expect(html).not.toMatch(/<script>alert/);
    expect(html).toMatch(/&lt;script&gt;/);
  });

  it("includes nav links for every section", () => {
    const multi = {
      ...validConfig,
      sections: [
        validConfig.sections[0],
        { id: "bio", title: "Biosensors", widgets: [
          { type: "concept-card", id: "c", props: { question: "q", answer: "a" } }
        ] }
      ]
    };
    const html = renderSite(multi);
    expect(html).toMatch(/<a href="#act">Microactuators<\/a>/);
    expect(html).toMatch(/<a href="#bio">Biosensors<\/a>/);
  });

  // --- v0.3 contract tests: subtopics, purity, cache-busting, Worker-compat ---

  it("renders subtopic-grouped sections with h3 anchors + sub-links", () => {
    const subs = {
      ...validConfig,
      sections: [{
        id: "act",
        title: "Microactuators",
        subtopics: [
          {
            id: "act-electrostatic",
            title: "Electrostatic",
            summary: "Parallel-plate drive.",
            widgets: [
              { type: "concept-card", id: "c1", props: { question: "q", answer: "a" } }
            ]
          },
          {
            id: "act-piezo",
            title: "Piezoelectric",
            widgets: [
              { type: "concept-card", id: "c2", props: { question: "q", answer: "a" } }
            ]
          }
        ]
      }]
    };
    const html = renderSite(subs);
    expect(html).toMatch(/<h3 id="act-electrostatic">Electrostatic<\/h3>/);
    expect(html).toMatch(/<h3 id="act-piezo">Piezoelectric<\/h3>/);
    // Sidebar sub-links
    expect(html).toMatch(/<a href="#act-electrostatic">Electrostatic<\/a>/);
    expect(html).toMatch(/<a href="#act-piezo">Piezoelectric<\/a>/);
    // Subtopic summary renders
    expect(html).toMatch(/Parallel-plate drive\./);
    // Both subtopic widgets get mount divs
    expect(html).toMatch(/id="ace-act-c1"/);
    expect(html).toMatch(/id="ace-act-c2"/);
  });

  it("uses meta.generatedAt for asset cache-busting when provided", () => {
    const dated = {
      ...validConfig,
      meta: { ...validConfig.meta, generatedAt: "2026-04-22T12:00:00Z" }
    };
    const html = renderSite(dated);
    expect(html).toMatch(/v=2026-04-22T12%3A00%3A00Z/);
  });

  it("falls back to Date.now() cache-bust when generatedAt absent", () => {
    const html = renderSite(validConfig);
    // Any numeric v= token is fine; we just don't want literal "undefined" or empty
    expect(html).toMatch(/v=\d+/);
    expect(html).not.toMatch(/v=undefined/);
    expect(html).not.toMatch(/v=&/);
  });

  it("is a pure function: identical input ⇒ identical output when generatedAt is fixed", () => {
    const fixed = {
      ...validConfig,
      meta: { ...validConfig.meta, generatedAt: "2026-04-22T00:00:00Z" }
    };
    expect(renderSite(fixed)).toBe(renderSite(fixed));
  });

  it("does not reference Node-only globals (Worker-compat smoke)", () => {
    // If renderSite ever introduces fs/path/process/global refs, this catches it
    // by inspecting the function's source string. Cheap but useful smoke test.
    const src = renderSite.toString();
    expect(src).not.toMatch(/\brequire\s*\(/);
    expect(src).not.toMatch(/\bprocess\.(env|cwd|platform)/);
    expect(src).not.toMatch(/\b(readFileSync|writeFileSync|existsSync)\b/);
  });

  it("synthesizes siteId from meta when siteId missing", () => {
    const noId = {
      ...validConfig,
      meta: { ...validConfig.meta, examDate: "2026-04-25" }
    };
    delete noId.siteId;
    const html = renderSite(noId);
    expect(html).toMatch(/<code>bme804-2026-04-25<\/code>/);
  });

  it("synthesizes a fallback siteId when course + examDate both missing", () => {
    const minimal = {
      ...validConfig,
      meta: { course: "BME804", title: "BME804 Review" }
    };
    delete minimal.siteId;
    const html = renderSite(minimal);
    // Slug from "bme804-" collapses to "bme804"
    expect(html).toMatch(/<code>bme804<\/code>/);
  });

  it("escapes </script> in componentsBundleUrl so attacker can't break out of <script type=\"module\">", () => {
    const html = renderSite(validConfig, {
      componentsBundleUrl: 'https://cdn.example.com/a.js"></script><script>alert(1)//'
    });
    // Find the module script span and verify the attacker's </script> is escaped
    const moduleStart = html.indexOf('<script type="module">');
    const moduleEnd = html.indexOf('</script>', moduleStart + 1);
    const moduleBlock = html.substring(moduleStart, moduleEnd);
    // The attacker's </script> should appear ONLY in escaped form inside the JS string
    expect(moduleBlock).toMatch(/<\\\/script>/);
    // And the block must still contain our trailing tryRender marker — proving
    // we did not get truncated by premature HTML tag-close
    expect(moduleBlock).toMatch(/tryRender/);
  });

  it("handles flat widgets + subtopics in same section (both render)", () => {
    const mixed = {
      ...validConfig,
      sections: [{
        id: "mix",
        title: "Mixed",
        widgets: [
          { type: "concept-card", id: "flat1", props: { question: "q", answer: "a" } }
        ],
        subtopics: [{
          id: "mix-sub",
          title: "Sub",
          widgets: [
            { type: "concept-card", id: "sub1", props: { question: "q", answer: "a" } }
          ]
        }]
      }]
    };
    const html = renderSite(mixed);
    expect(html).toMatch(/id="ace-mix-flat1"/);
    expect(html).toMatch(/id="ace-mix-sub1"/);
  });

  it("throws with a helpful message on non-object config", () => {
    expect(() => renderSite(null)).toThrow();
    expect(() => renderSite(undefined)).toThrow();
    expect(() => renderSite("not a config")).toThrow();
  });

  it("renders footer with siteId so users can see it at a glance", () => {
    const html = renderSite(validConfig);
    expect(html).toMatch(/Site ID: <code>test-site-1<\/code>/);
  });
});
