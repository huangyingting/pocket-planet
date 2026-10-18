import { defineConfig } from 'vite';

// BASE_PATH: URL prefix when hosted below the domain root, e.g. "/pocket-planet/" on GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5173, proxy: { '/api': 'http://localhost:8787' } },
  build: { target: 'es2022', chunkSizeWarningLimit: 1200 },
});
