// useTheme.js — dark mode 全局适配（Vant + 自定义组件）

import { ref } from 'vue'

const STORAGE_KEY = 'theme_prefs'
const darkMode = ref(false)
const isInitialized = ref(false)

const DARK_VARS = {
  // 背景层级：body → 卡片 → 更深
  '--bg': '#121212',
  '--bg-card': '#1E1E1E',
  '--bg-overlay': 'rgba(0, 0, 0, 0.75)',
  // 文字：非纯白减少光渗
  '--text': '#ECECEC',
  '--text-secondary': '#9B9B9E',
  '--text-tertiary': '#6A6A6E',
  // 边框：低透明度白色
  '--border': 'rgba(255, 255, 255, 0.08)',
  '--border-light': 'rgba(255, 255, 255, 0.05)',
  // 表面白
  '--white': '#121212',
  // 浅色态底色（dark 下需调暗）
  '--warm-pink': '#1E1618',
  '--cream': '#161616',
  '--peach': '#1A1416',
  // 漂浮爱心 dark 色系
  '--heart-color': 'rgba(196, 107, 125, 0.20)',
  // 阴影（dark 下更深）
  '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.5)',
  '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.6)',
  '--shadow-lg': '0 8px 30px rgba(0, 0, 0, 0.7)',
  // 按钮（低亮度品牌色）
  '--primary': '#C46B7D',
  '--primary-light': '#D98EA0',
  '--primary-dark': '#A65566',
  // Vant 组件适配
  '--van-primary-color': '#C46B7D',
  '--van-primary-color-light': '#D98EA0',
  '--van-primary-color-dark': '#A65566',
  '--van-tabbar-background-color': '#1A1A1A',
  '--van-tabbar-item-color': '#9B9B9E',
  '--van-tabbar-item-active-color': '#C46B7D',
  '--van-background-2': '#1A1A1A',
  '--van-background-3': '#1E1E1E',
  '--van-cell-background': '#1E1E1E',
  '--van-cell-border-color': 'rgba(255, 255, 255, 0.06)',
  '--van-cell-value-color': '#9B9B9E',
  '--van-dialog-background': '#252525',
  '--van-toast-text-color': '#ECECEC',
  '--van-toast-background': '#2C2C2C',
  '--van-picker-background': '#252525',
  '--van-picker-mask-color': 'rgba(0,0,0,0.7)',
  '--van-field-input-text-color': '#ECECEC',
  '--van-field-label-color': '#9B9B9E',
}

function applyTheme() {
  const root = document.documentElement
  if (darkMode.value) {
    Object.entries(DARK_VARS).forEach(([k, v]) => root.style.setProperty(k, v))
    root.dataset.theme = 'dark'
  } else {
    Object.keys(DARK_VARS).forEach(k => root.style.removeProperty(k))
    root.dataset.theme = 'light'
  }
}

function toggleDarkMode() {
  darkMode.value = !darkMode.value
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ dark: darkMode.value }))
  } catch (e) {}
  applyTheme()
}

function initTheme() {
  if (isInitialized.value) return
  isInitialized.value = true
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const prefs = JSON.parse(stored)
      darkMode.value = prefs.dark || false
    }
  } catch (e) {}
  applyTheme()
}

export function useTheme() {
  initTheme()
  return { isDark: darkMode, toggleDarkMode }
}
