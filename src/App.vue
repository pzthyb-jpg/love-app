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
      <router-view v-slot="{ Component }">
        <transition name="page-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
      <van-tabbar route>
        <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
        <van-tabbar-item to="/photo" icon="photograph">拍照</van-tabbar-item>
        <van-tabbar-item to="/lunch" icon="bag-o">午餐</van-tabbar-item>
        <van-tabbar-item to="/wish" icon="star-o">愿望</van-tabbar-item>
      </van-tabbar>
    </template>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'

const hasError = ref(false)
const errorInfo = ref(null)

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
</style>
