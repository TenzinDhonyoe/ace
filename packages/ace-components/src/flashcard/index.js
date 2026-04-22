import { Widget } from "../lib/widget.js";
import schema from "./schema.json" with { type: "json" };

// Flashcard deck — click to blur-reveal, per-card mastery persists.
// Ported from BME804 pattern. No 3D flip; answer is blur(5px) → none on .is-open.

export class Flashcard extends Widget {
  static type = "flashcard";
  static schema = schema;
  static examples = [
    {
      id: "actuator-fc",
      title: "Actuators — flashcards",
      cards: [
        { q: "Pull-in voltage?", a: "Voltage at which the movable plate of an electrostatic actuator snaps onto and sticks to the fixed plate." },
        { q: "Comb-drive motion direction", a: "In-plane — interdigitated fingers slide past each other." },
        { q: "Why ferromagnetic cores in solenoids?", a: "μᵣ of iron is ~1000×, multiplying B by the same factor for the same current." }
      ]
    }
  ];

  render(props, el) {
    el.classList.add("ace-flashcard-root");

    if (props.title) {
      const h = document.createElement("h5");
      h.textContent = props.title;
      h.style.fontFamily = "var(--ace-sans)";
      h.style.fontSize = "13px";
      h.style.fontWeight = "600";
      h.style.margin = "0 0 10px";
      el.appendChild(h);
    }

    const showFilter = props.showFilter !== false;
    let filterState = "all"; // "all" | "review"

    // ---- Filter bar ----
    const count = document.createElement("span");
    count.style.marginLeft = "auto";
    count.style.fontFamily = "var(--ace-mono)";
    count.style.fontSize = "12px";
    count.style.color = "var(--ace-muted)";

    let ctrl = null;
    if (showFilter) {
      ctrl = document.createElement("div");
      ctrl.style.cssText =
        "display:flex;gap:10px;align-items:center;margin:10px 0 2px;font-family:var(--ace-sans);font-size:12.5px;color:var(--ace-muted);max-width:92ch";
      const all = makeFilterBtn("All", "all");
      const rev = makeFilterBtn("To review", "review");
      all.classList.add("is-on");
      ctrl.append(all, rev, count);
      el.appendChild(ctrl);

      const clickHandler = (e) => {
        const b = e.target.closest("button");
        if (!b) return;
        ctrl.querySelectorAll("button").forEach((x) => x.classList.remove("is-on"));
        b.classList.add("is-on");
        filterState = b.dataset.f;
        applyFilter();
      };
      this.on(ctrl, "click", clickHandler);
    }

    // ---- Deck ----
    const deck = document.createElement("div");
    deck.className = "ace-flashcard-deck";
    el.appendChild(deck);

    const got = new Set(this.store.get("got", []));
    const rev = new Set(this.store.get("rev", []));

    const cardEls = props.cards.map((card, i) => {
      const id = `c${i}`;
      const card_el = document.createElement("div");
      card_el.className = "ace-flashcard";
      card_el.dataset.id = id;
      if (got.has(id)) card_el.classList.add("is-got");
      card_el.innerHTML = `
        <div class="ace-flashcard__q"></div>
        <div class="ace-flashcard__a"></div>
        <div class="ace-flashcard__hint">click to reveal</div>
        <div class="ace-flashcard__mastery">
          <button data-act="got">✓ Got it</button>
          <button data-act="rev">Review again</button>
        </div>`;
      card_el.querySelector(".ace-flashcard__q").textContent = card.q;
      card_el.querySelector(".ace-flashcard__a").textContent = card.a;

      this.on(card_el, "click", (e) => {
        const btn = e.target.closest("button[data-act]");
        if (btn) {
          e.stopPropagation();
          if (btn.dataset.act === "got") {
            got.add(id); rev.delete(id);
            card_el.classList.add("is-got");
          } else {
            rev.add(id); got.delete(id);
            card_el.classList.remove("is-got");
          }
          this.store.set("got", [...got]);
          this.store.set("rev", [...rev]);
          updateCount();
          return;
        }
        card_el.classList.toggle("is-open");
      });

      deck.appendChild(card_el);
      return card_el;
    });

    const applyFilter = () => {
      for (const c of cardEls) {
        const show = filterState === "all" || !c.classList.contains("is-got");
        c.style.display = show ? "" : "none";
      }
    };
    const updateCount = () => {
      if (!count) return;
      count.textContent = `${got.size} / ${cardEls.length} mastered`;
    };
    updateCount();
  }
}

function makeFilterBtn(label, f) {
  const b = document.createElement("button");
  b.textContent = label;
  b.dataset.f = f;
  b.style.cssText =
    "background:transparent;border:1px solid var(--ace-rule);color:var(--ace-ink);padding:4px 10px;border-radius:999px;cursor:pointer;font:inherit;font-size:12px";
  b.addEventListener("mouseover", () => { if (!b.classList.contains("is-on")) b.style.borderColor = "var(--ace-ink)"; });
  b.addEventListener("mouseout", () => { if (!b.classList.contains("is-on")) b.style.borderColor = "var(--ace-rule)"; });
  return b;
}

// We need the .is-on filter button to be styled via JS since our CSS file
// doesn't include filter-button styles (those are shared across widgets).
// The class toggles a visible accent color.
if (typeof document !== "undefined" && !document.getElementById("ace-flashcard-on-style")) {
  const style = document.createElement("style");
  style.id = "ace-flashcard-on-style";
  style.textContent = `button.is-on{background:var(--ace-accent);color:#fff;border-color:var(--ace-accent)}`;
  document.head?.appendChild(style);
}
