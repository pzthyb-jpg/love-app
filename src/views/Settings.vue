<template>
  <div class="page settings-page">
    <div class="page-header">
      <span class="emoji">⚙️</span>
      <h2>设置</h2>
    </div>

    <div class="card settings-card">
      <div class="setting-item" @click="router.push('/location-manage')">
        <div class="setting-info">
          <div class="setting-icon">📍</div>
          <div class="setting-text">
            <div class="setting-label">共享位置管理</div>
            <div class="setting-desc">小皮 · 共享中</div>
          </div>
        </div>
        <div class="setting-action">
          <span class="manage-link">›</span>
        </div>
      </div>
      <div class="setting-divider"></div>
    </div>

    <div class="card settings-card">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">{{ isDark ? "🌙" : "☀️" }}</div>
          <div class="setting-text">
            <div class="setting-label">{{ isDark ? "深色模式" : "浅色模式" }}</div>
            <div class="setting-desc">{{ isDark ? "深色调，夜间更舒适" : "浅色调，日间更清晰" }}</div>
          </div>
        </div>
        <div class="setting-action">
          <van-switch :model-value="isDark" size="24px" @update:model-value="toggleDarkMode" />
        </div>
      </div>
      <div class="setting-divider"></div>
    </div>

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
          <span class="manage-link" @click="router.push('/anniversary')">管理 ›</span>
        </div>
      </div>
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
      <div v-if="reminderTime === CUSTOM_TIME" class="setting-item setting-item-sub">
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

    <!-- 账号管理 -->
    <div class="card settings-card">
      <div class="account-management">
        <h3 class="card-title">🔐 账号管理</h3>
        <div v-if="!isAuthenticated" class="account-login">
          <van-field v-model="loginForm.username" placeholder="用户名" maxlength="20" />
          <van-field v-model="loginForm.password" placeholder="密码" type="password" maxlength="32" style="margin-top:8px" />
          <div style="display:flex;gap:8px;margin-top:12px">
            <van-button type="primary" block :loading="loginLoading" @click="handleLogin">登录</van-button>
            <van-button block @click="showRegister = true">注册</van-button>
          </div>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:8px">没有账号？注册一个，数据跨设备同步</p>
        </div>
        <div v-else class="account-info">
          <div class="account-avatar">👤</div>
          <div class="account-meta">
            <strong>{{ currentUser.username }}</strong>
            <span class="account-display" v-if="currentUser.display_name">({{ currentUser.display_name }})</span>
            <p style="font-size:12px;color:var(--text-secondary)">注册于 {{ formatDate(currentUser.created_at) }}</p>
          </div>
          <van-button size="small" @click="handleLogout">退出登录</van-button>
        </div>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <Teleport to="body">
      <div v-if="showRegister" class="dialog-overlay" @click.self="showRegister = false">
        <div class="dialog-box">
          <h3>注册新账号</h3>
          <p class="dialog-desc">注册后可在任何设备登录，同步数据</p>
          <div style="margin-top:16px">
            <van-field v-model="registerForm.username" placeholder="用户名 (3-20位)" maxlength="20" autocomplete="off" />
            <van-field v-model="registerForm.password" placeholder="密码 (6位以上)" type="password" style="margin-top:8px" autocomplete="off" />
            <van-field v-model="registerForm.displayName" placeholder="昵称 (可选)" maxlength="20" style="margin-top:8px" autocomplete="off" />
            <div style="display:flex;gap:8px;margin-top:16px">
              <van-button plain block @click="showRegister = false">取消</van-button>
              <van-button type="primary" block :loading="registerLoading" @click="handleRegister">注册</van-button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 隐私说明 -->
    <div class="card privacy-card">
      <div class="privacy-header">🔒 隐私说明</div>
      <ul class="privacy-list">
        <li>数据优先存储本地，登录账号后同步到云端</li>
        <li>所有数据传输均通过 HTTPS 加密</li>
        <li>清除浏览器数据会导致本地数据丢失，建议定期导出备份</li>
      </ul>
    </div>

  </div>
</template>

<script setup>
import { showToast, showConfirmDialog } from "vant"
import { ref, computed } from "vue"
import { useDataStore } from "../stores/dataStore.js"
import { useRouter } from "vue-router"
import { getLoveDays } from "../composables/useStreak.js"
import { useReminder } from "../composables/useReminder.js"
import { useTheme } from "../composables/useTheme.js"
import { useAuth } from "../composables/useDatabase.js"
const db = useAuth()

