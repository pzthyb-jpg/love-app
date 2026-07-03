<template>
  <div class="page settings-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="emoji">⚙️</span>
      <h2>设置</h2>
    </div>

    <!-- 纪念日设置 -->
    <div class="card settings-card">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">🎂</div>
          <div class="setting-text">
            <div class="setting-label">纪念日</div>
            <div class="setting-desc">我们在一起的那一天</div>
          </div>
        </div>
        <div class="setting-action">
          <input type="date" v-model="anniversary" class="input date-input" @change="onDateChange" />
        </div>
      </div>
    </div>

    <!-- 昵称设置 -->
    <div class="card settings-card">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">👧</div>
          <div class="setting-text">
            <div class="setting-label">女朋友昵称</div>
            <div class="setting-desc">宝贝的名字</div>
          </div>
        </div>
        <div class="setting-action">
          <van-field v-model="girlfriendName" placeholder="输入昵称…" maxlength="20" @blur="onGirlfriendNameBlur" style="width:120px" />
        </div>
      </div>
      <div class="setting-divider"></div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">👦</div>
          <div class="setting-text">
            <div class="setting-label">男朋友昵称</div>
            <div class="setting-desc">你的名字</div>
          </div>
        </div>
        <div class="setting-action">
          <van-field v-model="boyfriendName" placeholder="输入昵称…" maxlength="20" @blur="onBoyfriendNameBlur" style="width:120px" />
        </div>
      </div>
    </div>

    <!-- 提醒设置 -->
    <div class="card settings-card">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">⏰</div>
          <div class="setting-text">
            <div class="setting-label">中午打卡提醒</div>
            <div class="setting-desc">每天提醒宝贝拍照打卡</div>
          </div>
        </div>
        <div class="setting-action">
          <van-switch v-model="notificationEnabled" @change="onToggleNotification" />
        </div>
      </div>
      <div class="setting-divider"></div>
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">🕐</div>
          <div class="setting-text">
            <div class="setting-label">提醒时间</div>
            <div class="setting-desc">选择打卡提醒的时间</div>
          </div>
        </div>
        <div class="setting-action">
          <select v-model="reminderTime" class="input select-input" @change="onReminderTimeChange">
            <option value="noon">中午 (12:00)</option>
            <option value="afternoon">下午 (15:00)</option>
            <option value="evening">傍晚 (18:00)</option>
            <option value="custom">自定义</option>
          </select>
        </div>
      </div>
      <div v-if="reminderTime === 'custom'" class="setting-item setting-item-sub">
        <div class="setting-info">
          <div class="setting-text">
            <div class="setting-label">自定义时间</div>
          </div>
        </div>
        <div class="setting-action">
          <input type="time" v-model="customReminderTime" class="input time-input" @change="onCustomTimeChange" />
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card settings-card">
      <div class="setting-item" @click="exportData">
        <div class="setting-info">
          <div class="setting-icon">📤</div>
          <div class="setting-text">
            <div class="setting-label">导出全部数据</div>
            <div class="setting-desc">将所有数据导出为 JSON 文件</div>
          </div>
        </div>
        <div class="setting-arrow">›</div>
      </div>
      <div class="setting-divider"></div>
      <div class="setting-item" @click="triggerImport">
        <div class="setting-info">
          <div class="setting-icon">📥</div>
          <div class="setting-text">
            <div class="setting-label">导入恢复数据</div>
            <div class="setting-desc">从备份文件恢复全部数据</div>
          </div>
        </div>
        <div class="setting-arrow">›</div>
      </div>
      <input ref="importInputRef" type="file" accept=".json" @change="importData" style="display:none" />
      <div class="setting-divider"></div>
      <div class="setting-item setting-item-danger" @click="confirmClearAllData">
        <div class="setting-info">
          <div class="setting-icon">🗑️</div>
          <div class="setting-text">
            <div class="setting-label">清除所有数据</div>
            <div class="setting-desc">清空全部应用数据（不可恢复）</div>
          </div>
        </div>
        <div class="setting-arrow">›</div>
      </div>
    </div>

    <!-- 隐私说明 -->
    <div class="card privacy-card">
      <div class="privacy-header">🔒 隐私说明</div>
      <ul class="privacy-list">
        <li>所有数据仅存储在您的设备上，不会上传至任何服务器</li>
        <li>照片仅保存在本地，不会分享给第三方</li>
        <li>清除浏览器数据会导致应用数据丢失，建议定期导出备份</li>
        <li>本应用完全离线运行，无需网络连接</li>
      </ul>
    </div>

    <!-- 清除确认弹窗（由 Vant showConfirmDialog 替代） -->

  </div>
