# Cookbook App — Static Prototype (for presentation)

> For a full walkthrough of every concept used in this codebase (hooks,
> navigation, styling, state management, and likely instructor questions
> with answers), see **CODE_EXPLANATIONS.md** in this same folder.

## What this build is
A fully working prototype using **hardcoded local data** — no API, no backend, no
internet connection needed. Search, recipe details, bookmarking, and the shopping
list all genuinely work. Only the data source (a local array instead of a real
API) is fake, using the same function names a real API version would use.

## Project structure
```
App.js                          Root: loads fonts, sets up navigation
src/
  constants/
    colors.js                   Color palette
    theme.js                    Fonts, spacing, typography, shared header style
  navigation/
    MainTabNavigator.js         Bottom tabs: Cookbook, Saved, Shopping List
    RecipeStackNavigator.js     Home -> Search Results -> Recipe Detail
  screens/                      One folder per screen
  components/
    RecipeCard.js                A recipe preview (used on Home, Search, Saved)
    SearchBar.js                  Search input + name/ingredients toggle
    BookmarkButton.js             The bookmark icon toggle
  data/
    recipeRepository.js          searchByName / searchByIngredients / getRecipeById /
                                  getRandomRecipes — reads from mocks/recipes.js
  mocks/
    recipes.js                   The 8 hardcoded recipes (ingredients + steps)
  store/
    useAppStore.js                One shared store: bookmarks + shopping list
  utils/
    ingredientMerge.js            Combines duplicate ingredients into one shopping list
```

**Why this shape:** screens never touch `mocks/recipes.js` directly — they call
functions like `getRandomRecipes()` from `recipeRepository.js`. If the real
Spoonacular API comes back later, only that one file needs to change.

## One shared store, not several
`useAppStore.js` holds both bookmarks and the shopping list in one place (using
Zustand — think of it as `useState`, but shared across every screen instead of
local to one component). Both reset when the app restarts, which is fine for a
demo; real persistence (AsyncStorage) is a small future addition, not a rewrite.

## New dependency
```
npm install zustand
```

## Setup
1. Copy `src/` and `App.js` into your project (replace existing files).
2. `npm install zustand` if you haven't already.
3. `npx expo start` and scan the QR code in Expo Go.

## What to check
- Home: 4 random recipes, Shuffle button re-randomizes them
- Search: try "chicken" (by name) and "egg, rice" (by ingredients)
- Tap a recipe → full detail with ingredients + steps
- Bookmark icon → updates instantly, shows up in Saved tab
- "Add to Shopping List" on a recipe → check the Shopping List tab
