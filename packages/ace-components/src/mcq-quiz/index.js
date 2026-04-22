import { Widget } from "../lib/widget.js";
import schema from "./schema.json" with { type: "json" };

export class MCQQuiz extends Widget {
  static type = "mcq-quiz";
  static schema = schema;
  static examples = [
    {
      id: "actuator-quiz",
      title: "Actuator self-test",
      questions: [
        {
          q: "Electrostatic force between parallel plates scales as:",
          options: ["V, A, 1/x", "V², A, 1/x²", "V², A², 1/x", "V, A², 1/x³"],
          answer: 1,
          explanation: "F = ½ε₀A·V²/x² — V squared, area, and the inverse square of plate distance.",
          topic: "electrostatic"
        },
        {
          q: "'Pull-in voltage' means:",
          options: ["Plates oscillate", "Dielectric fails", "Plate snaps onto the other and sticks", "Max safe operating voltage"],
          answer: 2,
          explanation: "Above V_pi the movable and fixed parts stick together — runaway instability.",
          topic: "electrostatic"
        }
      ]
    }
  ];

  render(props, el) {
    el.classList.add("ace-mcq");
    if (props.title) {
      const h = document.createElement("h5");
      h.textContent = props.title;
      h.style.cssText = "font-family:var(--ace-sans);font-size:13px;font-weight:600;margin:0 0 10px";
      el.appendChild(h);
    }

    const state = this.store.get("answers", props.questions.map(() => null));
    // Guard against schema drift (questions added/removed since last save)
    while (state.length < props.questions.length) state.push(null);
    if (state.length > props.questions.length) state.length = props.questions.length;

    const scoreEl = document.createElement("div");
    scoreEl.className = "ace-mcq__score";
    el.appendChild(scoreEl);

    const listEl = document.createElement("div");
    el.appendChild(listEl);

    const render = () => {
      listEl.innerHTML = "";
      for (let i = 0; i < props.questions.length; i++) {
        const q = props.questions[i];
        const answered = state[i] !== null;
        const item = document.createElement("div");
        item.className = "ace-mcq__item" + (answered ? " is-answered" : "");

        const num = document.createElement("div");
        num.className = "ace-mcq__num";
        num.textContent = `Q${i + 1} of ${props.questions.length}`;
        item.appendChild(num);

        const text = document.createElement("div");
        text.className = "ace-mcq__text";
        text.textContent = q.q;
        item.appendChild(text);

        const opts = document.createElement("div");
        opts.className = "ace-mcq__opts";
        q.options.forEach((opt, j) => {
          const b = document.createElement("button");
          b.textContent = opt;
          if (answered) {
            b.disabled = true;
            if (j === q.answer) b.classList.add("is-correct");
            else if (j === state[i]) b.classList.add("is-wrong");
          } else {
            this.on(b, "click", () => {
              state[i] = j;
              this.store.set("answers", state);
              render();
            });
          }
          opts.appendChild(b);
        });
        item.appendChild(opts);

        if (answered && q.explanation) {
          const exp = document.createElement("div");
          exp.className = "ace-mcq__exp";
          exp.textContent = (state[i] === q.answer ? "Correct. " : `Answer: ${q.options[q.answer]}. `) + q.explanation;
          item.appendChild(exp);
        }
        listEl.appendChild(item);
      }
      updateScore();
    };

    const updateScore = () => {
      const answered = state.filter((x) => x !== null).length;
      const correct = state.filter((x, i) => x === props.questions[i].answer).length;
      scoreEl.textContent = `${correct} correct · ${answered} / ${props.questions.length} answered`;
    };

    render();
  }
}
