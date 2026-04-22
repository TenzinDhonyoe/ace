import { describe, it, expect, beforeEach } from "bun:test";
import { ConceptCard } from "./index.js";

const props = { id: "c1", question: "What is X?", answer: "X is the thing." };

describe("ConceptCard", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("renders question and hidden answer", () => {
    const w = new ConceptCard();
    w.mount(root, props, { siteId: "test" });
    expect(root.querySelector(".ace-concept__q").textContent).toBe("What is X?");
    expect(root.querySelector(".ace-concept__ans").textContent).toBe("X is the thing.");
    expect(root.classList.contains("is-open")).toBe(false);
  });

  it("click opens the card", () => {
    const w = new ConceptCard();
    w.mount(root, props, { siteId: "test" });
    root.click();
    expect(root.classList.contains("is-open")).toBe(true);
  });

  it("'Got it' marks mastered and persists", () => {
    const w = new ConceptCard();
    w.mount(root, props, { siteId: "siteA" });
    root.click();
    root.querySelector('button[data-act="got"]').click();
    expect(root.classList.contains("is-got")).toBe(true);

    const root2 = document.createElement("div");
    document.body.appendChild(root2);
    const w2 = new ConceptCard();
    w2.mount(root2, props, { siteId: "siteA" });
    expect(root2.classList.contains("is-got")).toBe(true);
  });

  it("rejects props missing question/answer", () => {
    const w = new ConceptCard();
    w.mount(root, { question: "only Q" }, { siteId: "test" });
    expect(root.querySelector(".ace-error")).not.toBeNull();
  });
});
