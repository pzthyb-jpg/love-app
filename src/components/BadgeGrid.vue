<template>
  <div class="card badge-section">
    <h3>🏆 成就徽章</h3>
    <div class="badge-grid">
      <div
        v-for="badge in badges"
        :key="badge.id"
        class="badge-item"
        :class="{ earned: badge.earned }"
      >
        <div class="badge-icon" :style="{ background: badge.earned ? badge.color : 'var(--warm-pink)' }">
          {{ badge.emoji }}
        </div>
        <div class="badge-name">{{ badge.name }}</div>
        <div class="badge-days">{{ badge.days }}天</div>
      </div>
    </div>
    <div v-if="next" class="badge-progress">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (next.progress * 100) + '%' }"></div>
      </div>
      <span class="progress-text">下一个: {{ next.name }} {{ next.emoji }} (还差 {{ next.remainingDays }} 天)</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  badges: { type: Array, default: () => [] },
  next: { type: Object, default: null }
})
</script>

<style scoped>
.badge-section h3 {
  font-size: var(--font-h3);
  font-weight: 600;
  margin-bottom: var(--space-lg);
}
.badge-grid {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}
.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  opacity: 0.5;
  transition: opacity var(--transition-normal);
}
.badge-item.earned {
  opacity: 1;
}
.badge-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.badge-name {
  font-size: var(--font-caption);
  font-weight: 500;
}
.badge-days {
  font-size: var(--font-badge);
  color: var(--text-secondary);
}
.badge-progress {
  margin-top: var(--space-md);
}
.progress-bar {
  height: 6px;
  background: var(--warm-pink);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.5s ease;
}
.badge-progress .progress-text {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
  display: block;
}
</style>
