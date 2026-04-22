// Namespaced localStorage with graceful fallback.
// Keys: ace:<siteId>:<widgetId>:<key>
// When localStorage is unavailable (Safari private mode, disabled, or SSR),
// falls back to an in-memory Map so widgets still work for the session.

const memFallback = new Map();

function canUseLocalStorage() {
  try {
    if (typeof localStorage === "undefined") return false;
    const probe = "__ace_probe__";
    localStorage.setItem(probe, "1");
    localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

const available = canUseLocalStorage();

export function makeStore(siteId, widgetId) {
  if (!siteId || typeof siteId !== "string") {
    throw new Error("makeStore requires a non-empty siteId string");
  }
  if (!widgetId || typeof widgetId !== "string") {
    throw new Error("makeStore requires a non-empty widgetId string");
  }
  const prefix = `ace:${siteId}:${widgetId}:`;

  return {
    get(key, fallback) {
      const k = prefix + key;
      try {
        const raw = available ? localStorage.getItem(k) : memFallback.get(k);
        if (raw == null) return fallback;
        return JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      const k = prefix + key;
      try {
        const raw = JSON.stringify(value);
        if (available) localStorage.setItem(k, raw);
        else memFallback.set(k, raw);
      } catch {
        // quota exceeded or circular ref — swallow; state is best-effort
      }
    },
    remove(key) {
      const k = prefix + key;
      try {
        if (available) localStorage.removeItem(k);
        else memFallback.delete(k);
      } catch {
        // ignore
      }
    },
    clear() {
      try {
        if (available) {
          const keys = [];
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith(prefix)) keys.push(k);
          }
          keys.forEach((k) => localStorage.removeItem(k));
        } else {
          for (const k of memFallback.keys()) {
            if (k.startsWith(prefix)) memFallback.delete(k);
          }
        }
      } catch {
        // ignore
      }
    },
  };
}

// Used only in tests to reset the in-memory fallback.
export function _resetMemFallback() {
  memFallback.clear();
}

export const storageAvailable = available;
