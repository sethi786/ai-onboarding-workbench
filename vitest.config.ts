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
      // `server-only` throws outside a Next.js server bundle. It's a build-time
      // guard, not behaviour, so tests substitute a no-op to reach the modules
      // it protects.
      'server-only': fileURLToPath(new URL('./test/server-only-stub.ts', import.meta.url)),
    },
  },
});
