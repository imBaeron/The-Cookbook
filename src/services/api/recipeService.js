// The real recipe source: the same four functions the mock version has
// (searchByName, searchByIngredients, getRecipeById, getRandomRecipes), but
// answered by Spoonacular over the internet.
//
// Screens never import this file directly — they import data/recipeRepository.js,
// which picks between this and the mock data. That's why the screens didn't
// need to change shape when we added a real API.
//
// Spoonacular returns LOTS of fields and its names don't always match ours.
// The "to..." helpers below reshape each response into the exact shape the
// app already uses, so RecipeCard / RecipeDetailScreen keep working as is.
import { apiGet } from './apiClient';
import { createCache } from './cache';

// Saves daily API points (see cache.js). Search results are remembered for
// 10 minutes, full recipe details for 30.
const searchCache = createCache({ ttlMs: 10 * 60 * 1000, maxEntries: 30 });
const detailCache = createCache({ ttlMs: 30 * 60 * 1000, maxEntries: 60 });

// Rounds to 2 decimals so amounts like 0.33333333 stay readable and merge
// cleanly on the shopping list.
const round2 = (n) => Math.round(n * 100) / 100;

// ---------- reshaping helpers ----------

// What a recipe CARD needs: title, photo, time, and diet tags.
// `?? null` means "if Spoonacular didn't send it, use null" — RecipeCard
// already hides the time and tags when they're null.
function toSummary(r) {
  return {
    id: r.id,
    title: r.title,
    image: r.image ?? null,
    readyInMinutes: r.readyInMinutes ?? null,
    servings: r.servings ?? null,
    vegetarian: r.vegetarian ?? null,
    vegan: r.vegan ?? null,
    glutenFree: r.glutenFree ?? null,
    healthScore: r.healthScore != null ? Math.round(r.healthScore) : null,
  };
}

// Spoonacular's ingredient list -> [{ name, amount, unit }].
// Prefers "nameClean" (e.g. "butter") over "name" when it exists, because
// cleaner names merge better on the shopping list.
function toIngredients(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((ing) => ({
      name: String(ing.nameClean || ing.name || ing.originalName || '').trim(),
      amount: round2(Number(ing.amount) || 0),
      unit: String(ing.unit || '').trim(),
    }))
    .filter((ing) => ing.name !== '');
}

// Instructions can contain HTML like "<ol><li>Mix.</li></ol>". We want plain text.
function stripHtml(text) {
  return text
    .replace(/<\/(li|p|div)>/gi, '\n') // end of a list item/paragraph = new line
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '') // remove every remaining tag
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Spoonacular's instructions -> an array of plain step strings.
// Best source: analyzedInstructions (already split into steps).
// Fallback: the raw `instructions` text, split by line.
function toSteps(r) {
  const groups = Array.isArray(r.analyzedInstructions) ? r.analyzedInstructions : [];
  const analyzed = groups
    .flatMap((group) => (Array.isArray(group.steps) ? group.steps : []))
    .map((s) => String(s.step || '').trim())
    .filter(Boolean);
  if (analyzed.length > 0) return analyzed;

  const raw = typeof r.instructions === 'string' ? r.instructions : '';
  return stripHtml(raw)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

// Everything the detail screen needs: the card info + ingredients + steps.
function toDetail(r) {
  return {
    ...toSummary(r),
    ingredients: toIngredients(r.extendedIngredients),
    steps: toSteps(r),
    diets: Array.isArray(r.diets) ? r.diets : [],
  };
}

// ---------- the four public functions ----------

// "By Name" search. The optional filters (diet, intolerances, maxReadyTime)
// are ready for the dietary-preferences feature; nothing passes them yet.
// addRecipeInformation=true makes Spoonacular include cook time and diet
// flags in the same response, so cards can show them without extra requests.
export async function searchByName(
  query,
  { diet, intolerances, maxReadyTime, number = 12 } = {}
) {
  const cleanQuery = (query || '').trim();
  const cacheKey = `name|${cleanQuery.toLowerCase()}|${diet}|${intolerances}|${maxReadyTime}|${number}`;

  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const data = await apiGet('/recipes/complexSearch', {
    query: cleanQuery,
    diet,
    intolerances,
    maxReadyTime,
    number,
    addRecipeInformation: true,
  });

  const results = ((data && data.results) || []).map(toSummary);
  searchCache.set(cacheKey, results);
  return results;
}

// "By Ingredients" search. ingredientNames is an array like ['egg', 'rice'].
// This endpoint doesn't return cook time or diet flags, so those stay null on
// the card; the full details load when the user opens the recipe.
export async function searchByIngredients(ingredientNames, { number = 12 } = {}) {
  const wanted = (ingredientNames || [])
    .map((name) => String(name).trim().toLowerCase())
    .filter(Boolean);

  // Nothing typed -> nothing to search for (and no request wasted).
  if (wanted.length === 0) return [];

  const cacheKey = `ingredients|${[...wanted].sort().join(',')}|${number}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  const data = await apiGet('/recipes/findByIngredients', {
    ingredients: wanted.join(','),
    number,
    ranking: 1, // 1 = prefer recipes that use the most of YOUR ingredients
    ignorePantry: true, // don't count basics like salt and water
  });

  // This endpoint returns a plain array (not { results: [...] }).
  const results = (Array.isArray(data) ? data : []).map((r) => ({
    ...toSummary(r),
    usedIngredientCount: r.usedIngredientCount ?? 0,
    missedIngredientCount: r.missedIngredientCount ?? 0,
  }));

  searchCache.set(cacheKey, results);
  return results;
}

// One full recipe. Returns null if it doesn't exist (same as the mock version);
// other problems (no internet, quota used up...) are thrown as errors.
export async function getRecipeById(id) {
  const cacheKey = String(id);
  const cached = detailCache.get(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiGet(`/recipes/${encodeURIComponent(cacheKey)}/information`, {
      includeNutrition: false,
    });
    const recipe = toDetail(data);
    detailCache.set(cacheKey, recipe);
    return recipe;
  } catch (err) {
    if (err.kind === 'not_found') return null;
    throw err;
  }
}

// Random recipes for the Home screen. This endpoint returns FULL details, so
// we also store each one in the detail cache: tapping a random pick then
// opens instantly and doesn't spend another point.
export async function getRandomRecipes(count = 6) {
  const data = await apiGet('/recipes/random', { number: count });
  const recipes = ((data && data.recipes) || []).map(toDetail);
  recipes.forEach((recipe) => detailCache.set(String(recipe.id), recipe));
  return recipes;
}
