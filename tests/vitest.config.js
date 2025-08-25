import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/vitest.setup.js'],
  include: ['tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
  exclude: ['node_modules', 'dist', 'tests/e2e', 'tests/cypress', 'tests/selenium', 'tests/legacy/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './tests/reports/coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.{test,spec}.{js,ts}',
        '**/test-setup.js',
        '**/quick-test.js'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    isolate: true,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4
      }
    },
    reporters: [
      'default',
      'json',
      'html'
    ],
    outputFile: {
      json: './tests/reports/vitest/results.json',
      html: './tests/reports/vitest/index.html'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@components': path.resolve(__dirname, '../src/components'),
      '@utils': path.resolve(__dirname, '../src/utils')
    }
  },
  define: {
    global: 'globalThis'
  }
});
