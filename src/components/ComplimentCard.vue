<template>
  <div v-if="compliment" class="card compliment-card">
    <div class="compliment-header">✨ 今日夸夸</div>
    <p class="compliment-text">"{{ compliment }}"</p>
    <p class="compliment-time">{{ time }} · 已存档</p>
  </div>
</template>

<script setup>
defineProps({
  compliment: { type: String, default: '' },
  time: { type: String, default: '' }
})
</script>

<style scoped>
.compliment-card {
  background: linear-gradient(135deg, var(--warm-pink), var(--cream));
  animation: complimentGlow 2s ease-in-out infinite alternate;
}
@keyframes complimentGlow {
  from { box-shadow: 0 2px 8px rgba(232, 117, 138, 0); }
  to { box-shadow: 0 2px 16px rgba(232, 117, 138, 0.12); }
}
.compliment-header {
  font-size: var(--font-body-small);
  color: var(--primary);
  font-weight: 600;
  margin-bottom: var(--space-sm);
}
.compliment-text {
  font-size: var(--font-h3);
  line-height: 1.6;
  color: var(--text);
}
.compliment-time {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: var(--space-sm);
}
</style>
