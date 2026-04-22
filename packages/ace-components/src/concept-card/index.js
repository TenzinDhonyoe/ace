import { Widget } from "../lib/widget.js";
import schema from "./schema.json" with { type: "json" };

export class ConceptCard extends Widget {
  static type = "concept-card";
  static schema = schema;
  static examples = [
    {
      id: "es-pullin-recall",
      question: "What physically happens above the pull-in voltage, and why?",
      answer: "The deflection exceeds one-third of the gap, so the restoring spring can no longer balance the electrostatic force — the movable plate collapses onto the fixed plate and sticks. Below V_pi stable, above runaway.",
      topic: "electrostatic"
    }
  ];

  render(props, el) {
    el.classList.add("ace-concept");
    const got = this.store.get("got", false);
    if (got) el.classList.add("is-got");

    const q = document.createElement("div");
    q.className = "ace-concept__q";
    q.textContent = props.question;
    el.appendChild(q);

    const hint = document.createElement("div");
    hint.className = "ace-concept__hint";
    hint.textContent = "click to reveal";
    el.appendChild(hint);

    const ans = document.createElement("div");
    ans.className = "ace-concept__ans";
    ans.textContent = props.answer;
    el.appendChild(ans);

    const mastery = document.createElement("div");
    mastery.className = "ace-concept__mastery";
    mastery.innerHTML = `
      <button data-act="got">Got it</button>
      <button data-act="rev">Review</button>`;
    el.appendChild(mastery);

    this.on(el, "click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (btn) {
        e.stopPropagation();
        if (btn.dataset.act === "got") {
          el.classList.add("is-got");
          this.store.set("got", true);
        } else {
          el.classList.remove("is-got");
          this.store.set("got", false);
        }
        return;
      }
      el.classList.add("is-open");
    });
  }
}