</template>

<script setup>
import { showToast, showConfirmDialog } from 'vant'
import { ref, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import { STORAGE_KEYS, safeGetJSON, safeSetJSON, safeGetString, safeSetString, clearAll } from '../composables/useStorage.js'

const { state } = useDataStore()

// localStorage 键名（遵循 PRD.md 定义）
const KEY_GIRLFRIEND_NAME = 'girlfriend_name'
const KEY_BOYFRIEND_NAME = 'boyfriend_name'
const KEY_REMINDER_TIME = 'reminder_time'
const KEY_CUSTOM_REMINDER_TIME = 'custom_reminder_time'

// 纪念日
const anniversary = ref(state.loveAnniversary || '')

// 昵称
const girlfriendName = ref(safeGetString(KEY_GIRLFRIEND_NAME, ''))
const boyfriendName = ref(safeGetString(KEY_BOYFRIEND_NAME, '泓博'))

// 提醒设置
const notificationEnabled = ref(
  safeGetString(STORAGE_KEYS.NOTIFICATION_ENABLED, 'true') === 'true'
)
const reminderTime = ref(safeGetString(KEY_REMINDER_TIME, 'noon'))
const customReminderTime = ref(safeGetString(KEY_CUSTOM_REMINDER_TIME, '12:00'))

// 导入文件引用
const importInputRef = ref(null)

// 保存设置
function saveSettings() {
  safeSetString(STORAGE_KEYS.LOVE_ANNIVERSARY, anniversary.value)
  safeSetString(KEY_GIRLFRIEND_NAME, girlfriendName.value)
  safeSetString(KEY_BOYFRIEND_NAME, boyfriendName.value || '泓博')
  safeSetString(KEY_REMINDER_TIME, reminderTime.value)
  safeSetString(KEY_CUSTOM_REMINDER_TIME, customReminderTime.value)
}

// 监听变化自动保存
onMounted(() => {
  // 使用 watch 的简单替代：保存按钮无需手动触发，通过 blur/change 事件
})

function onDateChange() {
  if (anniversary.value) {
    safeSetString(STORAGE_KEYS.LOVE_ANNIVERSARY, anniversary.value)
    showToast({ message: '🎂 纪念日已更新', type: 'success' })
  }
}

function onGirlfriendNameBlur() {
  safeSetString(KEY_GIRLFRIEND_NAME, girlfriendName.value)
  showToast({ message: '👧 昵称已保存', type: 'success' })
}

function onBoyfriendNameBlur() {
  safeSetString(KEY_BOYFRIEND_NAME, boyfriendName.value || '泓博')
  showToast({ message: '👦 昵称已保存', type: 'success' })
}

function onReminderTimeChange() {
  safeSetString(KEY_REMINDER_TIME, reminderTime.value)
  showToast({ message: '🕐 提醒时间已更新', type: 'success' })
}

function onCustomTimeChange() {
  safeSetString(KEY_CUSTOM_REMINDER_TIME, customReminderTime.value)
}

function onToggleNotification(val) {
  safeSetString(STORAGE_KEYS.NOTIFICATION_ENABLED, val ? 'true' : 'false')
  showToast({ message: val ? '⏰ 提醒已开启' : '⏰ 提醒已关闭' })
}

// 导出数据
function exportData() {
  const allData = {}
  Object.values(STORAGE_KEYS).forEach(key => {
    try {
      const val = localStorage.getItem(key)
      if (val !== null) {
        allData[key] = JSON.parse(val)
      }
    } catch (e) {}
  })
  // 额外导出昵称和提醒时间
  ;[KEY_GIRLFRIEND_NAME, KEY_BOYFRIEND_NAME, KEY_REMINDER_TIME, KEY_CUSTOM_REMINDER_TIME].forEach(key => {
    try {
      const val = localStorage.getItem(key)
      if (val !== null) {
        allData[key] = val
      }
    } catch (e) {}
  })

  const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `love-app-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast({ message: '📤 数据已导出', type: 'success' })
}

// 导入数据
function triggerImport() {
  importInputRef.value?.click()
}

function importData(e) {
  const file = e.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result)
      Object.entries(data).forEach(([key, value]) => {
        try {
          if (typeof value === 'object' && value !== null) {
            localStorage.setItem(key, JSON.stringify(value))
          } else {
            localStorage.setItem(key, String(value))
          }
        } catch (e) {}
      })
      // 刷新页面以加载新数据
      showToast({ message: '📥 数据已导入，请刷新页面', type: 'success' })
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      showToast({ message: '❌ 导入失败：数据格式不正确', type: 'fail' })
    }
  }
  reader.readAsText(file)
  // 重置 input 以便重复选择同一文件
  e.target.value = ''
}

// 清除数据
function confirmClearAllData() {
  showConfirmDialog({
    title: '⚠️ 确认清除',
    message: '此操作将清空全部应用数据，包括打卡记录、照片、愿望、留言等所有内容，且不可恢复。\n\n确定要继续吗？'
  }).then(() => {
    clearAllData()
  }).catch(() => {
    // 用户取消
  })
}

function clearAllData() {
  clearAll()
  // 额外清除昵称和提醒时间
  try { localStorage.removeItem(KEY_GIRLFRIEND_NAME) } catch (e) {}
  try { localStorage.removeItem(KEY_BOYFRIEND_NAME) } catch (e) {}
  try { localStorage.removeItem(KEY_REMINDER_TIME) } catch (e) {}
  try { localStorage.removeItem(KEY_CUSTOM_REMINDER_TIME) } catch (e) {}

  showClearConfirm.value = false
  showToast({ message: '🗑️ 所有数据已清除，即将刷新', type: 'success' })
  setTimeout(() => {
    window.location.reload()
  }, 1500)
}
</script>

<style scoped>
.settings-page {
  padding-bottom: calc(var(--space-xl) * 2);
}

/* 设置卡片 */
.settings-card {
  padding: 0;
  overflow: hidden;
}

/* 设置项 */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg) var(--space-xl);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.setting-item:active {
  background: var(--warm-pink);
}
.setting-item-danger:active {
  background: rgba(255, 138, 128, 0.15);
}
.setting-item-sub {
  padding-left: calc(var(--space-xl) + 40px + var(--space-md));
  padding-top: 0;
  padding-bottom: var(--space-lg);
}

.setting-info {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex: 1;
  min-width: 0;
}

.setting-icon {
  font-size: 24px;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

.setting-text {
  flex: 1;
  min-width: 0;
}

.setting-label {
  font-size: var(--font-body);
  font-weight: 600;
  color: var(--text);
}

.setting-desc {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: 2px;
}

.setting-arrow {
  font-size: 22px;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-left: var(--space-md);
}

.setting-divider {
  height: 1px;
  background: var(--border);
  margin: 0 var(--space-xl);
}

/* 输入框 */
.date-input {
  width: 140px;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-body-small);
  text-align: center;
}

.text-input {
  width: 120px;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-body-small);
  text-align: center;
}

.select-input {
  width: 130px;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-body-small);
  text-align: center;
  appearance: auto;
}

.time-input {
  width: 100px;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-body-small);
  text-align: center;
}

/* 隐私卡片 */
.privacy-card {
  background: var(--warm-pink);
}

.privacy-header {
  font-size: var(--font-h3);
  font-weight: 600;
  margin-bottom: var(--space-md);
  color: var(--text);
}

.privacy-list {
  list-style: none;
  padding: 0;
}

.privacy-list li {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  line-height: 1.6;
  padding: var(--space-xs) 0;
  padding-left: var(--space-md);
  position: relative;
}

.privacy-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary-light);
}

/* 内联 Toast */
.toast-fixed {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-md);
  font-size: var(--font-body-small);
  font-weight: 500;
  text-align: center;
  max-width: 80vw;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lg);
  pointer-events: none;
  animation: toastIn 0.3s ease;
}
.toast-success {
  background: var(--mint);
  color: #1B5E20;
}
.toast-error {
  background: #FFCDD2;
  color: #B71C1C;
}
.toast-info {
  background: rgba(45, 45, 45, 0.85);
  color: white;
}

@keyframes toastIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
