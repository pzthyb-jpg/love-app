<template>
  <div class="page home-page">
    <!-- 头部 -->
    <div class="home-header">
      <div class="deco-bar">
        <span class="deco-dot"></span>
        <span class="deco-dot" style="background:var(--primary-light);opacity:0.4;"></span>
        <span class="deco-dot"></span>
      </div>
      <h1 class="home-title" @click="handleTitleClick">💕 小皮爱情助手</h1>
      <span class="settings-icon" @click="goToSettings">⚙️</span>
      <p class="home-subtitle">宝贝专属的甜蜜空间❤️</p>
    </div>

    <!-- 爱的数据 -->
    <div class="card love-data-card">
      <div v-if="loveDays > 0" class="love-days-display">
        <div class="love-days-number" ref="daysRef">0</div>
        <div class="love-days-label">💖 在一起 第 <span ref="daysLabelRef">{{ loveDays }}</span> 天</div>
      </div>
      <div v-else class="love-days-empty" @click="showAnniversarySetting">
        <span class="emoji">🎂</span>
        <p>设置纪念日</p>
      </div>
      <div class="love-stats">
        <div class="stat-item">
          <span class="stat-emoji">📸</span>
          <span class="stat-value">{{ totalCheckins }}</span>
          <span class="stat-label">已打卡</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-emoji">🍽️</span>
          <span class="stat-value">{{ totalLunchSpins }}</span>
          <span class="stat-label">已转</span>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <span class="stat-emoji">✨</span>
          <span class="stat-value">{{ fulfilledWishes }}</span>
          <span class="stat-label">已实现</span>
        </div>
      </div>
    </div>

    <!-- 今日状态 -->
    <div class="card today-status-card">
      <h3 class="card-title">📋 今日状态</h3>
      <div class="status-circles">
        <div class="status-circle" :class="{ done: todayCheckedIn, empty: !todayCheckedIn }" @click="goToTab(1)">
          <div class="circle-icon">{{ todayCheckedIn ? '📸' : '📷' }}</div>
          <div class="circle-label">{{ todayCheckedIn ? '已打卡' : '未打卡' }}</div>
        </div>
        <div class="status-circle" :class="{ done: todayLunchSelected, empty: !todayLunchSelected }" @click="goToTab(2)">
          <div class="circle-icon">🍽️</div>
          <div class="circle-label">{{ todayLunchSelected ? '已选' : '未选' }}</div>
        </div>
        <div class="status-circle" :class="{ 'has-new': todayWishCount > 0 }" @click="goToTab(3)">
          <div class="circle-icon">✨</div>
          <div class="circle-label">{{ todayWishCount > 0 ? todayWishCount + '个新愿望' : '无新愿望' }}</div>
        </div>
      </div>
    </div>

    <!-- 来自他的话 -->
    <div v-if="todayMessage" class="card message-preview-card" @click="goToTab(3)">
      <div class="message-preview">
        <div class="message-avatar">💌</div>
        <div class="message-content">
          <p class="message-text">"{{ todayMessage.text }}"</p>
          <p class="message-meta">— {{ todayMessage.author }} · 查看更多 →</p>
        </div>
      </div>
    </div>

    <!-- 本周打卡 -->
    <div class="card week-card">
      <h3 class="card-title">📅 本周打卡</h3>
      <div class="week-dots">
        <div
          v-for="day in weekDays"
          :key="day.dayName"
          class="week-dot"
          :class="{
            checked: day.checked,
            today: day.isToday,
            missed: !day.checked && !day.isToday && day.past
          }"
        >
          <span class="dot-day">{{ day.dayName }}</span>
        </div>
      </div>
      <div class="streak-info">
        <span class="streak-fire">🔥</span>
        <span>连续打卡 <strong>{{ streakDays }}</strong> 天</span>
        <span v-if="nextBadge" class="next-milestone">
           · 下一个: {{ nextBadge.name }} {{ nextBadge.emoji }}
        </span>
      </div>
      <div v-if="nextBadge" class="streak-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (nextBadge.progress * 100) + '%' }"></div>
        </div>
        <span class="progress-text">{{ streakDays }}/{{ nextBadge.days }} 天</span>
      </div>
    </div>

    <!-- 纪念日设置弹窗 -->
    <Teleport to="body">
      <div v-if="showAnniversaryModal" class="dialog-overlay" @click.self="showAnniversaryModal = false">
        <div class="dialog-box">
          <h3>🎂 设置纪念日</h3>
          <p>选择我们在一起的那一天</p>
          <input type="date" v-model="anniversaryInput" class="input" style="margin-bottom:var(--space-lg);" />
          <div class="dialog-actions">
            <van-button type="default" size="small" @click="showAnniversaryModal = false">取消</van-button>
            <van-button type="primary" size="small" @click="saveAnniversary">保存 💕</van-button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { showToast } from 'vant'
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore.js'
import { getLoveDays, getWeekDates, getTodayStr, calculateStreak, getNextMilestone } from '../composables/useStreak.js'
import { getTodaysMessage, formatMessageText } from '../composables/useMessages.js'
import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from '../composables/useStorage.js'

