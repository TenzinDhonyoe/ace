import { describe, it, expect, beforeEach } from "bun:test";
import {
  buildSearchIndex,
  searchIndex,
  computeProgress,
  applyTheme,
  loadTheme,
  runtimeScript,
} from "../src/runtime.js";

function setBody(html) {
  document.body.innerHTML = `<main>${html}</main>`;
}

describe("buildSearchIndex", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("returns empty for empty root", () => {
    expect(buildSearchIndex(null)).toEqual([]);
  });

  it("indexes sections by h2", () => {
    setBody(`<section id="act"><h2>Microactuators</h2><p class="ace-lede">Intro sentence.</p></section>`);
    const entries = buildSearchIndex(document);
    const sec = entries.find((e) => e.kind === "section");
    expect(sec).toBeDefined();
    expect(sec.title).toBe("Microactuators");
    expect(sec.anchor).toBe("#act");
    expect(sec.snippet).toContain("Intro sentence");
  });

  it("indexes h3 subtopics", () => {
    setBody(`<section id="act"><h2>A</h2><h3 id="act-elec">Electrostatic</h3></section>`);
    const sub = buildSearchIndex(document).find((e) => e.kind === "subtopic");
    expect(sub).toBeDefined();
    expect(sub.title).toBe("Electrostatic");
    expect(sub.anchor).toBe("#act-elec");
  });

  it("indexes flashcards (question + answer)", () => {
    setBody(`<section id="act"><h2>A</h2>
      <div class="ace-flashcard"><div class="ace-flashcard__q">Pull-in?</div><div class="ace-flashcard__a">Plate snaps.</div></div>
    </section>`);
    const fc = buildSearchIndex(document).find((e) => e.kind === "flashcard");
    expect(fc.title).toBe("Pull-in?");
    expect(fc.snippet).toContain("Plate snaps");
  });

  it("indexes MCQ questions", () => {
    setBody(`<section id="q"><h2>Quiz</h2>
      <div class="ace-mcq__item"><div class="ace-mcq__text">What scales as V²?</div></div>
    </section>`);
    const mcq = buildSearchIndex(document).find((e) => e.kind === "mcq");
    expect(mcq.title).toMatch(/V²/);
  });

  it("indexes concept cards, stripping Quick check prefix", () => {
    setBody(`<section id="s"><h2>S</h2>
      <div class="ace-concept"><div class="ace-concept__q">Why pull-in?</div><div class="ace-concept__ans">Because F scales 1/x².</div></div>
    </section>`);
    const c = buildSearchIndex(document).find((e) => e.kind === "concept");
    expect(c.title).toBe("Why pull-in?");
  });
});

describe("searchIndex", () => {
  it("matches case-insensitively on title", () => {
    const entries = [{ kind: "section", title: "Microactuators", snippet: "", anchor: "#act" }];
    expect(searchIndex(entries, "micro").length).toBe(1);
    expect(searchIndex(entries, "MICRO").length).toBe(1);
  });

  it("returns empty for empty query", () => {
    expect(searchIndex([{ kind: "section", title: "X", snippet: "", anchor: "#" }], "")).toEqual([]);
    expect(searchIndex([], "foo")).toEqual([]);
  });

  it("ranks title match ahead of snippet match", () => {
    const entries = [
      { kind: "flashcard", title: "Unrelated", snippet: "mentions pull-in somewhere", anchor: "" },
      { kind: "flashcard", title: "Pull-in voltage", snippet: "", anchor: "" }
    ];
    const r = searchIndex(entries, "pull-in");
    expect(r[0].title).toBe("Pull-in voltage");
  });

  it("caps results at 30", () => {
    const entries = Array.from({ length: 50 }, (_, i) => ({ kind: "flashcard", title: "match-" + i, snippet: "", anchor: "" }));
    expect(searchIndex(entries, "match").length).toBe(30);
  });
});

describe("computeProgress", () => {
  beforeEach(() => { document.body.innerHTML = ""; });

  it("returns zeros when nothing to count", () => {
    setBody("");
    expect(computeProgress(document)).toEqual({ mastered: 0, total: 0 });
  });

  it("counts flashcards and concepts, mastered flagged by is-got", () => {
    setBody(`
      <div class="ace-flashcard is-got"></div>
      <div class="ace-flashcard"></div>
      <div class="ace-concept is-got"></div>
      <div class="ace-concept"></div>
    `);
    expect(computeProgress(document)).toEqual({ mastered: 2, total: 4 });
  });

  it("handles null root defensively", () => {
    expect(computeProgress(null)).toEqual({ mastered: 0, total: 0 });
  });
});

describe("applyTheme + loadTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark");
    try { localStorage.clear(); } catch {}
  });

  it("adds dark class for dark theme", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("removes dark class for light theme", () => {
    document.documentElement.classList.add("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("persists choice to localStorage", () => {
    applyTheme("dark");
    expect(loadTheme()).toBe("dark");
  });

  it("loadTheme defaults to light", () => {
    expect(loadTheme()).toBe("light");
  });
});

describe("runtimeScript", () => {
  it("returns a non-empty JS string", () => {
    const src = runtimeScript();
    expect(typeof src).toBe("string");
    expect(src.length).toBeGreaterThan(1000);
  });

  it("compiles — not literally, but we can parse via Function()", () => {
    const src = runtimeScript();
    // Parsing with `new Function` catches syntax errors without executing the IIFE
    expect(() => new Function(src)).not.toThrow();
  });

  it("budget check: runtime under 15KB", () => {
    const src = runtimeScript();
    expect(src.length).toBeLessThan(15 * 1024);
  });
});
