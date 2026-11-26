import { defineConfig } from 'vite';

/** SPA history fallback so deep links like /invite/demo work in preview. */
export default defineConfig({
  server: {
    port: 5173,
  },
  preview: {
    port: 5173,
  },
  appType: 'spa',
});
