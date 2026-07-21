// useTheme.js — dark mode 全局适配（Vant + 自定义组件）

import { ref } from 'vue'

const STORAGE_KEY = 'theme_prefs'
const darkMode = ref(false)
const isInitialized = ref(false)

// iOS 深色模式标准配色（参考 Apple HIG Dark Mode）
const DARK_VARS = {
  // 背景层级：systemGroupedBackground(黑) → 卡片(#1C1C1E) → 更高层(#2C2C2E)
  '--bg': '#000000',
  '--bg-card': '#1C1C1E',
  '--bg-overlay': 'rgba(0, 0, 0, 0.75)',
  '--bg-grouped': '#000000',
  '--bg-elevated': '#2C2C2E',
  // 文字：iOS label 层级（非纯白减少光渗）
  '--text': '#F2F2F7',
  '--text-primary': '#F2F2F7',
  '--text-secondary': 'rgba(235, 235, 245, 0.6)',
  '--text-tertiary': 'rgba(235, 235, 245, 0.3)',
  '--text-light': 'rgba(235, 235, 245, 0.3)',
  '--text-hint': 'rgba(235, 235, 245, 0.4)',
  // 边框：iOS separator
  '--border': 'rgba(84, 84, 88, 0.65)',
  '--border-light': 'rgba(84, 84, 88, 0.35)',
  // 表面白 → 深色浮层
  '--white': '#1C1C1E',
  // 浅色态底色（dark 下调暗）
  '--warm-pink': '#251A1D',
  '--cream': '#1C1C1E',
  '--peach': '#231A1C',
  // 强调色（深色下提亮保证对比度）
  '--coral': '#FB7185',
  '--purple': '#A78BFA',
  '--gold': '#FBBF24',
  '--danger': '#FF453A',
  '--wish': '#A78BFA',
  '--vent': '#FB7185',
  '--done': '#30D158',
  '--achieve': '#FBBF24',
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
  '--van-background': '#000000',
  '--van-background-2': '#1C1C1E',
  '--van-background-3': '#2C2C2E',
  '--van-tabbar-background-color': '#1C1C1E',
  '--van-tabbar-item-color': 'rgba(235, 235, 245, 0.6)',
  '--van-tabbar-item-active-color': '#D98EA0',
  '--van-cell-background': '#1C1C1E',
  '--van-cell-border-color': 'rgba(84, 84, 88, 0.35)',
  '--van-cell-value-color': 'rgba(235, 235, 245, 0.6)',
  '--van-cell-text-color': '#F2F2F7',
  '--van-dialog-background': '#2C2C2E',
  '--van-dialog-header-text-color': '#F2F2F7',
  '--van-dialog-message-text-color': 'rgba(235, 235, 245, 0.8)',
  '--van-toast-text-color': '#F2F2F7',
  '--van-toast-background': '#2C2C2E',
  '--van-picker-background': '#2C2C2E',
  '--van-picker-mask-color': 'rgba(0,0,0,0.7)',
  '--van-picker-option-text-color': '#F2F2F7',
  '--van-field-input-text-color': '#F2F2F7',
  '--van-field-label-color': 'rgba(235, 235, 245, 0.6)',
  '--van-field-placeholder-text-color': 'rgba(235, 235, 245, 0.3)',
  '--van-button-plain-background': 'transparent',
  '--van-text-color': '#F2F2F7',
  '--van-text-color-2': 'rgba(235, 235, 245, 0.6)',
  '--van-text-color-3': 'rgba(235, 235, 245, 0.3)',
  '--van-border-color': 'rgba(84, 84, 88, 0.35)',
  '--van-active-color': 'rgba(255, 255, 255, 0.08)',
  '--van-switch-active-color': '#30D158',
  '--van-switch-background': 'rgba(120, 120, 128, 0.32)',
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
