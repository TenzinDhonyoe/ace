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
});
