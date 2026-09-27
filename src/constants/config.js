// Expo SDK 49+ exposes any env var prefixed with EXPO_PUBLIC_ via process.env
// at build time — no extra babel plugin needed. Set this in your .env file
// (copy .env.example to .env and fill in your real key).
export const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
export const SPOONACULAR_BASE_URL = 'https://api.spoonacular.com';

if (!SPOONACULAR_API_KEY) {
  console.warn(
    '[config] Missing EXPO_PUBLIC_SPOONACULAR_API_KEY — recipe search will fail until this is set in your .env file.'
  );
}
