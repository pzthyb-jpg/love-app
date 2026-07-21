<template>
  <div class="card photo-wall-section">
    <div class="section-header">
      <h3>📅 回忆照片墙</h3>
      <span class="section-subtitle">最近 {{ photos.length }} 天</span>
    </div>
    <div v-if="photos.length > 0" class="photo-grid">
      <div
        v-for="(item, index) in photos"
        :key="item.id || item.owner + '-' + item.date"
        class="photo-thumb"
        @click="$emit('open', index)"
      >
        <img :src="item.photo" :alt="item.date" loading="lazy" />
        <span v-if="item.ownerName" class="owner-badge" :class="item.owner">{{ item.ownerName }}</span>
      </div>
    </div>
    <div v-else class="empty-state" style="padding:var(--space-lg)">
      <p>还没有打卡记录哦，开始打卡吧 📸</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  photos: { type: Array, default: () => [] }
})

defineEmits(['open'])
</script>

<style scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}
.section-header h3 {
  font-size: var(--font-h3);
  font-weight: 600;
}
.section-subtitle {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}
.photo-thumb {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  background: var(--warm-pink);
  animation: thumbFadeIn 0.35s ease both;
  position: relative;
}
.photo-thumb:nth-child(1) { animation-delay: 0ms; }
.photo-thumb:nth-child(2) { animation-delay: 40ms; }
.photo-thumb:nth-child(3) { animation-delay: 80ms; }
.photo-thumb:nth-child(4) { animation-delay: 120ms; }
.photo-thumb:nth-child(5) { animation-delay: 160ms; }
.photo-thumb:nth-child(6) { animation-delay: 200ms; }
.photo-thumb:nth-child(7) { animation-delay: 240ms; }
.photo-thumb:nth-child(8) { animation-delay: 280ms; }
.photo-thumb:nth-child(9) { animation-delay: 320ms; }
.photo-thumb:nth-child(n+10) { animation-delay: 360ms; }
@keyframes thumbFadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}
.photo-thumb:active {
  transform: scale(0.92);
}
.photo-thumb:active img {
  transform: scale(1.05);
}

/* 属主角标（区分两人照片） */
.owner-badge {
  position: absolute;
  left: 4px;
  bottom: 4px;
  max-width: calc(100% - 8px);
  padding: 2px 7px;
  border-radius: var(--radius-round);
  font-size: 10px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  backdrop-filter: blur(4px);
  pointer-events: none;
}
.owner-badge.me {
  background: rgba(0, 0, 0, 0.45);
  color: #FFFFFF;
}
.owner-badge.partner {
  background: rgba(232, 117, 138, 0.85);
  color: #FFFFFF;
}
</style>
