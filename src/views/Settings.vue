<template>
  <div class="page settings-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="emoji">⚙️</span>
      <h2>设置</h2>
    </div>

    <!-- 主题设置 -->
    <div class="card settings-card">
      <!-- Dark mode toggle -->
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">{{ isDark ? '🌙' : '☀️' }}</div>
          <div class="setting-text">
            <div class="setting-label">{{ isDark ? '深色模式' : '浅色模式' }}</div>
            <div class="setting-desc">{{ isDark ? '深色调，夜间更舒适' : '浅色调，日间更清晰' }}</div>
          </div>
        </div>
        <div class="setting-action">
          <van-switch :model-value="isDark" size="24px" @update:model-value="toggleDarkMode" />
        </div>
      </div>
      <div class="setting-divider"></div>
      <!-- Animation Density -->
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">🫧</div>
          <div class="setting-text">
            <div class="setting-label">动画密度</div>
            <div class="setting-desc">首页漂浮爱心动画强度</div>
          </div>
        </div>
        <div class="setting-action">
          <van-dropdown-menu>
            <van-dropdown-item
              v-model="animationDensity"
              :options="densityOptions"
              @change="onDensityChange"
            />
          </van-dropdown-menu>
        </div>
      </div>
      <div class="setting-divider"></div>
      <!-- Theme preview selector -->
      <div class="setting-item theme-preview-wrap">
        <ThemePreview />
      </div>
    </div>

    <!-- 纪念日设置 -->
    <div class="card settings-card">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">🎂</div>
          <div class="setting-text">
            <div class="setting-label">纪念日</div>
            <div class="setting-desc" v-if="anniversary">管理纪念日</div>
            <div class="setting-desc" v-else>记录我们的重要日子</div>
          </div>
        </div>
        <div class="setting-action">
          <span class="date-display" @click="showDatePicker = true">{{ anniversary || '选择日期' }}</span>
        </div>
      </div>
      <!-- 周年倒计时 -->
      <div v-if="anniversary" class="anniversary-countdown">
        <div class="countdown-row">
          <span class="countdown-emoji">💖</span>
          <span class="countdown-text">已在<strong>{{ loveDays }}</strong>天</span>
        </div>
        <div v-if="nextAnniversaryDays > 0" class="countdown-row">
          <span class="countdown-emoji">🎊</span>
          <span class="countdown-text">距<strong>{{ nextAnniversaryYear }}周年</strong>还有<strong>{{ nextAnniversaryDays }}</strong>天</span>
        </div>
        <div v-else-if="nextAnniversaryDays === 0" class="countdown-row countdown-today">
          <span class="countdown-emoji">🎉</span>
          <span class="countdown-text"><strong>今天是周年纪念日！</strong></span>
        </div>
      </div>
    </div>

    <!-- 日期选择弹窗 -->
    <Teleport to="body">
      <van-popup v-model:show="showDatePicker" position="bottom" round>
        <van-date-picker
          v-model="selectedDate"
          title="选择纪念日"
          :min-date="minDate"
          :max-date="new Date()"
          @confirm="onDateConfirm"
          @cancel="showDatePicker = false"
        />
      </van-popup>
    </Teleport>

    <!-- 昵称设置 -->
    <div class="card settings-card">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">👧</div>
          <div class="setting-text">
            <div class="setting-label">女朋友昵称</div>
            <div class="setting-desc">TA 的昵称</div>
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
            <div class="setting-desc">拍照打卡提醒</div>
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
        <li>所有数据仅存储在本设备上，不会上传至任何服务器</li>
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
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import { STORAGE_KEYS, KEY_GIRLFRIEND_NAME, KEY_BOYFRIEND_NAME, KEY_REMINDER_TIME, KEY_CUSTOM_REMINDER_TIME, KEY_ANIMATION_DENSITY, safeGetJSON, safeSetJSON, safeGetString, safeSetString, clearAll } from '../composables/useStorage.js'
import { getLoveDays } from '../composables/useStreak.js'
import { useReminder } from '../composables/useReminder.js'
import { useTheme } from '../composables/useTheme.js'
import ThemePreview from '../components/ThemePreview.vue'

const { isDark, toggleDarkMode } = useTheme()

const { state, setGirlfriendName, setBoyfriendName } = useDataStore()

