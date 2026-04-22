import { describe, it, expect, beforeEach } from "bun:test";
import { DiagramLabel } from "./index.js";

const props = {
  id: "test-dl",
  image: { src: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'></svg>", width: 100, height: 100 },
  hotspots: [
    { label: "Alpha", x: 25, y: 50 },
    { label: "Beta", x: 50, y: 50 },
    { label: "Gamma", x: 75, y: 50 }
  ]
};

describe("DiagramLabel", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("renders image, hotspots, and pool", () => {
    const w = new DiagramLabel();
    w.mount(root, props, { siteId: "test" });
    expect(root.querySelector(".ace-diagram-label__fig svg")).not.toBeNull();
    expect(root.querySelectorAll(".ace-diagram-label__hotspot").length).toBe(3);
    expect(root.querySelectorAll(".ace-diagram-label__pool button").length).toBe(3);
  });

  it("selecting a label + correct hotspot marks correct", () => {
    const w = new DiagramLabel();
    w.mount(root, props, { siteId: "test" });
    const poolBtns = root.querySelectorAll(".ace-diagram-label__pool button");
    const hotspots = root.querySelectorAll(".ace-diagram-label__hotspot");
    // Find the pool button labeled "Alpha" (hotspot 0)
    const alphaBtn = [...poolBtns].find((b) => b.textContent === "Alpha");
    alphaBtn.click();
    hotspots[0].click();
    expect(hotspots[0].classList.contains("is-correct")).toBe(true);
    expect(alphaBtn.disabled).toBe(true);
  });

  it("wrong guess marks hotspot wrong, does not disable pool", () => {
    const w = new DiagramLabel();
    w.mount(root, props, { siteId: "test" });
    const poolBtns = root.querySelectorAll(".ace-diagram-label__pool button");
    const hotspots = root.querySelectorAll(".ace-diagram-label__hotspot");
    const alphaBtn = [...poolBtns].find((b) => b.textContent === "Alpha");
    alphaBtn.click();
    hotspots[1].click(); // Beta's slot — wrong
    expect(hotspots[1].classList.contains("is-wrong")).toBe(true);
    expect(alphaBtn.disabled).toBe(false);
  });

  it("asks to pick a label when hotspot clicked with no selection", () => {
    const w = new DiagramLabel();
    w.mount(root, props, { siteId: "test" });
    const hotspots = root.querySelectorAll(".ace-diagram-label__hotspot");
    hotspots[0].click();
    expect(root.querySelector(".ace-diagram-label__status").textContent).toMatch(/Pick a label/);
  });

  it("rejects props missing hotspots", () => {
    const w = new DiagramLabel();
    w.mount(root, { image: props.image }, { siteId: "test" });
    expect(root.querySelector(".ace-error")).not.toBeNull();
  });

  it("persists correct state across remount", () => {
    const w = new DiagramLabel();
    w.mount(root, props, { siteId: "siteA" });
    const poolBtns = root.querySelectorAll(".ace-diagram-label__pool button");
    const hotspots = root.querySelectorAll(".ace-diagram-label__hotspot");
    [...poolBtns].find((b) => b.textContent === "Alpha").click();
    hotspots[0].click();
    w.destroy();

    const root2 = document.createElement("div");
    document.body.appendChild(root2);
    const w2 = new DiagramLabel();
    w2.mount(root2, props, { siteId: "siteA" });
    expect(root2.querySelectorAll(".ace-diagram-label__hotspot")[0].classList.contains("is-correct")).toBe(true);
  });
});
