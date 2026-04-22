import { Widget } from "../lib/widget.js";
import schema from "./schema.json" with { type: "json" };

export class DiagramLabel extends Widget {
  static type = "diagram-label";
  static schema = schema;
  static examples = [
    {
      id: "elisa-label",
      title: "Identify the ELISA components",
      image: {
        src: "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 200'><rect width='300' height='200' fill='#fafafa'/><text x='150' y='100' text-anchor='middle' font-size='12'>[diagram here]</text></svg>",
        width: 300,
        height: 200
      },
      hotspots: [
        { label: "Capture antibody", x: 25, y: 40 },
        { label: "Antigen", x: 50, y: 55 },
        { label: "Detection antibody", x: 75, y: 40 },
        { label: "Enzyme conjugate", x: 85, y: 70 }
      ]
    }
  ];

  render(props, el) {
    el.classList.add("ace-diagram-label");

    if (props.title) {
      const h = document.createElement("div");
      h.className = "ace-diagram-label__title";
      h.textContent = props.title;
      el.appendChild(h);
    }

    const fig = document.createElement("div");
    fig.className = "ace-diagram-label__fig";
    // Allow inline SVG or URL
    if (props.image.src.trim().startsWith("<svg")) {
      fig.innerHTML = props.image.src;
    } else {
      const img = document.createElement("img");
      img.src = props.image.src;
      img.alt = props.image.alt || "";
      if (props.image.width) img.width = props.image.width;
      if (props.image.height) img.height = props.image.height;
      fig.appendChild(img);
    }
    el.appendChild(fig);

    const status = this.store.get("status", props.hotspots.map(() => null)); // null | "correct" | "wrong"

    // Create hotspots after image so positioning references the fig dimensions
    const hotspotEls = props.hotspots.map((h, i) => {
      const spot = document.createElement("button");
      spot.className = "ace-diagram-label__hotspot";
      spot.style.left = h.x + "%";
      spot.style.top = h.y + "%";
      spot.textContent = String(i + 1);
      if (status[i] === "correct") spot.classList.add("is-correct");
      if (status[i] === "wrong") spot.classList.add("is-wrong");
      fig.appendChild(spot);
      return spot;
    });

    // Shuffle label pool (stable per session — reshuffling every render is jarring)
    const poolOrder = this.store.get("poolOrder", shuffled(props.hotspots.map((_, i) => i)));
    this.store.set("poolOrder", poolOrder);

    const pool = document.createElement("div");
    pool.className = "ace-diagram-label__pool";
    el.appendChild(pool);

    const statusEl = document.createElement("div");
    statusEl.className = "ace-diagram-label__status";
    el.appendChild(statusEl);

    let selected = null; // index of pool button currently highlighted
    const poolBtns = poolOrder.map((origIdx) => {
      const b = document.createElement("button");
      b.textContent = props.hotspots[origIdx].label;
      b.dataset.idx = String(origIdx);
      if (status.indexOf(null) === -1 || status[origIdx] === "correct") {
        // already resolved — disable
        b.disabled = true;
      }
      this.on(b, "click", () => {
        if (b.disabled) return;
        if (selected === b) {
          b.classList.remove("is-active");
          selected = null;
        } else {
          poolBtns.forEach((x) => x.classList.remove("is-active"));
          b.classList.add("is-active");
          selected = b;
        }
      });
      pool.appendChild(b);
      return b;
    });

    hotspotEls.forEach((spot, i) => {
      if (status[i] === "correct") return;
      this.on(spot, "click", () => {
        if (!selected) {
          statusEl.textContent = "Pick a label below first, then click the hotspot.";
          return;
        }
        const chosen = Number(selected.dataset.idx);
        if (chosen === i) {
          status[i] = "correct";
          spot.classList.remove("is-wrong");
          spot.classList.add("is-correct");
          selected.disabled = true;
          selected.classList.remove("is-active");
          selected = null;
          statusEl.textContent = "Correct!";
        } else {
          status[i] = "wrong";
          spot.classList.add("is-wrong");
          statusEl.textContent = `Not quite. "${props.hotspots[chosen].label}" goes elsewhere.`;
        }
        this.store.set("status", status);
        if (status.every((s) => s === "correct")) {
          statusEl.textContent = "All labeled correctly. Nicely done.";
        }
      });
    });
  }
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