// 使用 useReminder composable
const {
  notifEnabled: notificationEnabled,
  reminderTime,
  customReminderTime,
  reminderScheduled,
  nextReminderText,
  scheduleReminder,
  cancelReminder,
  onToggleNotification,
  onReminderTimeChange,
  onCustomTimeChange
} = useReminder()

// 纪念日
const anniversary = ref(state.loveAnniversary || '')

// 在一起天数
const loveDays = computed(() => getLoveDays(anniversary.value))

// 距离下次周年天数
const nextAnniversaryDays = computed(() => {
  if (!anniversary.value) return -1
  const anniv = new Date(anniversary.value)
  const today = new Date()
  const currentYear = today.getFullYear()
  let next = new Date(currentYear, anniv.getMonth(), anniv.getDate())
  if (next < today) {
    next = new Date(currentYear + 1, anniv.getMonth(), anniv.getDate())
  }
  const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
  return diff
})

const nextAnniversaryYear = computed(() => {
  if (!anniversary.value) return 0
  const anniv = new Date(anniversary.value)
  const today = new Date()
  let year = today.getFullYear() - anniv.getFullYear()
  const next = new Date(today.getFullYear(), anniv.getMonth(), anniv.getDate())
  if (next < today) year++
  return year
})

// 日期选择器
const showDatePicker = ref(false)
const selectedDate = ref([])
const minDate = new Date(2010, 0, 1)

function onDateConfirm({ selectedValues }) {
  const [year, month, day] = selectedValues
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  anniversary.value = dateStr
  safeSetString(STORAGE_KEYS.LOVE_ANNIVERSARY, dateStr)
  showDatePicker.value = false
  showToast({ message: '🎂 纪念日已更新', type: 'success' })
}

// 昵称
const girlfriendName = ref(safeGetString(KEY_GIRLFRIEND_NAME, ''))
const boyfriendName = ref(safeGetString(KEY_BOYFRIEND_NAME, '男朋友'))

// 导入文件引用
const importInputRef = ref(null)

// 保存设置
function saveSettings() {
  safeSetString(STORAGE_KEYS.LOVE_ANNIVERSARY, anniversary.value)
  safeSetString(KEY_GIRLFRIEND_NAME, girlfriendName.value)
  safeSetString(KEY_BOYFRIEND_NAME, boyfriendName.value || '男朋友')
  safeSetString(KEY_REMINDER_TIME, reminderTime.value)
  safeSetString(KEY_CUSTOM_REMINDER_TIME, customReminderTime.value)
}

// 动画密度
const animationDensity = ref(safeGetString(KEY_ANIMATION_DENSITY, 'full'))
const densityOptions = [
  { text: '关闭', value: 'off' },
  { text: '紧凑', value: 'compact' },
  { text: '完整', value: 'full' },
  { text: '密集', value: 'density' }
]

function onDensityChange(val) {
  safeSetString(KEY_ANIMATION_DENSITY, val)
  document.documentElement.dataset.animation = val
  showToast({ message: '🫧 动画密度已更新', type: 'success' })
}

// 监听变化自动保存
onMounted(() => {
  // 同步动画密度到 DOM
  document.documentElement.dataset.animation = animationDensity.value
  // 使用 watch 的简单替代：保存按钮无需手动触发，通过 blur/change 事件
})

function onGirlfriendNameBlur() {
  setGirlfriendName(girlfriendName.value)
  showToast({ message: '👧 昵称已保存', type: 'success' })
}

function onBoyfriendNameBlur() {
  setBoyfriendName(boyfriendName.value || '男朋友')
  showToast({ message: '👦 昵称已保存', type: 'success' })
}


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

/* 倒计时区域 */
.anniversary-countdown {
  padding: var(--space-md) var(--space-xl) var(--space-lg);
  background: linear-gradient(135deg, #FFF5F7, #FFF0F5);
  border-top: 1px solid rgba(232, 117, 138, 0.1);
}
.countdown-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
  font-size: var(--font-body-small);
  color: var(--text-secondary);
}
.countdown-emoji {
  font-size: 18px;
}
.countdown-text strong {
  color: var(--primary);
  font-weight: 700;
}
.countdown-today {
  animation: gentlePulse 1.5s ease-in-out infinite;
}
.countdown-today .countdown-text strong {
  color: var(--primary-dark);
  font-size: var(--font-body);
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

/* Theme preview override */
.theme-preview-wrap {
  display: block;
  padding: 0;
}
</style>
