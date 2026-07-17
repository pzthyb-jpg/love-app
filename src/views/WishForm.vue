<template>
  <div class="page page-anniversary-form">
    <!-- 顶部导航 -->
    <div class="form-header">
      <button class="back-btn" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1 class="form-title">新增许愿/吐槽</h1>
      <div class="header-spacer"></div>
    </div>

    <!-- 表单内容 -->
    <div class="form-body">
      <!-- 类型选择 -->
      <div class="form-group">
        <label>类型</label>
        <div class="type-options">
          <button
            v-for="opt in TYPE_OPTIONS"
            :key="opt.value"
            :class="['type-btn', { active: form.type === opt.value }]"
            @click="form.type = opt.value"
          >
            {{ opt.emoji }} {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- 内容 -->
      <div class="form-group">
        <label>内容 <span class="required">*</span></label>
        <textarea
          v-model="form.text"
          :class="['form-textarea', { error: formError }]"
          :placeholder="form.type === 'wish' ? '写下你的愿望吧...' : '写下你要吐槽的...'"
          rows="4"
          maxlength="200"
          @input="formError = ''"
        ></textarea>
        <div v-if="formError" class="error-text">{{ formError }}</div>
        <div class="text-count">{{ form.text.length }}/200</div>
      </div>
    </div>

    <!-- 底部固定保存按钮 -->
    <div class="form-footer">
      <van-button type="primary" round block @click="onSave">保存</van-button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useDataStore } from '../stores/dataStore.js'
import { getTodayStr } from '../composables/useStreak.js'

const router = useRouter()
const { addWish } = useDataStore()

// 类型选项
const TYPE_OPTIONS = [
  { value: 'wish', label: '许愿', emoji: '✨' },
  { value: 'vent', label: '吐槽', emoji: '😤' }
]

// 表单状态
const formError = ref('')
const form = reactive({
  type: 'wish',
  text: ''
})

// 保存
async function onSave() {
  const text = form.text.trim()
  if (!text) {
    formError.value = '请输入内容'
    return
  }

  const now = new Date()
  const wish = {
    text,
    type: form.type,
    time: now.toISOString(),
    timeStr: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    dateStr: getTodayStr(),
    fulfilled: false,
    fulfilledBy: null
  }

  const result = await addWish(wish)
  if (result.data) {
    showToast({ message: form.type === 'wish' ? '✨ 愿望已许下！' : '😤 吐槽已记录！', type: 'success' })
    router.back()
  } else {
    showToast({ message: result.error?.message || '保存失败', type: 'fail' })
  }
}
</script>

<style scoped>
.page-anniversary-form {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding-bottom: 90px;
}

/* === Header === */
.form-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  padding: 0 var(--space-md);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--primary);
  cursor: pointer;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.back-btn:hover {
  background: rgba(232, 117, 138, 0.08);
}

.back-btn:active {
  background: rgba(232, 117, 138, 0.15);
}

.form-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.header-spacer {
  width: 36px;
}

/* === Body (scrollable form) === */
.form-body {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

/* === Form groups === */
.form-group {
  margin-bottom: var(--space-xl);
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.required {
  color: var(--primary);
}

/* Textarea */
.form-textarea {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-family: inherit;
  background: var(--bg);
  color: var(--text);
  resize: vertical;
  transition: border-color 0.2s ease;
  outline: none;
  box-sizing: border-box;
}

.form-textarea:focus {
  border-color: var(--primary);
}

.form-textarea.error {
  border-color: #E8758A;
}

.form-textarea::placeholder {
  color: var(--text-hint);
  opacity: 0.3;
}

/* Error text */
.error-text {
  margin-top: 6px;
  font-size: 13px;
  color: #E8758A;
}

/* Character count */
.text-count {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}

/* === Type options === */
.type-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.type-btn.active {
  border-color: var(--primary);
  background: rgba(232, 117, 138, 0.08);
  color: var(--primary);
}

/* === Footer (fixed bottom save) === */
.form-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: var(--space-md) var(--space-lg);
  padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
  background: var(--bg-card);
  border-top: 1px solid var(--border-light);
  z-index: 99;
}

.form-footer :deep(.van-button) {
  max-width: 400px;
  margin: 0 auto;
}
</style>
