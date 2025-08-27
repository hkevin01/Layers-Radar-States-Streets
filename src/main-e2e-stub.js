// Lightweight E2E stub for accidental /src/main.js imports.
// Ensures tests don't execute the full app bootstrap when only public/index.html is intended.

console.warn('[E2E Stub] /src/main.js import intercepted via import map. No-op module loaded.');

export function initializeApp() {
  console.warn('[E2E Stub] initializeApp() called; returning null.');
  return null;
}

export function init_load() { return initializeApp(); }
export function getMapComponent() { return null; }
export function isInitialized() { return !!(window.map || (window.mapComponent && window.mapComponent.map)); }
export function isFullyInitialized() { return isInitialized(); }
export function getPerformanceReport() {
  try { return window.performanceOptimizer && window.performanceOptimizer.getPerformanceReport ? window.performanceOptimizer.getPerformanceReport() : null; } catch (_) { return null; }
}
export function toggleFeature() {}
export function cleanup() {}

// Expose stubs globally to avoid ReferenceErrors
if (typeof window !== 'undefined') {
  window.initializeApp = initializeApp;
  window.init_load = init_load;
  window.getMapComponent = getMapComponent;
  window.isInitialized = isInitialized;
  window.isFullyInitialized = isFullyInitialized;
  window.getPerformanceReport = getPerformanceReport;
  window.toggleFeature = toggleFeature;
  window.cleanup = cleanup;
}
