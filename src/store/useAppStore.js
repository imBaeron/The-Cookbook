import { create } from 'zustand';
import { mergeIngredientsIntoList } from '../utils/ingredientMerge';

// One shared store for all app-wide state that isn't tied to a single screen:
// which recipes are bookmarked, and what's on the shopping list. Both reset
// when the app restarts (in-memory only) — that's fine for this prototype;
// swapping in AsyncStorage later just means changing the two lines marked
// below, nothing else in the app needs to change.
export const useAppStore = create((set) => ({
  // --- Bookmarks ---
  bookmarkedIds: [],

  toggleBookmark: (id) =>
    set((state) => ({
      bookmarkedIds: state.bookmarkedIds.includes(id)
        ? state.bookmarkedIds.filter((existingId) => existingId !== id)
        : [...state.bookmarkedIds, id],
    })),

  // --- Shopping list ---
  shoppingListItems: [], // { id, name, amount, unit, checked, fromRecipes: [title, ...] }

  addIngredientsFromRecipe: (recipe) =>
    set((state) => ({
      shoppingListItems: mergeIngredientsIntoList(state.shoppingListItems, recipe.ingredients, recipe.title),
    })),

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
