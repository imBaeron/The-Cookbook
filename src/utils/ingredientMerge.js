// A plain function with no React in it (a "pure function" — same input
// always gives the same output, no side effects). Its one job: combine
// a new recipe's ingredients into the existing shopping list, merging
// duplicates (e.g. two recipes both needing "garlic, cloves") by adding
// their amounts together instead of listing them twice.

// Builds a unique ID for an ingredient from its name + unit, e.g.
// "garlic" + "cloves" -> "garlic__cloves". Lowercased and trimmed so
// "Garlic" and "garlic" are treated as the same ingredient, but different
// units (e.g. "cup" vs "g") are kept as separate entries on purpose.
function keyFor(name, unit) {
  return `${name.trim().toLowerCase()}__${(unit || '').trim().toLowerCase()}`;
}

// existingList: the shopping list so far.
// newIngredients: the array of ingredients from the recipe just added.
// sourceTitle: that recipe's title, so the list can show "from: X, Y".
export function mergeIngredientsIntoList(existingList, newIngredients, sourceTitle) {
  // Copy the list rather than modifying it directly — React/Zustand detect
  // changes by comparing references, so mutating the original array in
  // place wouldn't trigger a re-render anywhere.
  const list = [...existingList];

  newIngredients.forEach((ing) => {
    const key = keyFor(ing.name, ing.unit);
    const existingIndex = list.findIndex((item) => item.id === key);

    if (existingIndex >= 0) {
      // Already on the list — replace it with a copy that has the amount
      // increased, and the new recipe's title added to fromRecipes.
      const existing = list[existingIndex];
      list[existingIndex] = {
        ...existing,
        amount: existing.amount + ing.amount,
        fromRecipes: existing.fromRecipes.includes(sourceTitle)
          ? existing.fromRecipes
          : [...existing.fromRecipes, sourceTitle],
      };
    } else {
      // First time seeing this ingredient — add it as a new row.
      list.push({
        id: key,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        checked: false,
        fromRecipes: [sourceTitle],
      });
    }
  });

  return list;
}
