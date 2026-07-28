import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// Covers the framework-agnostic engine (regression anchor) and the pure
// entitlement logic that gates paid features.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['workbench/**/*.test.ts', 'lib/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
});
