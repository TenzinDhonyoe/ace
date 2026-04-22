import { Widget } from "../lib/widget.js";
import schema from "./schema.json" with { type: "json" };

// Prose — the only widget that inlines arbitrary HTML. Required for notes,
// equation boxes, definitions, and spec grids that live BETWEEN interactive
// widgets. Treat body as trusted generator output (same source of truth as
// the rest of site.config.json). If hand-authored by a user, they already
// have arbitrary-code-exec via the `compute` string in slider-sandbox;
// this widget is no worse.

export class Prose extends Widget {
  static type = "prose";
  static schema = schema;
  static examples = [
    {
      id: "es-intro",
      body: "<p>Electrostatic actuators work on the principle of <b>capacitance</b> — charged plates attract each other via Coulomb's law.</p><div class=\"ace-note\"><b>Pull-in voltage</b> V<sub>pi</sub> is the voltage beyond which the spring cannot balance the electrostatic force, and the plates collapse.</div><div class=\"ace-eq\">F<sub>x</sub> = ½ · ε<sub>0</sub>ε<sub>r</sub>A · V² / x²</div>"
    }
  ];

  render(props, el) {
    el.classList.add("ace-prose");
    el.innerHTML = props.body;
  }
}
