// SHARED STATE, used by multiple screens at once. useState (see any screen
// file) only holds data inside ONE component — but bookmarks and the
// shopping list need to be visible on Home, Search Results, Recipe Detail,
// Saved AND Shopping List, which are all separate screens that can't pass
// props to each other. Zustand solves this: think of useAppStore as
// "useState, but shared across the whole app instead of local to one
// component."
//
// NEW: the store is now SAVED TO THE PHONE. The `persist` wrapper below
// copies the bookmarks and shopping list into AsyncStorage (a small
// key-value database on the device) every time they change, and loads them
// back the next time the app opens.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mergeIngredientsIntoList } from '../utils/ingredientMerge';

// ---------- helpers ----------

// What we remember about a bookmarked recipe: just enough to draw its card.
// We store this small "snapshot" (not only the id) so the Saved tab can show
// every bookmark instantly after a restart, with no internet and without
// spending any API points. The full recipe (ingredients, steps) is fetched
// when the user opens it.
function toSnapshot(recipe) {
  return {
    id: recipe.id,
    title: recipe.title,
    image: recipe.image ?? null,
    readyInMinutes: recipe.readyInMinutes ?? null,
    servings: recipe.servings ?? null,
    vegetarian: recipe.vegetarian ?? null,
    vegan: recipe.vegan ?? null,
    glutenFree: recipe.glutenFree ?? null,
    healthScore: recipe.healthScore ?? null,
  };
}

// Data coming back from storage is "untrusted": it could be corrupted, or
// written by an older version of the app. These two functions keep only
// entries that look right, so a bad entry can never crash a screen later
// (for example `bookmarks.some(...)` on something that isn't an array).
function cleanBookmarks(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((b) => b && b.id != null && typeof b.title === 'string');
}

function cleanShoppingItems(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.amount === 'number' &&
        Array.isArray(item.fromRecipes)
    )
    .map((item) => ({ ...item, unit: item.unit ?? '', checked: Boolean(item.checked) }));
}

// ---------- the store ----------

// create(...) builds the store and returns useAppStore, which is a HOOK —
// any screen can call it to read data from or make changes to this store.
// The object inside holds both DATA and ACTIONS (functions that change the
// data) together in one place.
export const useAppStore = create(
  persist(
    (set) => ({
      // --- Bookmarks ---
      // A list of recipe snapshots (see toSnapshot above), oldest first.
      bookmarks: [],

      // Pass the whole recipe (not just its id) so we can save a snapshot.
      // set((state) => ...) gives us the CURRENT state to build the new one from.
      toggleBookmark: (recipe) =>
        set((state) => {
          const alreadySaved = state.bookmarks.some((b) => b.id === recipe.id);
          return {
            // Saved already? .filter it OUT. Otherwise, spread the old array
            // and add a snapshot at the end. Always build a NEW array (never
            // .push on the old one) — that's how Zustand/React notice a change.
            bookmarks: alreadySaved
              ? state.bookmarks.filter((b) => b.id !== recipe.id)
              : [...state.bookmarks, toSnapshot(recipe)],
          };
        }),

      // --- Shopping list ---
      shoppingListItems: [], // { id, name, amount, unit, checked, fromRecipes: [title, ...] }

      // Called from the "Add to Shopping List" button on Recipe Detail.
      addIngredientsFromRecipe: (recipe) =>
        set((state) => ({
          shoppingListItems: mergeIngredientsIntoList(
            state.shoppingListItems,
            recipe.ingredients,
            recipe.title
          ),
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
        set((state) => ({
          shoppingListItems: state.shoppingListItems.filter((item) => !item.checked),
        })),

      clearAllItems: () => set({ shoppingListItems: [] }),

      // --- Loading from the phone ---
      // Reading AsyncStorage takes a moment, so for a split second after the
      // app opens the lists are still empty. This flag turns true once the
      // saved data has been loaded (App.js keeps the splash screen up until
      // then). It is NOT saved to the phone — see `partialize` below.
      _hasHydrated: false,
      _setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      // The key the data is saved under on the phone.
      name: 'cookbook-store',

      // Version of the saved data's shape. If you ever change what is saved
      // (rename a field, etc.), raise this number and add a `migrate`
      // function here that converts old data — otherwise old saved data is
      // ignored.
      version: 1,

      // Save as JSON text inside AsyncStorage.
      storage: createJSONStorage(() => AsyncStorage),

      // Save ONLY the real data — not the functions and not _hasHydrated.
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        shoppingListItems: state.shoppingListItems,
      }),

      // How saved data is combined with the store's starting state when the
      // app opens. We clean it first so bad data can't get in.
      merge: (saved, current) => ({
        ...current,
        bookmarks: cleanBookmarks(saved?.bookmarks),
        shoppingListItems: cleanShoppingItems(saved?.shoppingListItems),
      }),

      // Runs when loading from the phone starts; the function it returns runs
      // when loading finishes — and it runs whether loading succeeded OR
      // failed (corrupted data, storage error). That matters: either way we
      // flip the flag, so the app can never get stuck on the splash screen.
      onRehydrateStorage: (stateBeforeLoading) => () => {
        stateBeforeLoading?._setHasHydrated(true);
      },
    }
  )
);

// IMPORTANT USAGE NOTE (a real bug we hit and fixed earlier):
// Screens should read DATA from the store, e.g.
//   const bookmarks = useAppStore((s) => s.bookmarks);
//   const saved = bookmarks.some((b) => b.id === recipe.id);
// Selecting a FUNCTION to compute a value would NOT re-render the screen when
// the data changes, because the function itself never changes. Zustand only
// re-renders a component when the SELECTED VALUE changes.
