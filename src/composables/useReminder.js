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
      // 发送浏览器通知
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('📸 拍照打卡提醒', {
          body: '宝贝，该拍照打卡啦！想看看你今天的样子 ❤️',
          icon: '📸'
        })
      }
      // 即使通知被拒绝，也内部提醒（通过 Toast）
      showToast({ message: '📸 该拍照打卡啦！' })
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
    scheduleReminder,
    cancelReminder,
    onToggleNotification,
    onReminderTimeChange,
    onCustomTimeChange
  }
}
