<template>
  <div class="theme-preview-banner">
    <!-- 主题色预览 -->
    <div class="theme-color-row">
      <span class="theme-label">换肤主题</span>
      <div class="color-dots">
        <button
          v-for="(theme, key) in colorThemes"
          :key="key"
          class="color-dot"
          :class="{ active: colorTheme === key }"
          :style="{ background: theme.vars['--primary'] }"
          :title="theme.name"
          @click="selectColorTheme(key)"
        >
          <span class="dot-emoji">{{ theme.emoji }}</span>
          <span v-if="colorTheme === key" class="dot-check">✓</span>
        </button>
      </div>
    </div>

    <!-- 当前主题名 -->
    <div class="theme-current">
      <span class="current-emoji">{{ currentTheme.emoji }}</span>
      <span class="current-name">{{ currentTheme.name }}主题</span>
      <span class="current-mode">{{ isDark ? '🌙 暗夜模式' : '☀️ 白日模式' }}</span>
    </div>

    <!-- 预览小卡片 -->
    <div class="preview-cards">
      <div class="preview-card">
        <div class="preview-icon">💌</div>
        <div class="preview-text">宝贝，想你了～</div>
      </div>
      <div class="preview-card">
        <div class="preview-icon">📸</div>
        <div class="preview-text">今日打卡完成</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js'

const { colorThemes, colorTheme, currentTheme, isDark, selectColorTheme } = useTheme()
</script>

<style scoped>
.theme-preview-banner {
  margin: var(--space-md) 0;
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--warm-pink), var(--cream));
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.theme-color-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.theme-label {
  font-size: var(--font-h3);
  font-weight: 600;
  color: var(--text);
  flex-shrink: 0;
}

.color-dots {
  display: flex;
  gap: var(--space-sm);
  flex: 1;
  justify-content: flex-end;
}

.color-dot {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.color-dot:hover {
  transform: scale(1.1);
}

.color-dot.active {
  border-color: var(--text);
  transform: scale(1.15);
  box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 4px var(--text);
}

.dot-emoji {
  font-size: 14px;
  filter: drop-shadow(0 1px 1px rgba(0,0,0,0.2));
}

.dot-check {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: var(--bg-card);
  color: var(--primary);
  font-size: 10px;
  font-weight: 700;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

/* 当前主题信息 */
.theme-current {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  justify-content: center;
}

.current-emoji {
  font-size: 20px;
}

.current-name {
  font-weight: 600;
  color: var(--primary);
}

.current-mode {
  padding: 2px 8px;
  background: var(--bg-card);
  border-radius: var(--radius-round);
  font-size: var(--font-caption);
}

/* 预览卡片 */
.preview-cards {
  display: flex;
  gap: var(--space-sm);
}

.preview-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.preview-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.preview-text {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  line-height: 1.3;
}

/* Dark 模式适配 */
:global(html[data-theme="dark"]) .theme-preview-banner {
  background: linear-gradient(135deg, #2A1E20, #1F1F2F);
  border-color: var(--border);
}

:global(html[data-theme="dark"]) .preview-card {
  background: var(--bg-card);
  border-color: var(--border);
}
</style>
