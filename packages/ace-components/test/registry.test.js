import { describe, it, expect } from "bun:test";
import { registry, widgetTypes, catalog } from "../registry.js";
import siteConfigSchema from "../schemas/site-config.schema.json" with { type: "json" };

describe("registry", () => {
  it("contains all 6 widget types", () => {
    expect(widgetTypes.sort()).toEqual(
      ["concept-card", "diagram-label", "flashcard", "mcq-quiz", "prose", "slider-sandbox"]
    );
  });

  it("every registry entry has required static metadata", () => {
    for (const [type, W] of Object.entries(registry)) {
      expect(W.type).toBe(type);
      expect(W.schema).toBeDefined();
      expect(W.schema.type).toBe("object");
      expect(W.examples).toBeDefined();
      expect(W.examples.length).toBeGreaterThan(0);
    }
  });

  it("registry keys exactly match site-config schema widget type enum", () => {
    const enumValues = siteConfigSchema.$defs.widgetRef.properties.type.enum;
    expect(enumValues.sort()).toEqual(widgetTypes.sort());
  });

  it("catalog() returns serializable per-widget metadata", () => {
    const c = catalog();
    expect(c.length).toBe(6);
    for (const entry of c) {
      expect(entry.type).toBeDefined();
      expect(entry.schema).toBeDefined();
      expect(Array.isArray(entry.examples)).toBe(true);
      // Must be JSON-round-trippable (no classes, functions, or circular refs)
      expect(() => JSON.stringify(entry)).not.toThrow();
    }
  });

  it("each widget example validates against that widget's schema", async () => {
    const { validate } = await import("../src/lib/validate.js");
    for (const [type, W] of Object.entries(registry)) {
      for (const ex of W.examples) {
        const r = validate(ex, W.schema);
        if (!r.valid) {
          throw new Error(`${type} example failed its own schema: ${r.errors.join("; ")}`);
        }
      }
    }
  });
});
