// The ONLY file that talks to the internet. Everything else (recipeService.js,
// the screens) calls apiGet() and never touches fetch() directly.
//
// Its jobs:
//   1. build the full URL (base address + path + query string)
//   2. send the API key (or skip it when going through our own proxy)
//   3. give up after a timeout instead of loading forever
//   4. turn every kind of failure into ONE predictable error shape that the
//      screens can show to the user
import { API_BASE_URL, SPOONACULAR_API_KEY, USE_PROXY } from '../../constants/config';

// How long we wait for the server before giving up (milliseconds).
const REQUEST_TIMEOUT_MS = 12000;

// What the user sees for each kind of failure. Screens show these directly,
// so they're written for people, not developers.
const USER_MESSAGES = {
  config:
    'No API key found. Add EXPO_PUBLIC_SPOONACULAR_API_KEY to your .env file, then restart Expo.',
  network: "Can't reach the recipe service. Check your internet connection and try again.",
  timeout: 'The request took too long. Please try again.',
  auth: "The recipe service rejected the API key. Check that it's correct.",
  quota: "Today's recipe limit has been reached. Please try again tomorrow.",
  rate_limit: 'Too many requests at once. Wait a moment and try again.',
  not_found: "That recipe couldn't be found.",
  server: 'The recipe service is having problems. Please try again later.',
  unknown: 'Something went wrong. Please try again.',
};

// Builds an Error that carries extra info:
//   error.kind        -> a short code like 'quota' (code can check this)
//   error.status      -> the HTTP status number, if there was one
//   error.userMessage -> friendly text (screens show this)
//
// We attach these to a normal Error on purpose, instead of creating a custom
// Error subclass: checking `error.kind` is simple and always works.
function createApiError(kind, status = null) {
  const error = new Error(status ? `${kind} (HTTP ${status})` : kind);
  error.kind = kind;
  error.status = status;
  error.userMessage = USER_MESSAGES[kind] ?? USER_MESSAGES.unknown;
  return error;
}

// HTTP status numbers -> our error kinds. Spoonacular uses 402 (not 429) for
// "you've used up today's points".
function kindFromStatus(status) {
  if (status === 401 || status === 403) return 'auth';
  if (status === 402) return 'quota';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  return 'unknown';
}

// Turns { query: 'pasta', number: 12 } into "query=pasta&number=12".
// Skips empty values and URL-encodes the rest (so a search for "mac & cheese"
// can't break the URL). We build this by hand instead of using URLSearchParams
// because React Native's version of it has historically been incomplete.
function buildQueryString(params) {
  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&');
}

/**
 * GET a path from the recipe API and return the parsed JSON.
 * Throws an Error with .kind / .status / .userMessage if anything goes wrong.
 *
 * @param {string} path    e.g. '/recipes/complexSearch'
 * @param {object} params  query-string values, e.g. { query: 'pasta' }
 * @param {object} options { timeoutMs } — mostly useful for testing
 */
export async function apiGet(path, params = {}, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  // Direct mode needs a key. Fail early with a clear message instead of
  // sending a request that is guaranteed to be rejected.
  if (!USE_PROXY && !SPOONACULAR_API_KEY) {
    throw createApiError('config');
  }

  const query = buildQueryString(params);
  const url = `${API_BASE_URL}${path}${query ? `?${query}` : ''}`;

  // The key goes in a header (not the URL), so it never shows up in logs or
  // error messages that print the address. Through our proxy, no key is sent
  // at all — the proxy adds it on the server.
  const headers = { Accept: 'application/json' };
  if (!USE_PROXY) headers['x-api-key'] = SPOONACULAR_API_KEY;

  // AbortController lets us cancel a request that is taking too long.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let response;
    try {
      response = await fetch(url, { headers, signal: controller.signal });
    } catch (err) {
      // fetch only throws when no response arrived at all: either we aborted
      // it (timeout) or the network is down / unreachable.
      throw createApiError(err && err.name === 'AbortError' ? 'timeout' : 'network');
    }

    // Read the body. Error responses from Spoonacular are JSON too, but be
    // careful in case something else (like a router login page) answers.
    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      if (err && err.name === 'AbortError') throw createApiError('timeout');
      body = null;
    }

    // Developer help: shows in the Metro terminal, never to users. Spoonacular
    // reports how many daily points are left in a response header.
    if (__DEV__) {
      const left = response.headers && response.headers.get('x-api-quota-left');
      console.log(`[api] GET ${path} -> ${response.status}${left != null ? ` (points left today: ${left})` : ''}`);
      if (!response.ok && body && body.message) console.log(`[api] ${body.message}`);
    }

    if (!response.ok) {
      throw createApiError(kindFromStatus(response.status), response.status);
    }
    if (body === null) {
      // A "successful" response that wasn't JSON — treat it as a failure.
      throw createApiError('unknown', response.status);
    }

    return body;
  } finally {
    // Always stop the timer, whether we succeeded or failed.
    clearTimeout(timer);
  }
}
