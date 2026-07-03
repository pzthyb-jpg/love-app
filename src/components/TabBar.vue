<template>
  <nav class="tabbar">
    <button
      v-for="(tab, index) in tabs"
      :key="tab.path"
      class="tab-item"
      :class="{ active: currentTab === index }"
      @click="switchTab(tab.path, index)"
    >
      <span class="icon">{{ tab.icon }}</span>
      <span class="label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'

const router = useRouter()
const route = useRoute()

const tabs = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/photo', label: '拍照', icon: '📸' },
  { path: '/lunch', label: '午餐', icon: '🍽️' },
  { path: '/wish', label: '愿望', icon: '✨' }
]

const currentTab = computed(() => {
  const tabMeta = route.meta?.tab
  return typeof tabMeta === 'number' ? tabMeta : -1
})

function switchTab(path, index) {
  if (currentTab.value === index) return
  hapticFeedback(null, HAPTIC_PATTERNS.LIGHT)
  router.push(path)
}
</script>
