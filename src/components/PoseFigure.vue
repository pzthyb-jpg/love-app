<template>
  <svg
    class="pose-figure"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    stroke-width="3"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-for="(s, i) in pose.shapes" :key="i">
      <circle v-if="s.tag === 'circle'" :cx="s.cx" :cy="s.cy" :r="s.r" />
      <path v-else-if="s.tag === 'path'" :d="s.d" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  pose: { type: Object, required: true }
})
</script>

<style scoped>
.pose-figure {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
