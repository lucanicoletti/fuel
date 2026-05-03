import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set BASE_PATH at build time for GitHub Pages sub-path deploy.
// Locally: leave unset → '/'. CI: set to '/<repo-name>/' before `vite build`.
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { port: 5173 },
});
