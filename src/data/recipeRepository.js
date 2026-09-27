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

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function searchByName(query) {
  if (!query || !query.trim()) return recipes;
  const q = query.trim().toLowerCase();
  return recipes.filter((r) => r.title.toLowerCase().includes(q));
}

export async function searchByIngredients(ingredientNames) {
  const wanted = ingredientNames.map((i) => i.trim().toLowerCase()).filter(Boolean);
  if (wanted.length === 0) return recipes;

  const scored = recipes.map((recipe) => {
    const matchCount = wanted.filter((want) =>
      recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(want))
    ).length;
    return { recipe, matchCount };
  });

  return scored
    .filter((s) => s.matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map((s) => s.recipe);
}

export async function getRecipeById(id) {
  return recipes.find((r) => r.id === id) ?? null;
}

export async function getRandomRecipes(count = 6) {
  return shuffle(recipes).slice(0, count);
}
