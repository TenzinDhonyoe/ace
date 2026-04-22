import { describe, it, expect, beforeEach } from "bun:test";
import { Flashcard } from "./index.js";

const validProps = {
  id: "test-deck",
  cards: [
    { q: "Q1?", a: "A1" },
    { q: "Q2?", a: "A2" },
    { q: "Q3?", a: "A3" }
  ]
};

describe("Flashcard", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("has correct static metadata", () => {
    expect(Flashcard.type).toBe("flashcard");
    expect(Flashcard.schema.required).toContain("cards");
  });

  it("renders one card per cards[] entry", () => {
    const w = new Flashcard();
    w.mount(root, validProps, { siteId: "test" });
    expect(root.querySelectorAll(".ace-flashcard").length).toBe(3);
  });

  it("click on card toggles is-open", () => {
    const w = new Flashcard();
    w.mount(root, validProps, { siteId: "test" });
    const first = root.querySelector(".ace-flashcard");
    first.click();
    expect(first.classList.contains("is-open")).toBe(true);
    first.click();
    expect(first.classList.contains("is-open")).toBe(false);
  });

  it("click 'Got it' marks card as mastered and persists", () => {
    const w = new Flashcard();
    w.mount(root, validProps, { siteId: "siteA" });
    const first = root.querySelector(".ace-flashcard");
    first.click(); // open it
    const gotBtn = first.querySelector('button[data-act="got"]');
    gotBtn.click();
    expect(first.classList.contains("is-got")).toBe(true);

    // Remount — state should persist
    w.destroy();
    const root2 = document.createElement("div");
    document.body.appendChild(root2);
    const w2 = new Flashcard();
    w2.mount(root2, validProps, { siteId: "siteA" });
    expect(root2.querySelector(".ace-flashcard").classList.contains("is-got")).toBe(true);
  });

  it("'Review again' clears is-got state", () => {
    const w = new Flashcard();
    w.mount(root, validProps, { siteId: "test" });
    const first = root.querySelector(".ace-flashcard");
    first.click();
    first.querySelector('button[data-act="got"]').click();
    expect(first.classList.contains("is-got")).toBe(true);
    first.querySelector('button[data-act="rev"]').click();
    expect(first.classList.contains("is-got")).toBe(false);
  });

  it("rejects props missing cards array", () => {
    const w = new Flashcard();
    w.mount(root, { title: "no cards" }, { siteId: "test" });
    expect(root.querySelector(".ace-error")).not.toBeNull();
  });

  it("destroy() clears DOM", () => {
    const w = new Flashcard();
    w.mount(root, validProps, { siteId: "test" });
    w.destroy();
    expect(root.innerHTML).toBe("");
  });
});
