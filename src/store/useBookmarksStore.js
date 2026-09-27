import { create } from 'zustand';

// PROTOTYPE VERSION: in-memory only (resets when the app restarts). Step 7
// (post-presentation) swaps this internal storage for AsyncStorage so
// Note: screens should read `bookmarkedIds` directly (e.g.
// `bookmarkedIds.includes(id)`) rather than calling isBookmarked() below —
// selecting a function from a Zustand store never triggers a re-render,
// since the function reference itself never changes. Selecting the actual
// array does.
// stays exactly the same.
export const useBookmarksStore = create((set, get) => ({
  bookmarkedIds: [],

  isBookmarked: (id) => get().bookmarkedIds.includes(id),

  toggleBookmark: (id) =>
    set((state) => ({
      bookmarkedIds: state.bookmarkedIds.includes(id)
        ? state.bookmarkedIds.filter((existingId) => existingId !== id)
        : [...state.bookmarkedIds, id],
    })),
}));
