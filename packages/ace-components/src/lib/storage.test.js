import { describe, it, expect, beforeEach } from "bun:test";
import { makeStore, _resetMemFallback } from "./storage.js";

describe("makeStore", () => {
  beforeEach(() => {
    localStorage.clear();
    _resetMemFallback();
  });

  it("requires non-empty siteId and widgetId", () => {
    expect(() => makeStore("", "w")).toThrow();
    expect(() => makeStore("s", "")).toThrow();
    expect(() => makeStore(null, "w")).toThrow();
  });

  it("saves and loads values", () => {
    const store = makeStore("site1", "widget1");
    store.set("count", 42);
    expect(store.get("count")).toBe(42);
  });

  it("returns fallback for missing keys", () => {
    const store = makeStore("site1", "widget1");
    expect(store.get("missing", "default")).toBe("default");
    expect(store.get("missing")).toBeUndefined();
  });

  it("namespaces keys by siteId and widgetId", () => {
    const a = makeStore("siteA", "widget1");
    const b = makeStore("siteB", "widget1");
    a.set("v", "from-A");
    b.set("v", "from-B");
    expect(a.get("v")).toBe("from-A");
    expect(b.get("v")).toBe("from-B");
  });

  it("namespaces keys across different widgetIds under same site", () => {
    const a = makeStore("site1", "wA");
    const b = makeStore("site1", "wB");
    a.set("v", 1);
    b.set("v", 2);
    expect(a.get("v")).toBe(1);
    expect(b.get("v")).toBe(2);
  });

  it("handles complex objects via JSON roundtrip", () => {
    const store = makeStore("s", "w");
    const obj = { got: ["a", "b"], rev: ["c"], nested: { n: 3 } };
    store.set("mastery", obj);
    expect(store.get("mastery")).toEqual(obj);
  });

  it("remove() deletes a key", () => {
    const store = makeStore("s", "w");
    store.set("k", "v");
    store.remove("k");
    expect(store.get("k")).toBeUndefined();
  });

  it("clear() removes only this widget's keys", () => {
    const a = makeStore("s", "wA");
    const b = makeStore("s", "wB");
    a.set("x", 1);
    a.set("y", 2);
    b.set("x", 99);
    a.clear();
    expect(a.get("x")).toBeUndefined();
    expect(a.get("y")).toBeUndefined();
    expect(b.get("x")).toBe(99);
  });

  it("recovers from malformed JSON by returning the fallback", () => {
    const store = makeStore("s", "w");
    localStorage.setItem("ace:s:w:bad", "{not valid json");
    expect(store.get("bad", "fb")).toBe("fb");
  });
});
