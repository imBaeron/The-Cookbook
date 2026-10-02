// SHARED STATE, used by multiple screens at once. useState (see any screen
// file) only holds data inside ONE component — but bookmarks and the
// shopping list need to be visible on Home, Search Results, Recipe Detail,
// Saved AND Shopping List, which are all separate screens that can't pass
// props to each other. Zustand solves this: think of useAppStore as
// "useState, but shared across the whole app instead of local to one
// component."
import { create } from 'zustand';
import { mergeIngredientsIntoList } from '../utils/ingredientMerge';

// create(...) builds the store and returns useAppStore, which is a HOOK —
// any screen can call it to read data from or make changes to this store.
// The object below holds both DATA (bookmarkedIds, shoppingListItems) and
// ACTIONS (functions that change that data) together in one place.
//
// Both pieces of state reset when the app restarts (in-memory only) — that's
// fine for this prototype; swapping in AsyncStorage later just means
// changing what happens inside these functions, not how screens use them.
export const useAppStore = create((set) => ({
  // --- Bookmarks ---
  bookmarkedIds: [],

  // set(...) updates the store. set((state) => ({...})) gives you the
  // CURRENT state to build the new state from.
  toggleBookmark: (id) =>
    set((state) => ({
      // If this id is already bookmarked, .filter it OUT (remove it).
      // Otherwise, spread the old array and add the new id to the end.
      // Always build a NEW array (never .push on the old one directly) —
      // this is how React/Zustand know something actually changed.
      bookmarkedIds: state.bookmarkedIds.includes(id)
        ? state.bookmarkedIds.filter((existingId) => existingId !== id)
        : [...state.bookmarkedIds, id],
    })),

  // --- Shopping list ---
  shoppingListItems: [], // { id, name, amount, unit, checked, fromRecipes: [title, ...] }

  // Called from the "Add to Shopping List" button on Recipe Detail.
  addIngredientsFromRecipe: (recipe) =>
    set((state) => ({
      shoppingListItems: mergeIngredientsIntoList(state.shoppingListItems, recipe.ingredients, recipe.title),
    })),

  // Checks/unchecks one item (tapping its checkbox).
  toggleItemChecked: (itemId) =>
    set((state) => ({
      shoppingListItems: state.shoppingListItems.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    })),

  removeItem: (itemId) =>
    set((state) => ({
      shoppingListItems: state.shoppingListItems.filter((item) => item.id !== itemId),
    })),

  clearCheckedItems: () =>
    set((state) => ({ shoppingListItems: state.shoppingListItems.filter((item) => !item.checked) })),

  clearAllItems: () => set({ shoppingListItems: [] }),
}));

// IMPORTANT USAGE NOTE (a real bug we hit and fixed):
// Screens should read `bookmarkedIds` directly, e.g.
//   const bookmarkedIds = useAppStore((s) => s.bookmarkedIds);
//   const saved = bookmarkedIds.includes(recipe.id);
// Selecting a FUNCTION from the store instead — like
// `useAppStore((s) => s.toggleBookmark)` used to compute a value — does
// NOT trigger a re-render when the underlying data changes, because the
// function reference itself never changes. Zustand only re-renders a
// component when the SELECTED VALUE changes, so always select the actual
// data you want to react to, not a function that reads it.
