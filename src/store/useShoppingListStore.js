import { create } from 'zustand';
import { mergeIngredientsIntoList } from '../utils/ingredientMerge';

// PROTOTYPE VERSION: in-memory only, same reasoning as useBookmarksStore.
export const useShoppingListStore = create((set) => ({
  items: [], // { id, name, amount, unit, checked, fromRecipes: [title, ...] }

  addIngredientsFromRecipe: (recipe) =>
    set((state) => ({
      items: mergeIngredientsIntoList(state.items, recipe.ingredients, recipe.title),
    })),

  toggleChecked: (itemId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    })),

  removeItem: (itemId) =>
    set((state) => ({ items: state.items.filter((item) => item.id !== itemId) })),

  clearChecked: () =>
    set((state) => ({ items: state.items.filter((item) => !item.checked) })),

  clearAll: () => set({ items: [] }),
}));
