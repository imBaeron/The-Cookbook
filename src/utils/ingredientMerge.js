// Combines ingredients from multiple recipes into one list, merging entries
// that share the same name + unit (e.g. two recipes both needing "garlic, cloves")
// by summing their amounts instead of listing them twice.
function keyFor(name, unit) {
  return `${name.trim().toLowerCase()}__${(unit || '').trim().toLowerCase()}`;
}

export function mergeIngredientsIntoList(existingList, newIngredients, sourceTitle) {
  const list = [...existingList];

  newIngredients.forEach((ing) => {
    const key = keyFor(ing.name, ing.unit);
    const existingIndex = list.findIndex((item) => item.id === key);

    if (existingIndex >= 0) {
      const existing = list[existingIndex];
      list[existingIndex] = {
        ...existing,
        amount: existing.amount + ing.amount,
        fromRecipes: existing.fromRecipes.includes(sourceTitle)
          ? existing.fromRecipes
          : [...existing.fromRecipes, sourceTitle],
      };
    } else {
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
