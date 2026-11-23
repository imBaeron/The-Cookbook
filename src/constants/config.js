// App-wide settings, read from the .env file when the app is bundled.
//
// EXPO RULE (easy to get wrong): every variable must be written EXACTLY as
// `process.env.EXPO_PUBLIC_NAME`. Expo swaps that exact expression for the
// real value while it builds the app. Destructuring
// (`const { EXPO_PUBLIC_X } = process.env`) or bracket access
// (`process.env['EXPO_PUBLIC_X']`) are NOT swapped and come back undefined.
//
// Also: anything starting with EXPO_PUBLIC_ ends up inside the app, so a
// determined person could read it. That's fine for a development key, and it
// is the reason the plan is to move the key into a small proxy server later.

// If this is set, the app talks to YOUR proxy server instead of Spoonacular.
// The proxy holds the real API key, so the app doesn't need one.
const proxyUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

// "Proxy mode" is on whenever a proxy address is provided.
export const USE_PROXY = Boolean(proxyUrl);

// Where requests are sent. The .replace removes any trailing slashes so we
// never end up with a double slash like "https://example.com//recipes/...".
export const API_BASE_URL = USE_PROXY
  ? proxyUrl.replace(/\/+$/, '')
  : 'https://api.spoonacular.com';

// Only used in direct mode (no proxy). Put the real value in your .env file.
export const SPOONACULAR_API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;

// Set EXPO_PUBLIC_USE_MOCK_DATA=true in .env to run on the built-in sample
// recipes instead of the internet (handy for offline demos, and for working
// on the UI without spending any of the daily API quota).
export const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
