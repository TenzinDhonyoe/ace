import { describe, it, expect, beforeEach } from "bun:test";
import { Prose } from "./index.js";

describe("Prose", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("renders body as HTML", () => {
    const w = new Prose();
    w.mount(root, { body: "<b>Hello</b> world" }, { siteId: "t" });
    expect(root.querySelector("b")).not.toBeNull();
    expect(root.textContent).toContain("Hello world");
  });

  it("supports ace-note callouts", () => {
    const w = new Prose();
    w.mount(root, { body: '<div class="ace-note">Concept.</div>' }, { siteId: "t" });
    expect(root.querySelector(".ace-note")).not.toBeNull();
  });

  it("supports ace-eq equation boxes", () => {
    const w = new Prose();
    w.mount(root, { body: '<div class="ace-eq">F = ma</div>' }, { siteId: "t" });
    expect(root.querySelector(".ace-eq")).not.toBeNull();
  });

  it("rejects props missing body", () => {
    const w = new Prose();
    w.mount(root, {}, { siteId: "t" });
    expect(root.querySelector(".ace-error")).not.toBeNull();
  });
});
