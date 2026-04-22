import { describe, it, expect } from "bun:test";
import { systemPrompt, selfCheck, PROMPTS_VERSION } from "../src/index.js";

describe("ace-study-prompts", () => {
  it("exports systemPrompt as a non-empty string", () => {
    expect(typeof systemPrompt).toBe("string");
    expect(systemPrompt.length).toBeGreaterThan(1000);
  });

  it("exports selfCheck as a non-empty string", () => {
    expect(typeof selfCheck).toBe("string");
    expect(selfCheck.length).toBeGreaterThan(200);
  });

  it("exports a version string", () => {
    expect(PROMPTS_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  // Content invariants — if any of these drift, the generator drifts. These
  // are intentionally specific so a careless edit to system-prompt.md shows
  // up loudly in CI.

  it("systemPrompt names all six widget types", () => {
    for (const t of ["slider-sandbox", "flashcard", "mcq-quiz", "diagram-label", "concept-card", "prose"]) {
      expect(systemPrompt).toContain(t);
    }
  });

  it("systemPrompt states the 8-widget-per-section cap", () => {
    expect(systemPrompt).toMatch(/8 widgets per section max/i);
  });

  it("systemPrompt preserves the non-negotiable hard rules section", () => {
    expect(systemPrompt).toMatch(/Hard rules \(non-negotiable\)/);
    expect(systemPrompt).toMatch(/Never invent equations/);
    expect(systemPrompt).toMatch(/plausible misconception/);
  });

  it("selfCheck preserves the core invariants", () => {
    expect(selfCheck).toMatch(/valid JSON/);
    expect(selfCheck).toMatch(/source/);
    expect(selfCheck).toMatch(/1-3 sentences/);
  });
});
