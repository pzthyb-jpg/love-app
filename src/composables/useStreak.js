// useStreak.js — 连续打卡计算工具

// 徽章定义（常量）
export const BADGE_DEFINITIONS = [
  { id: '7days',  name: '萌芽', emoji: '🌱', days: 7,  color: '#A8E6CF' },
  { id: '14days', name: '绽放', emoji: '🌸', days: 14, color: '#FFD700' },
  { id: '21days', name: '盛放', emoji: '🌺', days: 21, color: '#FF8DBB' },
  { id: '30days', name: '永恒', emoji: '💎', days: 30, color: '#C084FC' }
]

// 计算连续打卡天数
function calculateStreak(history) {
  if (!history || !history.length) return 0

  let streak = 0
  const today = new Date()

  for (let i = 0; ; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = formatDate(d)

    const hasRecord = history.some(h => h.date === dateStr)
    if (hasRecord) {
      streak++
    } else if (i === 0) {
      // 今天还没打卡，但连续打卡可能从昨天开始，继续检查昨天
      continue
    } else {
      // 昨天或更早中断，连续打卡结束
      break
    }
  }
  return streak
}

// 检查是否达成新的里程碑
function checkMilestone(streakDays, earnedBadges) {
  if (!streakDays || streakDays <= 0) return null

  for (const badgeDef of BADGE_DEFINITIONS) {
    const alreadyEarned = earnedBadges && earnedBadges.some(b => b.id === badgeDef.id)
    if (!alreadyEarned && streakDays >= badgeDef.days) {
      return {
        ...badgeDef,
        earnedDate: new Date().toISOString().slice(0, 10)
      }
    }
  }
  return null
}

// 获取下一个里程碑
function getNextMilestone(streakDays, earnedBadges) {
  for (const badgeDef of BADGE_DEFINITIONS) {
    const earned = earnedBadges && earnedBadges.some(b => b.id === badgeDef.id)
    if (!earned) {
      return {
        ...badgeDef,
        remainingDays: Math.max(0, badgeDef.days - streakDays),
        progress: Math.min(1, (streakDays || 0) / badgeDef.days)
      }
    }
  }
  return null  // 全部徽章已获得
}

// 格式化日期 YYYY-MM-DD
function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 获取今天的日期字符串
function getTodayStr() {
  return formatDate(new Date())
}

// 获取本周日期列表（从周一开始）
function getWeekDates() {
  const today = new Date()
  const todayStr = formatDate(today)
  const dayOfWeek = today.getDay() // 0=周日, 1=周一...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']
  
  return weekDays.map((name, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + mondayOffset + i)
    const dateStr = formatDate(d)
    return {
      dayName: name,
      dateStr,
      isToday: dateStr === todayStr
    }
  })
}

// 计算在一起天数
function getLoveDays(anniversaryStr) {
  if (!anniversaryStr) return 0
  const anniversary = new Date(anniversaryStr)
  const today = new Date()
  const diffTime = today.getTime() - anniversary.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1  // 包含当天
}

export {
  calculateStreak,
  checkMilestone,
  getNextMilestone,
  formatDate,
  getTodayStr,
  getWeekDates,
  getLoveDays
}
