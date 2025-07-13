import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  // This ensures environment variables are available during build and preview
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    define: {
      'process.env': {},
      // Make environment variables available to the client-side code
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY)
    },
    envPrefix: 'VITE_',
    base: '/',
    plugins: [
      react(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
            VITE_SUPABASE_ANON_KEY: env.VITE_SUPABASE_ANON_KEY
          }
        }
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
        manifest: {
          name: 'Family Chat',
          short_name: 'FamilyChat',
          description: 'A family chat application',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // Ensure the service worker is properly scoped
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          // Don't cache the service worker itself
          skipWaiting: true,
          clientsClaim: true,
        },
      })
    ],
    server: {
      host: true,
      port: 3000,
      strictPort: true,
      hmr: {
        port: 3000,
        clientPort: 3000,
        host: 'localhost',
        path: '/ws'
      }
    },
    preview: {
      port: 3000,
      strictPort: true
    },
    build: {
      // Ensure environment variables are replaced during build
      // and not evaluated at runtime
      target: 'esnext',
      sourcemap: true
    }
  };
});
