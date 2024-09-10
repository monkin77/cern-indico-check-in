import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import viteTsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({mode}) => {
  // Currently our configuration only reads ENV variables which
  // are prefixed with 'VITE_' (default, for security reasons).
  const env = loadEnv(mode, process.cwd());

  return {
    base: '',
    plugins: [
      react(),
      viteTsconfigPaths(),
      VitePWA({
        // Generate service worker
        filename: 'service-worker.js',
        strategies: 'generateSW',
        injectRegister: 'auto',
        registerType: 'autoUpdate',
        workbox: {
          // Besides code, we have some other assets:
          // .png - logo.png
          // .mp3 - sound effects
          // .ttf - custom fonts
          globPatterns: ['**/*.{js,css,html,png,mp3,ttf}'],
          // Generate service worker source map
          sourcemap: true,
        },
        // Use manifest in public/manifest.json
        manifest: false,
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './vitest.setup.ts',
    },
    server: {
      open: true,
      port: parseInt(env.VITE_PORT || '3000', 10),
    },
    build: {
      cssCodeSplit: false,
    },
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  };
});
