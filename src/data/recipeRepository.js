// The ONE place screens import recipe data from. They call functions like
// searchByName() or getRandomRecipes() and never need to know where the answer
// came from.
//
// Behind these four functions there are two possible sources:
//   - services/api/recipeService.js   -> the real Spoonacular API (default)
//   - data/mockRecipeRepository.js    -> the built-in sample recipes
//
// Which one is used is decided by EXPO_PUBLIC_USE_MOCK_DATA in your .env file.
// Both sources have the same function names, inputs and output shapes, so the
// screens work identically with either.
import { USE_MOCK_DATA } from '../constants/config';
import * as mockSource from './mockRecipeRepository';
import * as apiSource from '../services/api/recipeService';

const source = USE_MOCK_DATA ? mockSource : apiSource;

// (...args) means "whatever inputs I'm given, pass them straight along".
export const searchByName = (...args) => source.searchByName(...args);
export const searchByIngredients = (...args) => source.searchByIngredients(...args);
export const getRecipeById = (...args) => source.getRecipeById(...args);
export const getRandomRecipes = (...args) => source.getRandomRecipes(...args);
