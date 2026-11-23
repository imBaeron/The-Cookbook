// The OFFLINE source of recipes: reads the hardcoded array in mocks/recipes.js.
// It has the same four functions as services/api/recipeService.js, so the app
// can run on either one. recipeRepository.js decides which is used (set
// EXPO_PUBLIC_USE_MOCK_DATA=true in .env to use this one).
//
// Handy for: demos with no internet, working on the design without spending
// any API quota, and testing.
import { recipes } from '../mocks/recipes';

// These functions are `async` (they return Promises) even though the data is
// local, so they behave exactly like the real network version.

// Fisher–Yates shuffle: walks the array backwards, swapping each item with
// a random earlier item. Works on a COPY ([...array]) so the original
// recipes array is never reordered/mutated.
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Used by SearchResultsScreen when the search mode is "By Name".
export async function searchByName(query) {
  if (!query || !query.trim()) return recipes;
  const q = query.trim().toLowerCase();
  // .filter keeps only the recipes whose title contains the search text.
  return recipes.filter((r) => r.title.toLowerCase().includes(q));
}

// Used by SearchResultsScreen when the search mode is "By Ingredients".
// ingredientNames is an array like ['egg', 'rice'].
export async function searchByIngredients(ingredientNames) {
  const wanted = ingredientNames.map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (wanted.length === 0) return recipes;

  // For each recipe, count how many of the wanted ingredients it contains.
  const scored = recipes.map((recipe) => {
    const matchCount = wanted.filter((want) =>
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(want))
    ).length;
    return { recipe, matchCount };
  });

  // Drop recipes with zero matches, then show the best matches first.
  return scored
    .filter((s) => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((s) => s.recipe);
}

// Used by RecipeDetailScreen (and SavedRecipesScreen, to look up full
// details for each bookmarked ID). Returns null if the ID doesn't exist.
export async function getRecipeById(id) {
  return recipes.find((r) => r.id === id) ?? null;
}

// Used by HomeScreen for "Today's picks" and the Shuffle button.
export async function getRandomRecipes(count = 6) {
  return shuffle(recipes).slice(0, count);
}