const router = useRouter()
const { state, setAnniversary } = useDataStore()

const daysRef = ref(null)
const showAnniversaryModal = ref(false)
const anniversaryInput = ref('')
const anniversarySet = ref(false)

let titleClickCount = 0
let titleClickTimer = null

// 在一起天数
const loveDays = computed(() => {
  const anniversary = state.loveAnniversary || safeGetJSON('love_anniversary', '')
  return getLoveDays(anniversary)
})

// 累计打卡
const totalCheckins = computed(() => {
  return new Set(state.checkinHistory.map(h => h.date)).size
})

// 累计转盘
const totalLunchSpins = computed(() => state.lunchHistory.length)

// 已实现愿望数
const fulfilledWishes = computed(() => state.wishes.filter(w => w.fulfilled).length)

// 今日是否已打卡
const todayCheckedIn = computed(() => {
  const today = getTodayStr()
  return state.checkinHistory.some(h => h.date === today)
})

// 今日是否已选午餐
const todayLunchSelected = computed(() => {
  const today = getTodayStr()
  return state.lunchHistory.some(h => h.date === today)
})

// 今日新增愿望数
const todayWishCount = computed(() => {
  const today = getTodayStr()
  return state.wishes.filter(w => w.dateStr === today).length
})

// 连续打卡天数
const streakDays = computed(() => {
  return calculateStreak(state.checkinHistory)
})

// 下一个里程碑
const nextBadge = computed(() => {
  return getNextMilestone(streakDays.value, state.checkinBadges)
})

// 本周打卡
const weekDays = computed(() => {
  const dates = getWeekDates()
  return dates.map(d => ({
    ...d,
    checked: state.checkinHistory.some(h => h.date === d.dateStr),
    past: new Date(d.dateStr) < new Date(getTodayStr())
  }))
})

// 今日留言
const todayMessage = computed(() => {
  const msgs = state.messages.length > 0 ? state.messages : safeGetJSON(STORAGE_KEYS.MESSAGES, [])
  if (!msgs.length) return null
  const today = getTodayStr()
  const hour = new Date().getHours()
  const result = getTodaysMessage(msgs, today, hour)
  if (result && result.reset) {
    // 已循环重置
    safeSetJSON(STORAGE_KEYS.MESSAGES, msgs)
    return getTodaysMessage(msgs, today, hour)
  }
  if (result && !result.displayedDates?.includes(today)) {
    result.displayedDates = result.displayedDates || []
    result.displayedDates.push(today)
    safeSetJSON(STORAGE_KEYS.MESSAGES, msgs)
  }
  if (result) {
    return {
      ...result,
      text: formatMessageText(result.text, loveDays.value)
    }
  }
  return null
})

// 数字滚动动画
onMounted(async () => {
  await nextTick()
  if (loveDays.value > 0 && daysRef.value) {
    animateNumber(daysRef.value, loveDays.value, 1200)
  }
})

function animateNumber(el, target, duration = 1000) {
  const startTime = performance.now()
  const animate = (currentTime) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    const currentValue = Math.floor(eased * target)
    el.textContent = currentValue
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      el.textContent = target
    }
  }
  requestAnimationFrame(animate)
}

function goToTab(index) {
  const paths = ['/', '/photo', '/lunch', '/wish']
  router.push(paths[index])
}

function goToSettings() {
  router.push('/settings')
}

function handleTitleClick() {
  titleClickCount++
  clearTimeout(titleClickTimer)
  titleClickTimer = setTimeout(() => {
    titleClickCount = 0
  }, 1000)
  if (titleClickCount >= 5) {
    titleClickCount = 0
    router.push('/messages-admin')
  }
}

