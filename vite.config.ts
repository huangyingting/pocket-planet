import { defineConfig } from 'vite';

// BASE_PATH: URL prefix when hosted below the domain root, e.g. "/pocket-planet/" on GitHub Pages.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  server: { port: 5173, proxy: { '/api': 'http://localhost:8787' } },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    // three.js changes rarely: keep it in its own long-cached chunk, separate from app code.
    rollupOptions: { output: { manualChunks: id => (id.includes('/node_modules/three/') ? 'three' : undefined) } },
  },
  // module workers so the model builder worker can lazy-load hero packs (import.meta.glob code-splitting)
  worker: { format: 'es' },
});
