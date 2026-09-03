import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Workout Log',
        short_name: 'Workout',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0b0f',
        theme_color: '#0b0b0f',
        icons: [
          { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [{ name: 'Mulai latihan', url: '/session/new' }],
      },
      workbox: {
        // Tidak ada API eksternal, jadi seluruh app shell di-precache
        // dan tidak diperlukan strategi caching runtime.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
      },
      // Service worker sengaja tidak aktif saat `npm run dev` (default
      // devOptions.enabled: false) — kalau aktif, setiap rebuild dev
      // dianggap "versi baru" dan memicu prompt reload terus-menerus.
      // Untuk uji perilaku PWA, pakai `npm run build && npm run preview`.
    }),
  ],
})
