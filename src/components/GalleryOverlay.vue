<template>
  <Teleport to="body">
    <div v-if="visible" class="gallery-overlay" @click.self="$emit('close')">
      <div class="gallery-close" @click="$emit('close')" role="button" aria-label="关闭">✕</div>
      <van-swipe ref="swipeRef" :loop="false" :show-indicators="true" class="gallery-swipe">
        <van-swipe-item v-for="(item, idx) in photos" :key="idx" class="gallery-slide">
          <img :src="item.photo" :alt="item.date" />
          <div class="gallery-info">
            <p>{{ item.date }}</p>
            <p>{{ item.compliment }}</p>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  photos: { type: Array, default: () => [] },
  initialIndex: { type: Number, default: 0 }
})

defineEmits(['close'])

const swipeRef = ref(null)

watch(() => props.visible, async (val) => {
  if (val) {
    await nextTick()
    if (swipeRef.value) {
      swipeRef.value.swipeTo(props.initialIndex)
    }
  }
})
</script>

<style scoped>
.gallery-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.gallery-close {
  position: absolute;
  top: calc(var(--safe-top) + var(--space-md));
  right: var(--space-lg);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 18px;
  z-index: 10;
  cursor: pointer;
}
.gallery-swipe {
  width: 100%;
  height: 80vh;
}
.gallery-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.gallery-slide img {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}
.gallery-info {
  text-align: center;
  margin-top: var(--space-lg);
  color: rgba(255,255,255,0.8);
}
.gallery-info p {
  font-size: var(--font-body);
  line-height: 1.5;
}
</style>
