<template>
  <div class="page page-anniversary-form">
    <!-- 顶部导航 -->
    <div class="form-header">
      <button class="back-btn" @click="router.back()">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <h1 class="form-title">{{ isEdit ? '编辑纪念日' : '添加纪念日' }}</h1>
      <div class="header-spacer"></div>
    </div>

    <!-- 表单内容 -->
    <div class="form-body">
      <!-- 名称 -->
      <div class="form-group">
        <label>名称 <span class="required">*</span></label>
        <div class="input-wrap">
          <input
            v-model="form.name"
            class="form-input"
            :class="{ error: formError, filled: form.name }"
            placeholder="给这个特殊的日子起个名字..."
            maxlength="20"
            @input="formError = ''"
          />
          <span class="input-watermark" v-if="!form.name">♡</span>
        </div>
        <div v-if="formError" class="error-text">{{ formError }}</div>
      </div>

      <!-- 类型 -->
      <div class="form-group">
        <label>类型 <span class="required">*</span></label>
        <div class="type-options">
          <button
            v-for="(config, key) in TYPES_CONFIG"
            :key="key"
            :class="['type-btn', { active: form.type === key }]"
            @click="form.type = key; form.emoji = config.emoji"
          >
            {{ config.emoji }} {{ config.label }}
          </button>
        </div>
      </div>

      <!-- 日期 -->
      <div class="form-group">
        <label>日期 <span class="required">*</span></label>
        <div class="date-field" :class="{ filled: form.date }" @click="showDatePicker = true">
          <span v-if="form.date" class="date-value">{{ form.date }}</span>
          <span v-else class="date-watermark">点击选择日期 📅</span>
          <svg class="date-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      </div>

      <!-- 备注 -->
      <div class="form-group">
        <label>备注</label>
        <div class="input-wrap">
          <textarea
            v-model="form.remark"
            class="form-textarea"
            :class="{ filled: form.remark }"
            placeholder="记录一下这天的美好记忆吧 💭"
            rows="3"
            maxlength="100"
          ></textarea>
          <span class="input-watermark textarea-wmark" v-if="!form.remark">💬</span>
        </div>
        <div class="char-count">{{ form.remark.length }}/100</div>
      </div>

      <!-- 提前提醒 -->
      <div class="form-group">
        <label>提前提醒</label>
        <div class="remind-checks">
          <label v-for="d in [1, 3, 7, 30]" :key="d" class="check-item">
            <input
              type="checkbox"
              :checked="form.remindDays.includes(d)"
              @change="toggleRemind(d)"
              class="remind-checkbox"
            />
            <span class="check-label">{{ d }} 天前</span>
          </label>
        </div>
        <p class="form-hint">纪念日当天与所选天数前将收到提醒 🔔</p>
      </div>
    </div>

    <!-- 底部固定保存按钮 -->
    <div class="form-footer">
      <van-button type="primary" round block @click="onSave" :loading="isSaving">
        {{ isSaving ? '保存中...' : '保存' }}
      </van-button>
    </div>

    <!-- 日期选择器弹窗 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        :model-value="selectedDate"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { useDataStore } from '../stores/dataStore.js'
import { useAnniversary } from '../composables/useAnniversary.js'

const router = useRouter()
const route = useRoute()
const store = useDataStore()
const {
  addAnniversary,
  updateAnniversary,
  TYPES_CONFIG
} = useAnniversary()

// 判断新增 / 编辑
const annId = route.params.id
const isEdit = !!annId

// 日期选择器
const showDatePicker = ref(false)
const today = new Date()
const minDate = new Date(1990, 0, 1)
const maxDate = new Date(2050, 11, 31)
const selectedDate = ref([today.getFullYear(), today.getMonth() + 1, today.getDate()])

// 表单状态
const formError = ref('')
const isSaving = ref(false)
const form = reactive({
  name: '',
  date: '',
  type: 'anniversary',
  emoji: '💕',
  remark: '',
  remindDays: [1, 3, 7]
})

// 编辑模式：从 store 加载数据
onMounted(() => {
  if (isEdit) {
    const item = store.state.anniversaries.find(a => a.id === annId)
    if (item) {
      form.name = item.name
      form.date = item.date
      form.type = item.type
      form.emoji = item.emoji
      form.remark = item.remark || ''
      form.remindDays = [...(item.remindDays || [3])]
    } else {
      showToast({ message: '未找到该纪念日', type: 'fail' })
      router.back()
    }
  }
})

