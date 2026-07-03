<template>
  <div class="toast-container">
    <div
      v-for="item in toasts"
      :key="item.id"
      class="toast"
      :class="[item.class, item.visible ? 'show' : 'hide']"
    >
      {{ item.message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

function showToast(message, type = 'info', duration = 2500) {
  const id = ++toastId
  const typeMap = {
    success: 'toast-success',
    error: 'toast-error',
    info: 'toast-info'
  }
  
  toasts.value.push({
    id,
    message,
    class: typeMap[type] || typeMap.info,
    visible: false
  })
  
  // 触发动画
  requestAnimationFrame(() => {
    const item = toasts.value.find(t => t.id === id)
    if (item) item.visible = true
  })
  
  // 自动消失
  setTimeout(() => {
    const item = toasts.value.find(t => t.id === id)
    if (item) {
      item.visible = false
      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 300)
    }
  }, duration)
}

// 暴露到全局，方便所有组件使用
window.__showToast = showToast

defineExpose({ showToast })
</script>