const { isDark, toggleDarkMode } = useTheme()
const { currentUser, isAuthenticated, register, login, logout } = useAuth()
const { state, girlfriendName: gfName, boyfriendName: bfName, loveAnniversary, notificationEnabled: notifEn, reminderTime: rt, customReminderTime: crt, setGirlfriendName, setBoyfriendName, setNotificationEnabled, updateSettings } = useDataStore()
const router = useRouter()

// Constants for template
const CUSTOM_TIME = "custom"

// 纪念日
const anniversary = computed(() => loveAnniversary.value || "")
const loveDays = computed(() => getLoveDays(anniversary.value))

const today = new Date()
const nextAnniversaryYear = computed(() => {
  const start = new Date(anniversary.value)
  const yearDiff = today.getFullYear() - start.getFullYear()
  const next = new Date(start)
  next.setFullYear(start.getFullYear() + yearDiff + 1)
  return yearDiff + 1
})
const nextAnniversaryDays = computed(() => {
  if (!anniversary.value) return 0
  const start = new Date(anniversary.value)
  const yearDiff = today.getFullYear() - start.getFullYear()
  const next = new Date(start)
  next.setFullYear(start.getFullYear() + yearDiff)
  if (next < today) {
    next.setFullYear(next.getFullYear() + 1)
  }
  return Math.ceil((next - today) / 86400000)
})

// 昵称
const girlfriendName = computed({ get: () => gfName.value || '', set: v => setGirlfriendName(v) })
const boyfriendName = computed({ get: () => bfName.value || '', set: v => setBoyfriendName(v) })
function onGirlfriendNameBlur() { showToast({ message: "已保存", type: "success" }) }
function onBoyfriendNameBlur() { showToast({ message: "已保存", type: "success" }) }

// 提醒
const reminderTime = computed({ get: () => rt.value || 'noon', set: v => updateSettings({ reminder_time: v }) })
const customReminderTime = computed({ get: () => crt.value || '12:00', set: v => updateSettings({ custom_reminder_time: v }) })
const notificationEnabled = computed({ get: () => notifEn.value !== false, set: v => setNotificationEnabled(v) })
const { requestPermission, scheduleNotification, cancelNotifications, onToggleNotification: reminderToggle } = useReminder()

async function onToggleNotification() {
  if (notificationEnabled.value) {
    await requestPermission()
    await scheduleNotification()
    updateSettings({ notification_enabled: true })
    reminderToggle(true)
  } else {
    await cancelNotifications()
    updateSettings({ notification_enabled: false })
    reminderToggle(false)
  }
}

function onReminderTimeChange() {
  updateSettings({ reminder_time: reminderTime.value })
  if (notificationEnabled.value) scheduleNotification()
  showToast({ message: "提醒时间已更新", type: "success" })
}

function onCustomTimeChange() {
  updateSettings({ custom_reminder_time: customReminderTime.value })
  if (notificationEnabled.value) scheduleNotification()
  showToast({ message: "提醒时间已更新", type: "success" })
}

