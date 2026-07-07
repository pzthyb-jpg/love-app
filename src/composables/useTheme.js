// useTheme.js — 主题状态管理 composable
// 支持 light/dark 模式 + 4色主题换肤

import { ref, computed, watch } from 'vue'

// ─── 4 色主题定义 ───
export const COLOR_THEMES = {
  rose: {
    id: 'rose',
    name: '瑰粉',
    emoji: '🌹',
    vars: {
      '--primary': '#E8758A',
      '--primary-light': '#F4A5B5',
      '--primary-dark': '#D45D72',
      '--van-primary-color': '#E8758A',
      '--van-primary-color-light': '#F4A5B5',
      '--van-primary-color-dark': '#D45D72',
      '--van-tabbar-item-active-color': '#E8758A',
    }
  },
  violet: {
    id: 'violet',
    name: '紫藤',
    emoji: '💜',
    vars: {
      '--primary': '#A78BFA',
      '--primary-light': '#C4B5FD',
      '--primary-dark': '#8B5CF6',
      '--van-primary-color': '#A78BFA',
      '--van-primary-color-light': '#C4B5FD',
      '--van-primary-color-dark': '#8B5CF6',
      '--van-tabbar-item-active-color': '#A78BFA',
    }
  },
  sky: {
    id: 'sky',
    name: '蓝天',
    emoji: '💙',
    vars: {
      '--primary': '#60A5FA',
      '--primary-light': '#93C5FD',
      '--primary-dark': '#3B82F6',
      '--van-primary-color': '#60A5FA',
      '--van-primary-color-light': '#93C5FD',
      '--van-primary-color-dark': '#3B82F6',
      '--van-tabbar-item-active-color': '#60A5FA',
    }
  },
  mint: {
    id: 'mint',
    name: '抹茶',
    emoji: '🍵',
    vars: {
      '--primary': '#34D399',
      '--primary-light': '#6EE7B7',
      '--primary-dark': '#10B981',
      '--van-primary-color': '#34D399',
      '--van-primary-color-light': '#6EE7B7',
      '--van-primary-color-dark': '#10B981',
      '--van-tabbar-item-active-color': '#34D399',
    }
  },
}

// ─── Dark 模式 CSS 变量 ───
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

const DARK_VARS_KEYS = Object.keys(DARK_VARS)

// ─── 内部状态 ───
const STORAGE_KEY = 'theme_prefs'
const darkMode = ref(false)
const colorTheme = ref('rose')
const isInitialized = ref(false)

// ─── DOM 操作工具 ───
function applyVars(vars) {
  const root = document.documentElement
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value)
  }
}

function removeVars(keys) {
  const root = document.documentElement
  keys.forEach(function(k) { root.style.removeProperty(k) })
}

function setDarkMode(mode) {
  darkMode.value = mode
  if (mode) {
    applyVars(DARK_VARS)
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    removeVars(DARK_VARS_KEYS)
    document.documentElement.removeAttribute('data-theme')
  }
}

function setColorTheme(themeId) {
  if (!COLOR_THEMES[themeId]) return
  colorTheme.value = themeId
  applyVars(COLOR_THEMES[themeId].vars)
}

// ─── 持久化 ───
function savePrefs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      darkMode: darkMode.value,
      colorTheme: colorTheme.value,
    }))
  } catch (e) { /* ignore */ }
}

function loadPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const prefs = JSON.parse(raw)
      if (typeof prefs.darkMode === 'boolean') darkMode.value = prefs.darkMode
      if (prefs.colorTheme && COLOR_THEMES[prefs.colorTheme]) colorTheme.value = prefs.colorTheme
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      darkMode.value = !!prefersDark
    }
  } catch (e) {
    // ignore
  }
}

// ─── 公开 Composable ───
export function useTheme() {
  if (!isInitialized.value) {
    isInitialized.value = true
    loadPrefs()
    setColorTheme(colorTheme.value)
    setDarkMode(darkMode.value)
    savePrefs()
  }

  watch([darkMode, colorTheme], function() {
    savePrefs()
  })

  const themeAttrs = computed(function() {
    return {
      'data-theme': darkMode.value ? 'dark' : 'light',
      'data-color': colorTheme.value,
    }
  })

  function toggleDarkMode() {
    setDarkMode(!darkMode.value)
  }

  function selectColorTheme(id) {
    setColorTheme(id)
  }

  return {
    darkMode: darkMode,
    colorTheme: colorTheme,
    colorThemes: COLOR_THEMES,
    themeAttrs: themeAttrs,
    toggleDarkMode: toggleDarkMode,
    selectColorTheme: selectColorTheme,
    isDark: computed(function() { return darkMode.value }),
    currentTheme: computed(function() { return COLOR_THEMES[colorTheme.value] }),
  }
}
