// A tiny "remember this answer for a while" helper.
//
// Why it exists: the free Spoonacular plan only allows a small number of
// requests ("points") per day. If someone searches "pasta", goes back, and
// searches "pasta" again, we can answer from memory instead of spending
// another point.
//
// It only lives in memory, so it is wiped when the app closes. Every entry
// also expires after `ttlMs` milliseconds so results never get too stale
// (Spoonacular's terms also limit how long data may be kept, so keep the
// times short).
export function createCache({ ttlMs, maxEntries = 50 }) {
  // A Map remembers the order things were added, which we use below to
  // throw away the oldest entry when the cache is full.
  const store = new Map();

  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return undefined;

      // Too old? Forget it and act as if we never had it.
      if (Date.now() > hit.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return hit.value;
    },

    set(key, value) {
      // Full? Remove the oldest entry (the first key in the Map).
      if (store.size >= maxEntries && !store.has(key)) {
        store.delete(store.keys().next().value);
      }
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },

    clear() {
      store.clear();
    },
  };
}
