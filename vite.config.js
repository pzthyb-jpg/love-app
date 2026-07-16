import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    vue(),
    VitePWA({
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
        // 跳过等待，立即激活新版本
        skipWaiting: true,
        clientsClaim: true,
        // 重要：更新 SW 时强制刷新所有客户端
        cleanupOutdatedCaches: true,
        // 网络优先，减少缓存失效问题
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
