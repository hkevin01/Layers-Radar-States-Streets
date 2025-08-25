// Jest compatibility shim for Vitest
import { vi } from 'vitest';

if (!globalThis.jest) {
  globalThis.jest = {
    fn: vi.fn.bind(vi),
    spyOn: (obj, method) => vi.spyOn(obj, method),
    clearAllMocks: () => vi.clearAllMocks(),
    useFakeTimers: vi.useFakeTimers.bind(vi),
    useRealTimers: vi.useRealTimers.bind(vi),
    advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
    runAllTimers: vi.runAllTimers.bind(vi)
  };
}

export { }; // ESM noop