function showAnniversarySetting() {
  showAnniversaryModal.value = true
  anniversaryInput.value = state.loveAnniversary || ''
}

function saveAnniversary() {
  if (anniversaryInput.value) {
    setAnniversary(anniversaryInput.value)
    showAnniversaryModal.value = false
    anniversarySet.value = true
    showToast({ message: '🎉 纪念日设置成功！', type: 'success' })
    // 重新触发数字动画
    nextTick(() => {
      if (daysRef.value) {
        animateNumber(daysRef.value, loveDays.value, 1200)
      }
    })
  }
}
</script>

<style scoped>
.home-page {
  padding-top: var(--space-lg);
}

.home-header {
  text-align: center;
  margin-bottom: var(--space-xl);
  position: relative;
}
.home-title {
  font-size: var(--font-h1);
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  cursor: default;
}
.settings-icon {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 22px;
  cursor: pointer;
  padding: var(--space-xs);
  transition: transform var(--transition-fast);
  z-index: 10;
}
.settings-icon:active {
  transform: scale(0.85);
}
.home-subtitle {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}

.deco-bar {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: var(--space-sm);
}
.deco-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--primary-light);
  opacity: 0.5;
}
.deco-dot:nth-child(2) {
  width: 20px;
  border-radius: 3px;
}

/* 爱的数据 */
.love-data-card {
  text-align: center;
}
.love-days-number {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--primary), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.1;
}
.love-days-label {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}
.love-days-empty {
  padding: var(--space-lg);
  cursor: pointer;
}
.love-days-empty .emoji {
  font-size: 36px;
}
.love-days-empty p {
  font-size: var(--font-h3);
  color: var(--text-secondary);
  margin-top: var(--space-sm);
}

.love-stats {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-lg);
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border);
}
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.stat-emoji {
  font-size: 20px;
}
.stat-value {
  font-size: var(--font-h2);
  font-weight: 700;
  color: var(--text);
}
.stat-label {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}
.stat-divider {
  width: 1px;
  height: 40px;
  background: var(--border);
}

/* 今日状态 */
.card-title {
  font-size: var(--font-h3);
  font-weight: 600;
  margin-bottom: var(--space-lg);
  color: var(--text);
}
.status-circles {
  display: flex;
  justify-content: space-around;
  gap: var(--space-md);
}
.status-circle {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-lg);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-width: 80px;
}
.status-circle:active {
  transform: scale(0.95);
}
.status-circle.done {
  background: linear-gradient(135deg, rgba(168, 230, 207, 0.3), rgba(168, 230, 207, 0.1));
}
.status-circle.empty {
  background: var(--warm-pink);
}
.status-circle.has-new {
  background: linear-gradient(135deg, rgba(192, 132, 252, 0.3), rgba(192, 132, 252, 0.1));
}
.circle-icon {
  font-size: 28px;
}
.circle-label {
  font-size: var(--font-caption);
  font-weight: 500;
  color: var(--text-secondary);
}
.status-circle.done .circle-label {
  color: #2E7D32;
}
.status-circle.has-new .circle-label {
  color: #7C3AED;
}

/* 留言预览 */
.message-preview-card {
  cursor: pointer;
}
.message-preview {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}
.message-avatar {
  font-size: 32px;
  flex-shrink: 0;
}
.message-content {
  flex: 1;
}
.message-text {
  font-size: var(--font-body);
  color: var(--text);
  line-height: 1.6;
}
.message-meta {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}

/* 本周打卡 */
.week-dots {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-bottom: var(--space-md);
}
.week-dot {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--warm-pink);
  font-size: var(--font-caption);
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}
.week-dot.checked {
  background: linear-gradient(135deg, var(--primary-light), var(--primary));
  color: white;
}
.week-dot.today {
  border: 2px solid var(--primary);
  font-weight: 700;
}
.week-dot.missed {
  opacity: 0.4;
}

.streak-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-top: var(--space-sm);
}
.streak-fire {
  font-size: 18px;
}
.next-milestone {
  color: var(--primary);
}

.streak-progress {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-top: var(--space-md);
}
.progress-bar {
  flex: 1;
  height: 6px;
  background: var(--warm-pink);
  border-radius: 3px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-light), var(--primary));
  border-radius: 3px;
  transition: width 0.5s ease;
}
.progress-text {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  white-space: nowrap;
}
</style>