// 保存
async function onSave() {
  if (!form.name.trim()) {
    formError.value = '请输入名称'
    return
  }
  if (!form.date) {
    showToast({ message: '请选择日期', type: 'fail' })
    return
  }

  isSaving.value = true
  const payload = {
    name: form.name.trim(),
    date: form.date,
    type: form.type,
    emoji: form.emoji,
    remark: form.remark.trim(),
    remindDays: form.remindDays
  }

  if (isEdit) {
    const result = await updateAnniversary(annId, payload)
    if (result.data) {
      showToast({ message: '已更新', type: 'success' })
      router.back()
    } else {
      showToast({ message: result.error?.message || '保存失败', type: 'fail' })
    }
  } else {
    const result = await addAnniversary(payload)
    if (result.data) {
      showToast({ message: `已添加 ${form.emoji}`, type: 'success' })
      router.back()
    } else {
      showToast({ message: result.error?.message || '保存失败', type: 'fail' })
    }
  }
  isSaving.value = false
}

// 日期确认
function onDateConfirm({ selectedValues }) {
  const [year, month, day] = selectedValues
  const y = typeof year === 'number' ? year : parseInt(year)
  const m = typeof month === 'number' ? month : parseInt(month)
  const d = typeof day === 'number' ? day : parseInt(day)
  form.date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  showDatePicker.value = false
}

// 切换提醒天数
function toggleRemind(day) {
  const idx = form.remindDays.indexOf(day)
  if (idx >= 0) {
    form.remindDays.splice(idx, 1)
  } else {
    form.remindDays.push(day)
    form.remindDays.sort((a, b) => a - b)
  }
}
</script>

<style scoped>
/* === Layout === */
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

.form-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.header-spacer { width: 36px; }

/* === Body === */
.form-body {
  flex: 1;
  padding: var(--space-lg);
  overflow-y: auto;
}

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

/* === Input with watermark === */
.input-wrap {
  position: relative;
}
/* Input */
.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 15px;
  font-family: inherit;
  background: rgba(255, 255, 255, 0.5);
  color: var(--text);
  transition: border-color 0.2s ease, background 0.2s ease;
  outline: none;
  box-sizing: border-box;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.form-input:focus {
  border-color: var(--primary);
  background: rgba(255, 255, 255, 0.7);
}

.form-input.error {
  border-color: #E8758A;
}

.form-input::placeholder {
  color: var(--text-hint);
  font-size: 14px;
  opacity: 0.3;
}

/* Watermark icon in right side */
.input-watermark {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: var(--text-hint);
  pointer-events: none;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.input-wrap:focus-within .input-watermark,
.form-input.filled ~ .input-watermark {
  opacity: 0;
}

.textarea-wmark {
  top: 16px;
  transform: none;
}

/* === Date field === */
.date-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.date-field:active {
  border-color: var(--primary);
}

.date-field.filled {
  background: var(--bg-card);
  border-color: var(--primary-light);
}

.date-watermark {
  color: var(--text-hint);
  font-size: 14px;
}

.date-value {
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
}

.date-arrow {
  color: var(--text-secondary);
  flex-shrink: 0;
}

/* === Textarea === */
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
  background: var(--bg-card);
}

.form-textarea::placeholder {
  color: var(--text-hint);
  font-size: 14px;
  opacity: 0.3;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: var(--text-hint);
  margin-top: 4px;
}

/* === Error text === */
.error-text {
  margin-top: 6px;
  font-size: 13px;
  color: #E8758A;
}

/* === Form hint === */
.form-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-hint);
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

/* === Remind checks === */
.remind-checks {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  cursor: pointer;
}

.remind-checkbox {
  appearance: none;
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  border: 1.5px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--bg);
  position: relative;
  flex-shrink: 0;
}

.remind-checkbox:checked {
  background: var(--primary);
  border-color: var(--primary);
}

.remind-checkbox:checked::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 7px;
  width: 5px;
  height: 9px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.check-label {
  color: var(--text);
  user-select: none;
}

/* === Footer === */
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
