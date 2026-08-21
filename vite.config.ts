import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// GitHub Pages serves the app from /upkeep-app/ — that's why `base` is set.
// In dev (npm run dev), `base` is ignored and the app runs at /.
export default defineConfig({
  plugins: [react()],
  base: '/upkeep-app/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
});
