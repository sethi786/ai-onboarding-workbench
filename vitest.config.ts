import { defineConfig } from 'vitest/config';

// Runs the ported, framework-agnostic engine tests as a regression anchor.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['workbench/**/*.test.ts'],
  },
});
