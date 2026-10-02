// The ONLY file that reads mocks/recipes.js directly. Every screen gets
// recipe data by calling one of the 4 functions below instead of touching
// the array itself. This separation matters: if a real API comes back
// later, only this file needs to change — every screen keeps calling
// searchByName(), getRandomRecipes(), etc. exactly as it does now.
import { recipes } from '../mocks/recipes';

// PROTOTYPE VERSION: reads from the hardcoded array in mocks/recipes.js.
// Function names/shapes intentionally match what services/api/recipeService.js
// will look like once the real Spoonacular integration comes back — so
// screens calling these functions won't need to change later, and this
// file can eventually just be deleted in favor of the real one.
//
// One difference from the real version: these are synchronous (no network
// trip), but every function is still declared `async` so screens can use
// the same `await`/`.then()` calling pattern either way.

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
