/**
 * URL State Management Utility
 */

/**
 * Debounce function to limit the rate at which a function can fire.
 * @param {Function} fn - The function to debounce.
 * @param {number} ms - The delay in milliseconds.
 * @returns {Function} - The debounced function.
 */
export function debounce(fn, ms) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Encodes a JSON object into URL query parameters without page reload.
 * @param {Object} state - The state object to sync to the URL.
 */
export function syncUrlState(state) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, typeof value === 'object' ? JSON.stringify(value) : value);
    }
  });
  url.search = params.toString();
  window.history.replaceState(state, '', url.toString());
}

/**
 * Reads query parameters from the URL and returns a JSON object.
 * @returns {Object} - The state object parsed from the URL.
 */
export function getUrlState() {
  const params = new URLSearchParams(window.location.search);
  const state = {};
  for (const [key, value] of params.entries()) {
    try {
      // Try to parse as JSON to handle numbers, booleans, and objects/arrays
      state[key] = JSON.parse(value);
    } catch (e) {
      // Fallback to raw string if not valid JSON
      state[key] = value;
    }
  }
  return state;
}
