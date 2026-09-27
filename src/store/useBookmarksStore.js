import { create } from 'zustand';

// PROTOTYPE VERSION: in-memory only (resets when the app restarts). Step 7
// (post-presentation) swaps this internal storage for AsyncStorage so
// bookmarks persist — every screen using isBookmarked()/toggleBookmark()
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
