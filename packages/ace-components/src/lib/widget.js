// Base class for all @ace/components widgets.
//
// Subclasses must define:
//   static type         — string, matches registry key (e.g. "slider-sandbox")
//   static schema       — JSON Schema for the `props` object
//   static examples     — array of example prop objects (consumed by Claude few-shot)
//   render(props, el)   — write DOM into el, attach listeners, return void
//
// Subclasses MAY define:
//   onDestroy()         — cleanup listeners/timers; DOM is auto-cleared
//
// Every widget instance exposes:
//   .mount(el, props, { siteId?, store? })
//   .destroy()
//   .el                 — the mount element (after mount)
//   .store              — namespaced storage (after mount)
//
// mount() validates props. Invalid props render an inline error card
// instead of throwing — one bad widget must never break the whole page.

import { validate } from "./validate.js";
import { makeStore } from "./storage.js";

export class Widget {
  constructor() {
    this.el = null;
    this.store = null;
    this._listeners = [];
  }

  mount(el, props, opts = {}) {
    if (!el || !(el instanceof Element)) {
      throw new Error(`${this.constructor.type || "Widget"}.mount: el must be a DOM Element`);
    }
    this.el = el;
    const { siteId = "anon", store } = opts;
    const widgetId = props && props.id ? props.id : `${this.constructor.type || "w"}-${rand()}`;
    this.store = store || makeStore(siteId, widgetId);

    const schema = this.constructor.schema;
    if (schema) {
      const result = validate(props || {}, schema);
      if (!result.valid) {
        this._renderError(
          `${this.constructor.type}: invalid props`,
          result.errors.slice(0, 5).join("; ")
        );
        if (typeof console !== "undefined") {
          console.error(`[ace] ${this.constructor.type} invalid props:`, result.errors);
        }
        return this;
      }
    }

    try {
      this.render(props, el);
    } catch (err) {
      this._renderError(`${this.constructor.type}: render failed`, err && err.message);
      if (typeof console !== "undefined") console.error(`[ace] ${this.constructor.type} render error:`, err);
    }
    return this;
  }

  destroy() {
    for (const { target, type, handler, options } of this._listeners) {
      target.removeEventListener(type, handler, options);
    }
    this._listeners = [];
    if (this.onDestroy) {
      try { this.onDestroy(); } catch { /* swallow */ }
    }
    if (this.el) this.el.innerHTML = "";
    this.el = null;
    this.store = null;
  }

  // Subclasses should call this instead of target.addEventListener so listeners
  // are tracked and cleaned up on destroy().
  on(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this._listeners.push({ target, type, handler, options });
  }

  render(_props, _el) {
    throw new Error(`${this.constructor.name}: must implement render()`);
  }

  _renderError(title, detail) {
    if (!this.el) return;
    this.el.innerHTML = "";
    const card = document.createElement("div");
    card.className = "ace-error";
    card.setAttribute("role", "alert");
    const h = document.createElement("strong");
    h.textContent = title;
    const p = document.createElement("div");
    p.textContent = detail || "See console for details.";
    card.appendChild(h);
    card.appendChild(p);
    this.el.appendChild(card);
  }
}

function rand() {
  return Math.random().toString(36).slice(2, 8);
}
