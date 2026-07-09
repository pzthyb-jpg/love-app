<template>
  <div id="love-app-root">
    <div v-if="hasError" class="error-boundary-page">
      <div class="error-content">
        <div class="error-emoji">⚠️</div>
        <h2>页面出了点问题</h2>
        <p class="error-info">请尝试刷新页面，如果问题持续，请联系开发者。</p>
        <button class="retry-btn" @click="reloadPage">🔄 刷新页面</button>
      </div>
    </div>
    <template v-else>
      <div v-if="routeLoading" class="skeleton-wrapper">
        <div class="skeleton-header"></div>
        <div class="sk-card"></div>
        <div class="sk-card"></div>
      </div>
      <router-view v-else v-slot="{ Component }">
        <transition name="page-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <van-tabbar route>
        <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item to="/photo" icon="photograph">拍照</van-tabbar-item>
        <van-tabbar-item to="/lunch" icon="bag-o">午餐</van-tabbar-item>
        <van-tabbar-item to="/wish" icon="star-o">愿望</van-tabbar-item>
        <van-tabbar-item to="/anniversary" icon="gift-o">纪念</van-tabbar-item>
        <van-tabbar-item to="/settings" icon="setting-o">设置</van-tabbar-item>
      </van-tabbar>
    </template>
    <!-- PWA 安装提示 -->
    <div v-if="showInstallBanner" class="pwa-install-banner">
      <span class="pwa-icon">📱</span>
      <div class="pwa-text">
        <div class="title">安装小皮爱情助手</div>
        <div class="desc">添加到主屏幕，像 App 一样使用</div>
      </div>
      <button class="pwa-btn" @click="installPWA">安装</button>
      <button class="pwa-close" @click="dismissInstallBanner">✕</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const hasError = ref(false)
const errorInfo = ref(null)
const routeLoading = ref(false)
const showInstallBanner = ref(false)
const deferredPrompt = ref(null)

// PWA 安装
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt.value = e
  const dismissed = localStorage.getItem('pwa_install_dismissed')
  if (!dismissed) {
    showInstallBanner.value = true
  }
})

async function installPWA() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt()
    const { outcome } = await deferredPrompt.value.userChoice
    deferredPrompt.value = null
    showInstallBanner.value = false
  }
}

function dismissInstallBanner() {
  showInstallBanner.value = false
  localStorage.setItem('pwa_install_dismissed', '1')
}

router.beforeEach((to, from, next) => {
  routeLoading.value = true
  next()
})

router.afterEach(() => {
  setTimeout(() => routeLoading.value = false, 150)
})

onErrorCaptured((err, instance, info) => {
  console.error('App 级错误捕获:', err, info)
  errorInfo.value = { message: err?.message, info }
  hasError.value = true
  return false
})

function reloadPage() {
  window.location.reload()
}
</script>

<style>
#love-app-root {
  max-width: 100%;
  overflow-x: hidden;
}

/* 页面切换动画 */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.25s ease;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 错误边界 */
.error-boundary-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  background: white;
  border-radius: 20px;
  padding: 40px 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  max-width: 320px;
}

.error-emoji {
  font-size: 60px;
  margin-bottom: 16px;
}

.error-content h2 {
  font-size: 20px;
  color: #333;
  margin: 0 0 12px;
}

.error-info {
  font-size: 14px;
  color: #666;
  margin: 0 0 24px;
  line-height: 1.5;
}

.retry-btn {
  background: linear-gradient(135deg, #ff758c, #ff7eb3);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 117, 140, 0.4);
  transition: transform 0.2s, box-shadow 0.2s;
}

.retry-btn:active {
  transform: scale(0.96);
  box-shadow: 0 2px 8px rgba(255, 117, 140, 0.3);
}

/* 骨架屏 */
.skeleton-wrapper {
  padding: 16px;
}
.skeleton-header {
  height: 200px;
  border-radius: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 12px;
  [data-theme="dark"] & {
    background: linear-gradient(90deg, #2C2C2E 25%, #3A3A3C 50%, #2C2C2E 75%);
  }
}
.sk-card {
  height: 80px;
  border-radius: 12px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 12px;
  [data-theme="dark"] & {
    background: linear-gradient(90deg, #2C2C2E 25%, #3A3A3C 50%, #2C2C2E 75%);
  }
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* PWA 安装提示 */
.pwa-install-banner {
  position: fixed;
  bottom: 60px;
  left: 12px;
  right: 12px;
  background: #fff;
  border-radius: 16px;
  padding: 12px 16px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 999;
}
.pwa-install-banner .pwa-icon { font-size: 28px; }
.pwa-install-banner .pwa-text { flex: 1; }
.pwa-install-banner .pwa-text .title { font-size: 13px; font-weight: 600; }
.pwa-install-banner .pwa-text .desc { font-size: 11px; color: #888; }
.pwa-install-banner .pwa-btn {
  background: var(--primary);
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.pwa-install-banner .pwa-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #ccc;
  cursor: pointer;
  padding: 4px;
}
</style>
