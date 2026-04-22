// @ace/components — public API
//
// Every widget is a class with:
//   static type      — string key, matches registry
//   static schema    — JSON Schema for props
//   static examples  — few-shot examples for the generator
//   instance.mount(el, props, { siteId, store? })
//   instance.destroy()

export { SliderSandbox } from "./src/slider-sandbox/index.js";
export { Flashcard } from "./src/flashcard/index.js";
export { MCQQuiz } from "./src/mcq-quiz/index.js";
export { DiagramLabel } from "./src/diagram-label/index.js";
export { ConceptCard } from "./src/concept-card/index.js";
export { Prose } from "./src/prose/index.js";

export { Widget } from "./src/lib/widget.js";
export { makeStore } from "./src/lib/storage.js";
export { validate } from "./src/lib/validate.js";
export { fmtSI, fmtSci } from "./src/lib/format.js";

export { registry, widgetTypes, catalog } from "./registry.js";

import siteConfigSchema from "./schemas/site-config.schema.json" with { type: "json" };
export { siteConfigSchema };
