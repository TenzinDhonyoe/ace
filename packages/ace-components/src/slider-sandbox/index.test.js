import { describe, it, expect, beforeEach } from "bun:test";
import { SliderSandbox } from "./index.js";

const validProps = {
  id: "test-sandbox",
  title: "Test sandbox",
  variables: [
    { key: "v", label: "Voltage", unit: "V", min: 0, max: 100, step: 1, initial: 10 },
    { key: "r", label: "Resistance", unit: "Ω", min: 1, max: 1000, step: 1, initial: 100 }
  ],
  outputs: [
    { key: "i", label: "Current", unit: "A", format: "si" },
    { key: "p", label: "Power", unit: "W", format: "si" }
  ],
  compute: "const i=vars.v/vars.r; const p=vars.v*i; return { i, p };"
};

describe("SliderSandbox", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = "";
    root = document.createElement("div");
    document.body.appendChild(root);
  });

  it("has correct static metadata", () => {
    expect(SliderSandbox.type).toBe("slider-sandbox");
    expect(SliderSandbox.schema).toBeDefined();
    expect(SliderSandbox.schema.required).toContain("title");
    expect(SliderSandbox.examples.length).toBeGreaterThan(0);
  });

  it("renders sliders and readouts from valid props", () => {
    const w = new SliderSandbox();
    w.mount(root, validProps, { siteId: "test" });

    expect(root.classList.contains("ace-slider-sandbox")).toBe(true);
    expect(root.querySelector(".ace-slider-sandbox__title").textContent).toBe("Test sandbox");
    expect(root.querySelectorAll("input[type=range]").length).toBe(2);

    const out = root.querySelector(".ace-slider-sandbox__out");
    expect(out.innerHTML).toMatch(/Current/);
    expect(out.innerHTML).toMatch(/Power/);
  });

  it("computes correct output from initial values (V=10, R=100 → I=0.1, P=1.0)", () => {
    const w = new SliderSandbox();
    w.mount(root, validProps, { siteId: "test" });
    const out = root.querySelector(".ace-slider-sandbox__out").textContent;
    expect(out).toMatch(/100\.00 mA|0\.10 A/); // 100 mA
    expect(out).toMatch(/1\.00 W/);
  });

  it("renders error card on invalid props", () => {
    const w = new SliderSandbox();
    w.mount(root, { title: "missing required fields" }, { siteId: "test" });
    expect(root.querySelector(".ace-error")).not.toBeNull();
  });

  it("renders error card on malformed compute", () => {
    const w = new SliderSandbox();
    w.mount(root, {
      ...validProps,
      compute: "this is not valid JavaScript @@@"
    }, { siteId: "test" });
    // Widget renders, but the output area shows a compute error
    const out = root.querySelector(".ace-slider-sandbox__out");
    expect(out.innerHTML).toMatch(/compute error|invalid compute/i);
  });

  it("destroy() removes DOM and listeners", () => {
    const w = new SliderSandbox();
    w.mount(root, validProps, { siteId: "test" });
    expect(root.children.length).toBeGreaterThan(0);
    w.destroy();
    expect(root.innerHTML).toBe("");
    expect(w.el).toBeNull();
  });

  it("interpolates numeric slider jumps toward target across frames", () => {
    // Set up a minimal sandbox with one slider. Record rendered output per tick.
    const w = new SliderSandbox();
    w.mount(root, {
      title: "interp test",
      variables: [{ key: "v", label: "V", unit: "", min: 0, max: 100, step: 1, initial: 0 }],
      outputs: [{ key: "v", label: "V", unit: "", format: "fixed", decimals: 2 }],
      compute: "return { v: vars.v };"
    }, { siteId: "interp-test" });

    const inp = root.querySelector("input[type=range]");
    // Jump from 0 → 100 via track-click
    inp.value = "100";
    inp.dispatchEvent(new Event("input"));

    // Read the initial rendered output — should NOT be 100 immediately
    const firstOut = root.querySelector(".ace-slider-sandbox__out").textContent;
    expect(firstOut).not.toMatch(/100\.00/);
    // Drive a few frames of the interpolation loop manually
    for (let i = 0; i < 40; i++) w._tick();
    // After many ticks the output should converge to 100
    const finalOut = root.querySelector(".ace-slider-sandbox__out").textContent;
    expect(finalOut).toMatch(/100\.00/);
  });

  it("accepts select-kind variables", () => {
    const w = new SliderSandbox();
    w.mount(root, {
      title: "material picker",
      variables: [
        { key: "d", label: "Material", kind: "select", initial: "220",
          options: [{ value: "220", label: "PZT (220 pC/N)" }, { value: "12", label: "ZnO (12)" }] }
      ],
      outputs: [{ key: "out", label: "d", unit: "pC/N", format: "fixed" }],
      compute: "return { out: Number(vars.d) };"
    }, { siteId: "test" });
    expect(root.querySelector("select")).not.toBeNull();
    expect(root.querySelector(".ace-slider-sandbox__out").textContent).toMatch(/220/);
  });
});
