// useTheme.js — 仅保留 dark mode

import { ref, watch } from 'vue'

const STORAGE_KEY = 'theme_prefs'
const darkMode = ref(false)
const isInitialized = ref(false)

const DARK_VARS = {
  '--bg': '#1D1D1F',
  '--bg-card': '#2C2C2E',
  '--bg-overlay': 'rgba(0, 0, 0, 0.6)',
  '--text': '#F5F5F7',
  '--text-secondary': '#A1A1A6',
  '--text-tertiary': '#636366',
  '--border': '#3A3A3C',
  '--border-light': '#2C2C2E',
  '--white': '#1D1D1F',
  '--warm-pink': '#2A1E20',
  '--cream': '#1F1F1F',
  '--peach': '#2D1E20',
  '--shadow-sm': '0 1px 3px rgba(0, 0, 0, 0.3)',
  '--shadow-md': '0 4px 12px rgba(0, 0, 0, 0.4)',
  '--shadow-lg': '0 8px 30px rgba(0, 0, 0, 0.5)',
  '--van-cell-background': '#2C2C2E',
  '--van-cell-border-color': '#3A3A3C',
  '--van-cell-value-color': '#A1A1A6',
  '--van-dialog-background': '#2C2C2E',
  '--van-toast-text-color': '#F5F5F7',
  '--van-toast-background': '#2C2C2E',
  '--van-picker-background': '#2C2C2E',
  '--van-picker-mask-color': 'rgba(0,0,0,0.6)',
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
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ dark: darkMode.value }))
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
