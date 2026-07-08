// useAnniversary.js — 纪念日逻辑 Composable
import { computed } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from './useStorage.js'

// 类型配置映射
export const TYPES_CONFIG = {
  anniversary: { label: '周年', emoji: '💕', color: '#F4C765', defaults: [1, 3, 7] },
  birthday:    { label: '生日', emoji: '🎂', color: '#E8758A', defaults: [1, 7, 30] },
  holiday:     { label: '节日', emoji: '🎉', color: '#A78BFA', defaults: [1, 3, 7] },
  custom:      { label: '其他', emoji: '🌟', color: '#60A5FA', defaults: [1, 3] }
}

// 获取今日零点的 Date
function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function useAnniversary() {
  const store = useDataStore()
  const { state } = store

  // 计算下次发生日期
  function getNextOccurrence(dateStr) {
    return store.getNextOccurrence(dateStr)
  }

  // 计算距离下次天数
  function getDaysDiff(dateStr) {
    return store.getDaysUntil(dateStr)
  }

  // 计算相守天数（从原始日期到今天）
  function getDaysSince(dateStr) {
    return store.getDaysSince(dateStr)
  }

  // 判断下次发生是否是今天
  function isToday(dateStr) {
    return getDaysDiff(dateStr) === 0
  }

  // 排序后的列表（最近的在前）
  const sortedList = computed(() => {
    return [...state.anniversaries].sort((a, b) => {
      const nextA = getNextOccurrence(a.date)
      const nextB = getNextOccurrence(b.date)
      if (!nextA) return 1
      if (!nextB) return -1
      return nextA - nextB
    })
  })

  // 格式化提醒天数显示
  function formatReminder(remindDays) {
    if (!remindDays || remindDays.length === 0) return '不提醒'
    return `提前 ${remindDays.sort((a, b) => a - b).join('/')} 天`
  }

  // 获取类型配置
  function getTypeConfig(type) {
    return TYPES_CONFIG[type] || TYPES_CONFIG.custom
  }

  // 天数文案生成
  function getDaysText(item) {
    const days = getDaysDiff(item.date)
    if (days === 0) return '就是今天 🎉'
    if (days > 0) return `还有 ${days} 天`
    return `已过 ${Math.abs(days)} 天`
  }

  // 相守天数文案
  function getDaysSinceText(item) {
    const days = getDaysSince(item.date)
    return `相守 ${days} 天`
  }

  // 检查是否已推送过
  function hasNotified(annId, dateStr) {
    const records = safeGetJSON(STORAGE_KEYS.ANNIV_NOTIFICATION_SENT, {})
    const key = `${annId}_${dateStr}`
    return !!records[key]
  }

  // 标记已推送
  function markNotified(annId, dateStr) {
    const records = safeGetJSON(STORAGE_KEYS.ANNIV_NOTIFICATION_SENT, {})
    records[`${annId}_${dateStr}`] = true
    safeSetJSON(STORAGE_KEYS.ANNIV_NOTIFICATION_SENT, records)
  }

  // 检查并发送推送通知
  function checkAnniversaryNotifications() {
    if (!('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    if (!state.notificationEnabled) return

    const today = startOfToday()

    state.anniversaries.forEach(ann => {
      if (!ann.remindDays || ann.remindDays.length === 0) return

      ann.remindDays.forEach(daysBefore => {
        const next = getNextOccurrence(ann.date)
        if (!next) return

        const notifyDate = new Date(next)
        notifyDate.setDate(notifyDate.getDate() - daysBefore)
        const notifyStr = `${notifyDate.getFullYear()}-${String(notifyDate.getMonth() + 1).padStart(2, '0')}-${String(notifyDate.getDate()).padStart(2, '0')}`
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

        if (notifyStr === todayStr && !hasNotified(ann.id, notifyStr)) {
          const title = `${ann.emoji} ${ann.name}`
          let body = ''
          if (daysBefore === 0) {
            body = `🎉 今天是【${ann.name}】！`
          } else if (daysBefore === 1) {
            body = `🎁 【${ann.name}】就是明天！别忘了 🎉`
          } else {
            body = `📅 距离【${ann.name}】还有 ${daysBefore} 天`
          }

          navigator.serviceWorker?.ready.then(registration => {
            registration.showNotification(title, {
              body,
              icon: '/icons/icon-192.png',
              badge: '/icons/badge-72.png',
              tag: `anniversary-${ann.id}-${notifyStr}`,
              renotify: false,
              data: { url: '/anniversary' }
            })
          }).catch(() => {
            // 降级
            new Notification(title, { body })
          })

          markNotified(ann.id, notifyStr)
        }
      })
    })
  }

  return {
    sortedList,
    getDaysDiff,
    getDaysSince,
    getNextOccurrence,
    isToday,
    formatReminder,
    getTypeConfig,
    getDaysText,
    getDaysSinceText,
    checkAnniversaryNotifications,
    addAnniversary: store.addAnniversary,
    updateAnniversary: store.updateAnniversary,
    deleteAnniversary: store.deleteAnniversary,
    TYPES_CONFIG
  }
}
