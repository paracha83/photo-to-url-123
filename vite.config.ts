import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const hmrHost = process.env.HMR_HOST || undefined;
  const hmrClientPort = process.env.HMR_CLIENT_PORT
    ? Number(process.env.HMR_CLIENT_PORT)
    : undefined;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      hmr: {
        overlay: false, // Suppress error overlay popup on connection issues
        ...(hmrHost ? { host: hmrHost } : {}),
        ...(hmrClientPort ? { clientPort: hmrClientPort } : {}),
      },
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
