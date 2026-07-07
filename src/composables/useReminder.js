// useReminder.js — 提醒调度 composable（统一 Photo.vue 和 Settings.vue 的提醒逻辑）

import { ref } from 'vue'
import { safeGetString, safeSetString, STORAGE_KEYS } from './useStorage.js'
import { showToast } from 'vant'

const KEY_REMINDER_TIME = 'reminder_time'
const KEY_CUSTOM_REMINDER_TIME = 'custom_reminder_time'

const REMINDER_TIME_MAP = {
  noon: [12, 0],
  afternoon: [15, 0],
  evening: [18, 0]
}

let reminderTimer = null

// 分层推送文案
function getPushMessage(missedDays = 0) {
  if (missedDays >= 3) {
    return {
      title: '好想念宝贝',
      body: '是不是我不够好看，你都不来看我...🥺',
      level: 3
    }
  }
  if (missedDays >= 2) {
    return {
      title: '宝贝在干嘛呀',
      body: '怎么还不来打卡，气鼓鼓！😤',
      level: 2
    }
  }
  return {
    title: '宝贝，今天打卡了吗',
    body: '想看看你美美的样子～',
    level: 1
  }
}

// 计算断连天数（基于纪念日或最后一次打卡）
function getMissedDays(anniversary, lastCheckinDate) {
  if (!anniversary) return 0
  const start = new Date(anniversary)
  const now = new Date()
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  if (lastCheckinDate) {
    const last = new Date(lastCheckinDate)
    const missedSinceLast = Math.floor((now - last) / (1000 * 60 * 60 * 24))
    return Math.max(0, missedSinceLast - 1)
  }
  return Math.max(0, diff)
}

export function useReminder() {
  const notifEnabled = ref(
    safeGetString(STORAGE_KEYS.NOTIFICATION_ENABLED, 'true') === 'true'
  )
  const reminderTime = ref(safeGetString(KEY_REMINDER_TIME, 'noon'))
  const customReminderTime = ref(safeGetString(KEY_CUSTOM_REMINDER_TIME, '12:00'))
  const reminderScheduled = ref(false)
  const nextReminderText = ref('')

  function scheduleReminder() {
    cancelReminder()
    if (!notifEnabled.value) return

    // 请求通知权限
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const now = new Date()
    let targetHour, targetMinute

    if (reminderTime.value === 'custom') {
      const parts = (customReminderTime.value || '12:00').split(':')
      targetHour = parseInt(parts[0])
      targetMinute = parseInt(parts[1])
    } else {
      const time = REMINDER_TIME_MAP[reminderTime.value] || REMINDER_TIME_MAP.noon
      targetHour = time[0]
      targetMinute = time[1]
    }

    const target = new Date()
    target.setHours(targetHour, targetMinute, 0, 0)

    // 如果已过今日提醒时间，设为明天
    if (target <= now) {
      target.setDate(target.getDate() + 1)
    }

    const msUntilTarget = target.getTime() - now.getTime()

    // 计算下次提醒文本
    const days = target.getDate() !== now.getDate() ? '明天 ' : ''
    nextReminderText.value = `${days}${String(targetHour).padStart(2, '0')}:${String(targetMinute).padStart(2, '0')}`
    reminderScheduled.value = true

    reminderTimer = setTimeout(() => {
      if (!notifEnabled.value) return
      // 计算断连天数，选择分层文案
      const missed = getMissedDays(state.loveAnniversary, state.lastCheckinDate)
      const pushMsg = getPushMessage(missed)
      // 发送浏览器通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(pushMsg.title, {
          body: pushMsg.body,
          icon: './pwa-192x192.png'
        })
      }
      // 即使通知被拒绝，也内部提醒（通过 Toast）
      showToast({ message: `${pushMsg.title} — ${pushMsg.body}` })
      // 安排明天的提醒
      scheduleReminder()
    }, msUntilTarget)
  }

  function cancelReminder() {
    if (reminderTimer) {
      clearTimeout(reminderTimer)
      reminderTimer = null
    }
    reminderScheduled.value = false
    nextReminderText.value = ''
  }

  function onToggleNotification(val) {
    safeSetString(STORAGE_KEYS.NOTIFICATION_ENABLED, val ? 'true' : 'false')
    if (val) {
      // 请求通知权限并发送测试通知
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('💕 小皮爱情助手', {
              body: '中午打卡提醒已开启，每天都会提醒你哦～',
              icon: './pwa-192x192.png'
            })
          }
        })
      }
      scheduleReminder()
    } else {
      cancelReminder()
    }
    showToast({ message: val ? '⏰ 提醒已开启' : '⏰ 提醒已关闭' })
  }

  function onReminderTimeChange() {
    safeSetString(KEY_REMINDER_TIME, reminderTime.value)
    if (reminderTime.value !== 'custom') {
      safeSetString(KEY_CUSTOM_REMINDER_TIME, customReminderTime.value)
      scheduleReminder()
      showToast({ message: '🕐 提醒时间已更新', type: 'success' })
    }
  }

  function onCustomTimeChange() {
    safeSetString(KEY_CUSTOM_REMINDER_TIME, customReminderTime.value)
    scheduleReminder()
    showToast({ message: '🕐 提醒时间已更新', type: 'success' })
  }

  return {
    notifEnabled,
    reminderTime,
    customReminderTime,
    reminderScheduled,
    nextReminderText,
    getPushMessage,
    getMissedDays,
    scheduleReminder,
    cancelReminder,
    onToggleNotification,
    onReminderTimeChange,
    onCustomTimeChange
  }
}
