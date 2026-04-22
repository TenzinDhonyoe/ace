// Minimal JSON Schema validator — supports the subset we actually use:
// type, required, properties, additionalProperties, enum, items, minItems,
// maxItems, pattern, minLength, maxLength, minimum, maximum.
// Deliberately tiny (<1KB gzipped) to protect the widget bundle budget.
//
// Returns { valid: boolean, errors: string[] }

const typeOf = (v) => {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
};

export function validate(value, schema, path = "$") {
  const errors = [];

  if (schema.type) {
    const t = typeOf(value);
    const expected = Array.isArray(schema.type) ? schema.type : [schema.type];
    const matches = expected.some((e) => (e === "integer" ? t === "number" && Number.isInteger(value) : t === e));
    if (!matches) {
      errors.push(`${path}: expected ${expected.join("|")}, got ${t}`);
      return { valid: false, errors };
    }
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${path}: must be one of ${JSON.stringify(schema.enum)}`);
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${path}: must equal ${JSON.stringify(schema.const)}`);
  }

  if (typeof value === "string") {
    if (schema.minLength != null && value.length < schema.minLength) errors.push(`${path}: string too short`);
    if (schema.maxLength != null && value.length > schema.maxLength) errors.push(`${path}: string too long`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${path}: pattern mismatch`);
  }

  if (typeof value === "number") {
    if (schema.minimum != null && value < schema.minimum) errors.push(`${path}: below minimum ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) errors.push(`${path}: above maximum ${schema.maximum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems != null && value.length < schema.minItems) errors.push(`${path}: array too short`);
    if (schema.maxItems != null && value.length > schema.maxItems) errors.push(`${path}: array too long`);
    if (schema.items) {
      value.forEach((item, i) => {
        const r = validate(item, schema.items, `${path}[${i}]`);
        errors.push(...r.errors);
      });
    }
  }

  if (typeOf(value) === "object" && schema.properties) {
    if (schema.required) {
      for (const req of schema.required) {
        if (!(req in value)) errors.push(`${path}.${req}: required`);
      }
    }
    for (const key of Object.keys(value)) {
      if (schema.properties[key]) {
        const r = validate(value[key], schema.properties[key], `${path}.${key}`);
        errors.push(...r.errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key}: unexpected property`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