// 数据管理
// fix: 删除重复的 ref 导入，已在文件顶部导入
const importInputRef = ref(null)
async function exportData() {
  const data = {
    checkins: state.checkinHistory,
    wishes: state.wishes,
    messages: state.messages,
    anniversaries: state.anniversaries,
    lunchHistory: state.lunchHistory,
    restaurantPrefs: state.restaurantPrefs,
    settings: state.settings,
    checkinStats: state.checkinStats,
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `love-app-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast({ message: "导出成功", type: "success" })
}

function triggerImport() { importInputRef.value?.click() }

async function importData(event) {
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data || typeof data !== "object") {
      throw new Error("invalid format")
    }

    if (data.settings && typeof data.settings === "object") {
      await updateSettings(data.settings)
    }
    showToast({ message: "导入成功，页面将刷新", type: "success" })
    setTimeout(() => location.reload(), 1000)
  } catch {
    showToast({ message: "导入失败：文件格式错误", type: "fail" })
  }
}

async function confirmClearAllData() {
  try {
    await showConfirmDialog({ title: "确认清除", message: "此操作将清空全部本地缓存，云端数据保留。刷新后将从云端重新加载。" })
    // 仅清除当前用户数据并退出
    logout()
    location.reload()
  } catch {}
}

// 账号管理
const showRegister = ref(false)
const loginLoading = ref(false)
const registerLoading = ref(false)
const loginForm = ref({ username: "", password: "" })
const registerForm = ref({ username: "", password: "", displayName: "" })

async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    showToast({ message: "请填写用户名和密码", type: "fail" })
    return
  }
  loginLoading.value = true
  try {
    const result = await login(loginForm.value.username, loginForm.value.password)
    if (result.error) {
      showToast({ message: result.error.message || "登录失败", type: "fail" })
    } else {
      showToast({ message: "登录成功 💕", type: "success" })
      loginForm.value = { username: "", password: "" }
      router.push("/")
    }
  } catch (e) {
    showToast({ message: e.message || "登录失败", type: "fail" })
  }
  loginLoading.value = false
}

async function handleRegister() {
  if (!registerForm.value.username || !registerForm.value.password) {
    showToast({ message: "请填写用户名和密码", type: "fail" })
    return
  }
  if (registerForm.value.username.length < 3) {
    showToast({ message: "用户名至少 3 个字符", type: "fail" })
    return
  }
  if (registerForm.value.password.length < 6) {
    showToast({ message: "密码至少 6 位", type: "fail" })
    return
  }
  registerLoading.value = true
  try {
    const result = await register(registerForm.value.username, registerForm.value.password, registerForm.value.displayName)
    if (result.error) {
      showToast({ message: result.error.message || "注册失败", type: "fail" })
    } else {
      showToast({ message: "注册成功！已自动登录 💕", type: "success" })
      showRegister.value = false
      registerForm.value = { username: "", password: "", displayName: "" }
    }
  } catch (e) {
    showToast({ message: e.message || "注册失败", type: "fail" })
  }
  registerLoading.value = false
}

function handleLogout() {
  logout()
  showToast({ message: "已退出登录" })
  router.replace('/login')
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" })
  } catch {
    return ""
  }
}
</script>

<style scoped>
.settings-page {
  padding: 20px 16px 80px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.page-header .emoji { font-size: 28px; }
.page-header h2 { font-size: 22px; font-weight: 700; color: var(--text-primary); margin: 0; }

.card {
  background: var(--white);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  cursor: pointer;
}
.setting-item-sub { margin-top: 8px; padding-left: 40px; }

.setting-info { display: flex; align-items: center; gap: 12px; flex: 1; }
.setting-icon { font-size: 24px; width: 32px; text-align: center; }
.setting-text { flex: 1; }
.setting-label { font-size: 15px; font-weight: 500; color: var(--text-primary); }
.setting-desc { font-size: 12px; color: var(--text-secondary); margin-top: 2px; }

.setting-action { flex-shrink: 0; }
.setting-arrow { font-size: 18px; color: var(--text-tertiary); }

.setting-divider { height: 1px; background: var(--border); margin: 12px 0; }

.setting-item-danger .setting-label { color: var(--danger); }

van-field ::placeholder { opacity: 0.3; }

.select-input, .time-input {
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 13px;
  background: var(--bg);
  color: var(--text-primary);
}

/* Account management */
.account-management { padding: 4px 0; }
.card-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0 0 12px; }
.account-login { padding: 8px 0; }
.account-info { display: flex; align-items: center; gap: 12px; padding: 8px 0; }
.account-avatar { font-size: 32px; }
.account-meta { flex: 1; }
.account-meta strong { color: var(--text-primary); font-size: 15px; }
.account-display { color: var(--text-secondary); font-size: 13px; margin-left: 4px; }

/* Privacy card */
.privacy-card { background: var(--bg); }
.privacy-header { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.privacy-list { margin: 0; padding-left: 18px; font-size: 13px; color: var(--text-secondary); line-height: 1.7; }

/* Anniversary countdown */
.anniversary-countdown { margin-top: 12px; padding: 12px; background: var(--bg); border-radius: 10px; }
.countdown-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.countdown-row:last-child { margin-bottom: 0; }
.countdown-emoji { font-size: 18px; }
.countdown-text { font-size: 14px; color: var(--text-secondary); }
.countdown-text strong { color: var(--primary); }
</style>

<style>
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.5);
}
.dialog-box {
  background: var(--white);
  border-radius: 16px;
  padding: 24px;
  width: 85%;
  max-width: 340px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}
.dialog-box h3 { font-size: 18px; font-weight: 600; margin: 0 0 4px; color: var(--text-primary); }
.dialog-desc { font-size: 13px; color: var(--text-secondary); margin: 0; }
</style>
