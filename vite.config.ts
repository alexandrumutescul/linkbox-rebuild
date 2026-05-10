import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const serverPort = Number(process.env.PORT ?? 3000);

export default defineConfig({
  plugins: [react()],
  root: '.',
  appType: 'spa',
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
  server: {
    middlewareMode: false,
    proxy: {
      '/api': {
        target: `http://localhost:${serverPort}`,
        changeOrigin: true,
      },
    },
  },
});
