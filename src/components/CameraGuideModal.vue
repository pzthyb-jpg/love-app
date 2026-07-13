<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click.self="$emit('close')">
      <div class="dialog-box camera-guide-box">
        <div class="camera-guide-emoji">📸</div>
        <h3>需要摄像头权限才能哦</h3>
        <p class="camera-guide-desc">在系统设置中允许本应用使用摄像头</p>
        <div class="camera-guide-steps">
          <p>iPhone: 设置 → 隐私 → 相机 → 找到本应用</p>
          <p>Android: 设置 → 应用 → 权限 → 相机</p>
        </div>
        <div class="camera-guide-actions">
          <van-button type="default" @click="$emit('close')">知道了</van-button>
          <van-button type="primary" @click="$emit('openSettings')">前往设置</van-button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false }
})

defineEmits(['close', 'openSettings'])
</script>

<style scoped>
.camera-guide-box {
  text-align: center;
}
.camera-guide-emoji {
  font-size: 48px;
  margin-bottom: var(--space-sm);
}
.camera-guide-desc {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-bottom: var(--space-md);
}
.camera-guide-steps {
  text-align: left;
  background: var(--warm-pink);
  padding: var(--space-md);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-lg);
}
.camera-guide-steps p {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  line-height: 1.6;
}
.camera-guide-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
}
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dialog-box {
  background: var(--white);
  border-radius: 16px;
  width: 85%;
  max-width: 360px;
  padding: var(--space-2xl);
}
.dialog-box h3 {
  font-size: var(--font-h2);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-sm);
}
</style>
