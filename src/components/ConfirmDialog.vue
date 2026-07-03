<template>
  <Teleport to="body">
    <div v-if="visible" class="dialog-overlay" @click.self="cancel">
      <div class="dialog-box">
        <h3>{{ title }}</h3>
        <p>{{ message }}</p>
        <div class="dialog-actions">
          <button class="btn btn-secondary btn-small" @click="cancel">取消</button>
          <button class="btn btn-primary btn-small" @click="confirm">确定</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const title = ref('')
const message = ref('')
let resolveCallback = null

function show(t, m) {
  title.value = t
  message.value = m
  visible.value = true
  return new Promise((resolve) => {
    resolveCallback = resolve
  })
}

function confirm() {
  visible.value = false
  if (resolveCallback) resolveCallback(true)
}

function cancel() {
  visible.value = false
  if (resolveCallback) resolveCallback(false)
}

defineExpose({ show })
</script>
