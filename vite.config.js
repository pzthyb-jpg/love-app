import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: './',
  plugins: [vue(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
    manifest: {
      name: '小皮爱情助手',
      short_name: '小皮',
      description: '记录我们的每一个甜蜜时刻 💕',
      theme_color: '#F5F5F7',
      background_color: '#F5F5F7',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      navigateFallback: 'index.html',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
    },
  }), cloudflare()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})