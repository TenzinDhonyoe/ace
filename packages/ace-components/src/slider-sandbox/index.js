import { Widget } from "../lib/widget.js";
import { fmtSci, fmtSI } from "../lib/format.js";
import schema from "./schema.json" with { type: "json" };

// SliderSandbox — generic sliders + compute + optional SVG.
// Config-driven: one widget covers electrostatic, piezoelectric, Lorentz,
// thermal, EAP, and any future actuator/sensor you want to visualize.

export class SliderSandbox extends Widget {
  static type = "slider-sandbox";
  static schema = schema;
  static examples = [
    {
      id: "electrostatic-pullin",
      title: "Parallel-plate actuator — feel pull-in",
      constants: { eps0: 8.854e-12 },
      variables: [
        { key: "V", label: "Voltage V", unit: "V", min: 0, max: 300, step: 1, initial: 40 },
        { key: "A", label: "Plate area A", unit: "µm²", min: 10, max: 500, step: 1, initial: 100 },
        { key: "x", label: "Gap x", unit: "µm", min: 0.5, max: 10, step: 0.1, initial: 3 },
        { key: "k", label: "Spring k", unit: "N/m", min: 0.1, max: 10, step: 0.1, initial: 1 }
      ],
      outputs: [
        { key: "F", label: "Force", unit: "N", format: "si" },
        { key: "vpi", label: "Pull-in V", unit: "V", format: "sci" }
      ],
      compute:
        "const A_m=vars.A*1e-12, x_m=vars.x*1e-6;" +
        "const vpi=Math.sqrt(8*vars.k*Math.pow(x_m,3)/(27*consts.eps0*A_m));" +
        "let F=0.5*consts.eps0*A_m*vars.V*vars.V/(x_m*x_m);" +
        "const status=vars.V>=vpi?'⚠ past pull-in — plates collapse':'stable';" +
        "return { F, vpi, status };",
      description: "F = ½ε₀A·V²/x². Pull-in voltage V_pi = √(8kx³ / 27ε₀A).",
      tip: "Double V → force quadruples. Halve x → force quadruples again. That's V²·1/x² physics you can feel."
    }
  ];

