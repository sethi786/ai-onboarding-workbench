/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Using a relative base so the static build works from any sub-path
// (GitHub Pages project sites, S3 prefixes, etc.). HashRouter handles routing.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
