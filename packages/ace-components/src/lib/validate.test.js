import { describe, it, expect } from "bun:test";
import { validate } from "./validate.js";

describe("validate", () => {
  it("accepts matching type", () => {
    expect(validate("hi", { type: "string" }).valid).toBe(true);
    expect(validate(42, { type: "number" }).valid).toBe(true);
    expect(validate([1, 2], { type: "array" }).valid).toBe(true);
  });

  it("rejects type mismatch", () => {
    const r = validate(42, { type: "string" });
    expect(r.valid).toBe(false);
    expect(r.errors[0]).toMatch(/expected string/);
  });

  it("enforces required fields", () => {
    const schema = { type: "object", required: ["a", "b"], properties: { a: {}, b: {} } };
    const r = validate({ a: 1 }, schema);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /b: required/.test(e))).toBe(true);
  });

  it("rejects additional properties when additionalProperties:false", () => {
    const schema = {
      type: "object",
      additionalProperties: false,
      properties: { a: { type: "string" } },
    };
    const r = validate({ a: "x", extra: 1 }, schema);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => /extra/.test(e))).toBe(true);
  });

  it("validates enum", () => {
    expect(validate("a", { enum: ["a", "b"] }).valid).toBe(true);
    expect(validate("c", { enum: ["a", "b"] }).valid).toBe(false);
  });

  it("validates nested arrays with items schema", () => {
    const schema = { type: "array", items: { type: "number" } };
    expect(validate([1, 2, 3], schema).valid).toBe(true);
    expect(validate([1, "two", 3], schema).valid).toBe(false);
  });

  it("validates string pattern", () => {
    const schema = { type: "string", pattern: "^[a-z]+$" };
    expect(validate("abc", schema).valid).toBe(true);
    expect(validate("ABC", schema).valid).toBe(false);
  });

  it("validates number bounds", () => {
    const schema = { type: "number", minimum: 0, maximum: 10 };
    expect(validate(5, schema).valid).toBe(true);
    expect(validate(-1, schema).valid).toBe(false);
    expect(validate(11, schema).valid).toBe(false);
  });

  it("validates nested objects deeply", () => {
    const schema = {
      type: "object",
      properties: { inner: { type: "object", required: ["x"], properties: { x: { type: "number" } } } },
    };
    expect(validate({ inner: { x: 1 } }, schema).valid).toBe(true);
    expect(validate({ inner: {} }, schema).valid).toBe(false);
    expect(validate({ inner: { x: "no" } }, schema).valid).toBe(false);
  });
});