  render(props, el) {
    el.classList.add("ace-slider-sandbox");

    // ---- Title ----
    const h = document.createElement("h5");
    h.className = "ace-slider-sandbox__title";
    h.textContent = props.title;
    el.appendChild(h);

    // ---- Controls ----
    const ctrls = document.createElement("div");
    ctrls.className = "ace-slider-sandbox__ctrls";
    const inputs = {};
    const valueEls = {};
    for (const v of props.variables) {
      const label = document.createElement("label");
      label.textContent = v.label;
      ctrls.appendChild(label);

      let input;
      const kind = v.kind || "range";
      if (kind === "select") {
        input = document.createElement("select");
        for (const opt of v.options || []) {
          const o = document.createElement("option");
          if (typeof opt === "string") { o.value = opt; o.textContent = opt; }
          else { o.value = String(opt.value); o.textContent = opt.label; }
          input.appendChild(o);
        }
      } else {
        input = document.createElement("input");
        input.type = kind;
        if (v.min != null) input.min = v.min;
        if (v.max != null) input.max = v.max;
        if (v.step != null) input.step = v.step;
      }
      input.value = String(v.initial);
      inputs[v.key] = input;
      ctrls.appendChild(input);

      const val = document.createElement("div");
      val.className = "ace-slider-sandbox__value";
      valueEls[v.key] = val;
      ctrls.appendChild(val);
    }
    el.appendChild(ctrls);

    // ---- SVG view ----
    // Mount an SVG host lazily on first render that emits `svg` content.
    // Compute functions return { svg: "<...>" } to draw the visualization.
    // Props can pre-size the SVG via svgWidth/svgHeight; otherwise we use
    // a sensible default (320x150, the BME804 reference size).
    let svgEl = null;
    const ensureSvg = () => {
      if (svgEl) return svgEl;
      const view = document.createElement("div");
      view.className = "ace-slider-sandbox__view";
      svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svgEl.setAttribute("width", props.svgWidth || 320);
      svgEl.setAttribute("height", props.svgHeight || 150);
      view.appendChild(svgEl);
      // Insert the view before the output readout so visual sits above numbers.
      el.insertBefore(view, out);
      return svgEl;
    };

    // ---- Output readout ----
    const out = document.createElement("div");
    out.className = "ace-slider-sandbox__out";
    el.appendChild(out);

    if (props.tip) {
      const tip = document.createElement("div");
      tip.className = "ace-slider-sandbox__tip";
      tip.textContent = props.tip;
      el.appendChild(tip);
    }

    // ---- Compute function ----
    const computeFn = buildComputeFn(props.compute);
    const consts = props.constants || {};

    // ---- Frame interpolation state ----
    // `targets` = raw slider values (update immediately on input)
    // `currents` = animated values used by compute (eased toward targets)
    // Select-kind variables are strings; they update immediately without easing.
    const targets = {};
    const currents = {};
    for (const v of props.variables) {
      const initial = v.kind === "select" ? String(v.initial) : Number(v.initial);
      targets[v.key] = initial;
      currents[v.key] = initial;
    }
    // Ease factor per frame. 0.25 ≈ spring to target in ~5 frames (~80ms at 60fps).
    // Visible on big track-click jumps, invisible on smooth drags.
    const EASE = 0.25;
    const EPS = 1e-6;

    const readValueText = (v, val) =>
      (typeof val === "number" ? val.toFixed(stepDecimals(v.step)) : val) +
      (v.unit ? " " + v.unit : "");

    // Update readout labels (next to each slider) — show the TARGET value, not the
    // currently-animating one, so the student sees what they just set.
    const refreshValueLabels = () => {
      for (const v of props.variables) valueEls[v.key].textContent = readValueText(v, targets[v.key]);
    };

    const render = () => {
      let result;
      try {
        result = computeFn(currents, consts) || {};
      } catch (err) {
        result = { _error: String(err && err.message || err) };
      }
      const outputLines = [];
      for (const o of props.outputs) {
        const val = result[o.key];
        let formatted;
        if (val == null || !isFinite(val)) formatted = "—";
        else if (o.format === "sci") formatted = fmtSci(val, o.decimals ?? 2) + (o.unit ? " " + o.unit : "");
        else if (o.format === "fixed") formatted = val.toFixed(o.decimals ?? 2) + (o.unit ? " " + o.unit : "");
        else formatted = fmtSI(val, o.unit || "", o.decimals ?? 2);
        outputLines.push(`${o.label} <b>${escapeHtml(formatted)}</b>`);
      }
      out.innerHTML = outputLines.join(" · ") +
        (props.description ? `<small>${props.description}</small>` : "") +
        (result.status ? `<small>${escapeHtml(String(result.status))}</small>` : "") +
        (result._error ? `<small style="color:var(--ace-warn)">compute error: ${escapeHtml(result._error)}</small>` : "");
      const svgContent = result.svg !== undefined ? result.svg : props.svgTemplate;
      if (svgContent != null) ensureSvg().innerHTML = String(svgContent);
    };

    // rAF-driven animation loop. Runs only while any current != target.
    // For ease of testing, expose `_tick` so tests can drive frames manually.
    let running = false;
    const rAF = typeof requestAnimationFrame !== "undefined"
      ? requestAnimationFrame.bind(typeof window !== "undefined" ? window : globalThis)
      : (fn) => setTimeout(fn, 16);
    const tick = () => {
      let moving = false;
      for (const v of props.variables) {
        if (v.kind === "select") continue;
        const t = targets[v.key], c = currents[v.key];
        const delta = t - c;
        if (Math.abs(delta) > EPS) {
          const step = delta * EASE;
          // Snap to target when we're within one step-size to avoid infinite micro-jitter
          currents[v.key] = Math.abs(delta) < (v.step || 0.001) ? t : c + step;
          moving = true;
        }
      }
      render();
      if (moving) rAF(tick);
      else running = false;
    };
    this._tick = tick; // testing hook
    const scheduleUpdate = () => {
      if (!running) { running = true; rAF(tick); }
    };

    const onInput = (v) => () => {
      const raw = inputs[v.key].value;
      targets[v.key] = v.kind === "select" ? raw : Number(raw);
      // Select inputs: apply immediately, no easing.
      if (v.kind === "select") currents[v.key] = targets[v.key];
      refreshValueLabels();
      scheduleUpdate();
    };

    for (const v of props.variables) {
      this.on(inputs[v.key], "input", onInput(v));
      this.on(inputs[v.key], "change", onInput(v));
    }

    refreshValueLabels();
    render();
  }
}

function buildComputeFn(source) {
  try {
    // eslint-disable-next-line no-new-func
    return new Function("vars", "consts", source);
  } catch (err) {
    return () => ({ _error: "invalid compute: " + err.message });
  }
}

function stepDecimals(step) {
  if (!step || step >= 1) return 0;
  const s = String(step);
  const dot = s.indexOf(".");
  return dot === -1 ? 0 : Math.min(4, s.length - dot - 1);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
