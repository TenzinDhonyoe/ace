// Widget registry — the contract between the generator and @ace/template.
// CLAUDE.md instructs Claude to reference this registry when selecting widgets
// and filling their `props`. Every widget type string in site.config.json
// must be a key of this object.

import { SliderSandbox } from "./src/slider-sandbox/index.js";
import { Flashcard } from "./src/flashcard/index.js";
import { MCQQuiz } from "./src/mcq-quiz/index.js";
import { DiagramLabel } from "./src/diagram-label/index.js";
import { ConceptCard } from "./src/concept-card/index.js";
import { Prose } from "./src/prose/index.js";

export const registry = {
  "slider-sandbox": SliderSandbox,
  "flashcard": Flashcard,
  "mcq-quiz": MCQQuiz,
  "diagram-label": DiagramLabel,
  "concept-card": ConceptCard,
  "prose": Prose,
};

export const widgetTypes = Object.keys(registry);

// Helper for generators: return a catalog with schema + examples for each
// widget. Serializable — safe to embed in a system prompt.
export function catalog() {
  return widgetTypes.map((type) => {
    const W = registry[type];
    return {
      type,
      schema: W.schema,
      examples: W.examples || [],
    };
  });
}
