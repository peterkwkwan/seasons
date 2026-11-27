import { defineConfig } from 'vite';

/**
 * Project Pages URL: https://peterkwkwan.github.io/seasons/portal/
 * (repo renamed seasons; github.com/peterkwkwan/femm redirects there)
 */
export default defineConfig({
  base: '/seasons/portal/',
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
  appType: 'spa',
});
