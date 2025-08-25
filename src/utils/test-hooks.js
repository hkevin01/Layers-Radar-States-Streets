import { jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-hooks';

/**
 * Custom hook testing utilities
 */

/**
 * Creates a mock function with jest
 * @param {Function} implementation - Optional implementation function
 * @returns {jest.MockedFunction} Mocked function
 */
export const createMockFunction = (implementation) => {
  return jest.fn(implementation);
};

/**
 * Renders a hook with optional wrapper
 * @param {Function} hook - Hook to test
 * @param {Object} options - Rendering options
 * @returns {Object} Hook result and utilities
 */
export const renderTestHook = (hook, options = {}) => {
  return renderHook(hook, options);
};

/**
 * Waits for hook to update
 * @param {Function} callback - Callback to execute
 */
export const actHook = async (callback) => {
  await act(async () => {
    callback();
  });
};

/**
 * Creates a test wrapper for React context providers
 * @param {React.Component} Provider - Context provider component
 * @param {Object} value - Provider value
 * @returns {Function} Wrapper component
 */
export const createContextWrapper = (Provider, value) => {
  return ({ children }) => {
    // Create element using createElement to avoid JSX syntax
    const React = window.React || {};
    if (React.createElement) {
      return React.createElement(Provider, { value }, children);
    }
    return null;
  };
};

/**
 * Mock timer utilities
 */
export const mockTimers = {
  setup: () => jest.useFakeTimers(),
  teardown: () => jest.useRealTimers(),
  advanceBy: (ms) => jest.advanceTimersByTime(ms),
  runAll: () => jest.runAllTimers()
};

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = {
  store: {},
  getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorage.store[key] = String(value);
  }),
  removeItem: jest.fn((key) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  })
};

/**
 * Setup mock localStorage
 */
export const setupMockLocalStorage = () => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
    writable: true
  });
};
