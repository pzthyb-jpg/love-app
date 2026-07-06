<template>
  <div class="page photo-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="emoji">📸</span>
      <h2>拍照打卡</h2>
    </div>

    <!-- 日期显示 -->
    <div class="card date-card">
      <div class="date-display">{{ todayDisplay }}</div>
    </div>

    <!-- 拍照区域 -->
    <div class="card camera-card">
      <div class="preview-area" ref="previewRef">
        <div v-if="cameraState === 'opening'" class="preview-loading">
          <van-loading type="spinner" color="var(--primary)" />
          <p>正在打开摄像头...</p>
        </div>
        <video v-else-if="cameraState === 'ready'" ref="videoRef" class="video-preview" autoplay playsinline></video>
        <img v-else-if="capturedPhoto" :src="capturedPhoto" class="photo-preview" />
        <div v-else class="preview-placeholder">
          <span class="placeholder-icon">📸</span>
          <p>点击下方按钮开始拍照</p>
        </div>
      </div>

      <!-- 拍照按钮 -->
      <div class="camera-actions">
        <van-button
          v-if="cameraState === 'idle'"
          type="primary" block
          @click="openCamera"
        >
          📸 咔嚓拍照
        </van-button>
        <van-button
          v-else-if="cameraState === 'opening'"
          type="primary" block
          disabled
        >
          ⏳ 正在打开摄像头...
        </van-button>
        <van-button
          v-else-if="cameraState === 'ready'"
          type="primary" block
          @click="takePhoto"
        >
          📸 咔嚓！拍照
        </van-button>
        <div v-else-if="cameraState === 'captured'" class="captured-actions">
          <van-button type="default" @click="retakePhoto">📸 再拍一张</van-button>
          <van-button type="primary" @click="confirmPhoto">❤️ 用这张</van-button>
        </div>
      </div>
    </div>

    <!-- 提醒设置 -->
    <div class="card reminder-card">
      <div class="reminder-header">
        <span class="reminder-icon">⏰</span>
        <span class="reminder-title">打卡提醒</span>
      </div>
      <div class="reminder-row">
        <div class="reminder-toggle">
          <span>中午提醒</span>
          <van-switch v-model="notifEnabled" @change="onToggleNotification" />
        </div>
        <div class="reminder-time-select">
          <span>时间</span>
          <select v-model="selectedReminderTime" class="reminder-select" @change="onReminderTimeChange">
            <option value="noon">中午 12:00</option>
            <option value="afternoon">下午 15:00</option>
            <option value="evening">傍晚 18:00</option>
            <option value="custom">自定义</option>
          </select>
        </div>
      </div>
      <div v-if="selectedReminderTime === 'custom'" class="reminder-custom-time">
        <input type="time" v-model="customReminderTime" class="input time-input" @change="scheduleReminder" />
      </div>
      <p v-if="reminderScheduled" class="reminder-status">
        ✅ 下次提醒 {{ nextReminderText }}
      </p>
    </div>

    <!-- 今日彩虹屁 -->
    <div v-if="compliment" class="card compliment-card">
      <div class="compliment-header">✨ 今日夸夸</div>
      <p class="compliment-text">"{{ compliment }}"</p>
      <p class="compliment-time">{{ currentTime }} · 已存档</p>
    </div>

    <!-- 照片墙 -->
    <div class="card photo-wall-section">
      <div class="section-header">
        <h3>📅 回忆照片墙</h3>
        <span class="section-subtitle">最近 {{ recentPhotos.length }} 天</span>
      </div>
      <div v-if="recentPhotos.length > 0" class="photo-grid">
        <div
          v-for="(item, index) in recentPhotos"
          :key="item.date"
          class="photo-thumb"
          @click="openGallery(index)"
        >
          <img :src="item.photo" :alt="item.date" />
        </div>
        <div v-if="recentPhotos.length === 0" class="empty-thumb">
          <span>📷</span>
        </div>
      </div>
      <div v-else class="empty-state" style="padding:var(--space-lg)">
        <p>还没有打卡记录哦，开始打卡吧 📸</p>
      </div>
    </div>

    <!-- 成就徽章 -->
    <div class="card badge-section">
      <h3>🏆 成就徽章</h3>
      <div class="badge-grid">
        <div
          v-for="badge in allBadges"
          :key="badge.id"
          class="badge-item"
          :class="{ earned: badge.earned }"
        >
          <div class="badge-icon" :style="{ background: badge.earned ? badge.color : 'var(--warm-pink)' }">
            {{ badge.emoji }}
          </div>
          <div class="badge-name">{{ badge.name }}</div>
          <div class="badge-days">{{ badge.days }}天</div>
        </div>
      </div>
      <div v-if="nextMilestone" class="badge-progress">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (nextMilestone.progress * 100) + '%' }"></div>
        </div>
        <span class="progress-text">下一个: {{ nextMilestone.name }} {{ nextMilestone.emoji }} (还差 {{ nextMilestone.remainingDays }} 天)</span>
      </div>
    </div>

    <!-- 通知开关 -->
    <div class="card notification-card">
      <div class="notification-toggle">
        <span>⏰ 中午打卡提醒</span>
        <van-switch v-model="notifEnabled" @change="onToggleNotification" />
      </div>
    </div>

    <!-- 全屏照片浏览 -->
    <Teleport to="body">
      <div v-if="galleryOpen" class="gallery-overlay" @click.self="closeGallery">
        <div class="gallery-close" @click="closeGallery">✕</div>
        <van-swipe ref="gallerySwipeRef" :loop="false" :show-indicators="true" class="gallery-swipe">
          <van-swipe-item v-for="(item, idx) in galleryPhotos" :key="idx" class="gallery-slide">
            <img :src="item.photo" :alt="item.date" />
            <div class="gallery-info">
              <p>{{ item.date }}</p>
              <p>{{ item.compliment }}</p>
            </div>
          </van-swipe-item>
        </van-swipe>
      </div>
    </Teleport>

    <!-- 成就庆祝动画 -->
    <Teleport to="body">
      <div v-if="showCelebration" class="dialog-overlay" @click.self="dismissCelebration">
        <div class="dialog-box celebration-box">
          <div class="celebration-emoji">{{ newBadge?.emoji }}</div>
          <h3>🎉 成就达成！</h3>
          <p>连续打卡 <strong>{{ newBadge?.days }}</strong> 天</p>
          <p class="celebration-name">{{ newBadge?.name }}</p>
          <van-button type="primary" @click="dismissCelebration" style="margin-top:var(--space-lg)">太棒了！❤️</van-button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { showToast } from 'vant'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import { getTodayStr, formatDate, calculateStreak, checkMilestone, getNextMilestone, BADGE_DEFINITIONS } from '../composables/useStreak.js'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'
import { safeGetJSON, safeSetJSON, safeGetString, safeSetString, STORAGE_KEYS, getPhotos } from '../composables/useStorage.js'

const { state, addCheckin, updateStreak, addBadge } = useDataStore()

const videoRef = ref(null)
const previewRef = ref(null)
const gallerySwipeRef = ref(null)

// 摄像头状态
const cameraState = ref('idle')  // idle | opening | ready | captured
const capturedPhoto = ref(null)
const compliment = ref('')
let mediaStream = null

// 画廊
const galleryOpen = ref(false)
const galleryPhotos = ref([])

// 庆祝
const showCelebration = ref(false)
const newBadge = ref(null)

const notifEnabled = ref(
  safeGetString(STORAGE_KEYS.NOTIFICATION_ENABLED, 'true') === 'true'
)

// ===== 提醒设置 =====
const KEY_REMINDER_TIME = 'reminder_time'
const KEY_CUSTOM_REMINDER_TIME = 'custom_reminder_time'

const selectedReminderTime = ref(safeGetString(KEY_REMINDER_TIME, 'noon'))
const customReminderTime = ref(safeGetString(KEY_CUSTOM_REMINDER_TIME, '12:00'))
const reminderScheduled = ref(false)
const nextReminderText = ref('')
let reminderTimer = null

// 提醒时间映射（时、分）
const REMINDER_TIME_MAP = {
  noon: [12, 0],
  afternoon: [15, 0],
  evening: [18, 0]
}

// 今日日期
const todayDisplay = computed(() => {
  const d = new Date()
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`
})

const currentTime = computed(() => {
  const d = new Date()
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
})

// 最近14天照片
const recentPhotos = computed(() => {
  const fourteenDaysAgo = new Date()
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
  const cutoff = formatDate(fourteenDaysAgo)
  return state.checkinHistory
    .filter(h => h.date >= cutoff && h.photo)
    .slice(0, 14)
})

// 全部徽章
const allBadges = computed(() => {
  return BADGE_DEFINITIONS.map(def => ({
    ...def,
    earned: state.checkinBadges.some(b => b.id === def.id)
  }))
})

// 下一个里程碑
const nextMilestone = computed(() => {
  const streak = calculateStreak(state.checkinHistory)
  return getNextMilestone(streak, state.checkinBadges)
})

// ===== 智能彩虹屁引擎 =====
const COMPLIMENT_TEMPLATES = {
  // 基础颜值
  beauty: [
    '{name}今天的你太让人心动了！💕',
    '今天的{name}也超好看！🌟',
    '我的{name}怎么可以这么可爱！🥰',
    '每天都被{name}的美貌击中！💘',
    '{name}的笑容是今天最好的礼物！🎁',
    '今天的{name}闪闪发光呢！✨',
    '看到{name}的照片，心都化了～💗',
    '{name}真是一天比一天好看！🌹',
    '这位仙女今天也下凡了呀！🧚‍♀️',
    '{name}的颜值今天也是满分！💯',
    '今天的{name}让我又心动了一次！💓',
    '{name}今天也太好看了吧！😍',
    '这个世界因为有{name}才美好！🌈',
    '{name}的照片是我今天最大的惊喜！🎀',
    '每次看到{name}都觉得好幸福！🦋',
  ],
  // 妆容相关
  makeup: [
    '今天的妆容也太精致了吧！像洋娃娃一样！💄',
    '这睫毛是真实存在的吗？忽闪忽闪的～✨',
    '口红颜色好好看！什么色号？🎨',
    '底妆好服帖！皮肤在发光诶！🌟',
    '眼睛里有星星！今天的妆容绝了！⭐',
    '这是仙女下凡吧？精致到每一根睫毛！🧚‍♀️',
    '化了妆的{name}是仙女本仙！👸',
    '今天的美貌又是犯规级别！🚨',
    '美妆博主看了都要来取经！💅',
    '这妆容简直是艺术品级别！🖼️',
  ],
  // 元气状态
  energy: [
    '看起来元气满满！今天一定会有好事发生！🍀',
    '眼神里有光！活力girl本人！⚡',
    '元气值拉满！可爱值也拉满！无死角可爱！💫',
    '今天的状态满分！像一个行走的小太阳！☀️',
    '看到{name}这么有活力，心情都跟着明亮了！🌞',
    '这就是元气少女的模样吧！活力四射！✨',
    '满血复活的状态！好看死了！🔥',
    '眼睛里藏着银河系！亮晶晶的！🌌',
    '精神满满的样子最帅了！光芒四射！🌟',
  ],
  // 节日/特殊日
  special: [
    '在这个特别的日子里，{name}格外好看！🎂',
    '纪念日的{name}，眼里都是爱意的模样！💖',
    '今天的你比平时更美！是有什么开心的事吗？😊',
    '特殊日子的{name}自带光环！👑',
    '连空气都是甜甜的！今天的你格外动人！🍬',
  ],
  // 早晨
  morning: [
    '早安的{name}最好看了！睡眼惺忪也美～🌅',
    '一日之计在于晨，清晨的{name}最好看！🌄',
    '刚睡醒就这么好看，不公平！😤💕',
    '今天的早安打卡！美貌营业中～📸',
  ],
  // 午间
  noon: [
    '午间的{name}温柔得像一杯奶茶！🍵💛',
    '中午也这么好看，是要让我心动一整天吗？💓',
    '午后的阳光和{name}一样温暖～☀️',
    '午饭时间来一波美颜暴击！😍',
  ],
  // 傍晚
  evening: [
    '傍晚的{name}像晚霞一样绚丽！🌆',
    '夕阳西下，{name}的颜值在线！🌇',
    '日落时分的{name}，温柔了整个世界～🌅',
    '晚风轻拂，{name}的发丝都在发光✨',
  ],
}

// 节日映射
const FESTIVALS = {
  '01-01': { name: '元旦', emoji: '🎆' },
  '02-14': { name: '情人节', emoji: '💝' },
  '03-08': { name: '女神节', emoji: '👸' },
  '03-14': { name: '白色情人节', emoji: '🤍' },
  '05-20': { name: '520', emoji: '💕' },
  '06-01': { name: '儿童节', emoji: '🧒' },
  '08-15': { name: '七夕', emoji: '💌' },
  '10-01': { name: '国庆节', emoji: '🇨🇳' },
  '12-24': { name: '平安夜', emoji: '🎄' },
  '12-25': { name: '圣诞节', emoji: '🎅' },
}

function generateCompliment() {
  const now = new Date()
  const hour = now.getHours()
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayFestival = FESTIVALS[monthDay]
  const name = state.girlfriendName || '宝贝'

  // 收集所有适用模板
  let selected = []
  selected = selected.concat(COMPLIMENT_TEMPLATES.beauty)

  // 根据时间段选择
  if (hour < 11) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.morning)
  } else if (hour < 14) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.noon)
  } else if (hour >= 17) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.evening)
  }

  // 增添妆容/元气模板
  if (Math.random() > 0.4) {
    const makeupOrEnergy = Math.random() > 0.5 ? COMPLIMENT_TEMPLATES.makeup : COMPLIMENT_TEMPLATES.energy
    selected = selected.concat(makeupOrEnergy)
  }

  // 特殊日/节日
  if (todayFestival) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.special)
  }

  // 随机选一条并替换昵称
  const tpl = selected[Math.floor(Math.random() * selected.length)]
  let result = tpl.replace(/{name}/g, name)

  // 有节日追加一句
  if (todayFestival && Math.random() > 0.5) {
    result += `\n${todayFestival.emoji} 今天是${todayFestival.name}，也要开开心心的哦~`
  }

  return result
}

// 打开摄像头
async function openCamera() {
  cameraState.value = 'opening'
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 540 }, height: { ideal: 540 } },
      audio: false
    })
    await nextTick()
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
    cameraState.value = 'ready'
  } catch (e) {
    showToast({ message: '😢 无法打开摄像头，请检查权限设置', type: 'fail' })
    cameraState.value = 'idle'
  }
}

// 拍照
function takePhoto() {
  if (!videoRef.value) return
  const canvas = document.createElement('canvas')
  canvas.width = 540
  canvas.height = 540
  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)  // 镜像翻转
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
  capturedPhoto.value = canvas.toDataURL('image/jpeg', 0.7)
  cameraState.value = 'captured'
  hapticFeedback(null, HAPTIC_PATTERNS.SHUTTER)
}

// 再拍一张
function retakePhoto() {
  capturedPhoto.value = null
  compliment.value = ''
  cameraState.value = 'ready'
}

// 确认照片
function confirmPhoto() {
  if (!capturedPhoto.value) return
  
  const today = getTodayStr()
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const comp = generateCompliment()
  compliment.value = comp
  
  // 保存打卡记录
  const record = {
    date: today,
    time,
    photo: capturedPhoto.value,
    compliment: comp,
    timestamp: now.getTime()
  }
  addCheckin(record)
  
  // 更新连续打卡
  const streak = calculateStreak(state.checkinHistory)
  updateStreak({
    streakDays: streak,
    lastCheckinDate: today,
    longestStreak: Math.max(streak, state.checkinStreak.longestStreak || 0),
    initialized: true
  })
  
  // 检查里程碑
  const milestone = checkMilestone(streak, state.checkinBadges)
  if (milestone) {
    addBadge(milestone)
    newBadge.value = milestone
    showCelebration.value = true
    hapticFeedback(null, HAPTIC_PATTERNS.ACHIEVEMENT)
  }
  
  // 关闭摄像头
  stopCamera()
  
  showToast({ message: '🎉 打卡成功！', type: 'success' })
}

// 关闭摄像头
function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
}

// 打开全屏画廊
function openGallery(index) {
  galleryPhotos.value = recentPhotos.value.map(p => ({
    photo: p.photo,
    date: p.date,
    compliment: p.compliment
  }))
  galleryOpen.value = true
  nextTick(() => {
    if (gallerySwipeRef.value) {
      gallerySwipeRef.value.swipeTo(index)
    }
  })
}

function closeGallery() {
  galleryOpen.value = false
}

function dismissCelebration() {
  showCelebration.value = false
  newBadge.value = null
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

// ===== 提醒调度 =====

function scheduleReminder() {
  cancelReminder()
  if (!notifEnabled.value) return

  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }

  const now = new Date()
  let targetHour, targetMinute

  if (selectedReminderTime.value === 'custom') {
    const parts = (customReminderTime.value || '12:00').split(':')
    targetHour = parseInt(parts[0])
    targetMinute = parseInt(parts[1])
  } else {
    const time = REMINDER_TIME_MAP[selectedReminderTime.value] || REMINDER_TIME_MAP.noon
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

function onReminderTimeChange() {
  safeSetString(KEY_REMINDER_TIME, selectedReminderTime.value)
  if (selectedReminderTime.value !== 'custom') {
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

// 安全读取辅助（已从 useStorage 导入 safeGetString/safeSetString）
// 保留内联版本作为兼容兜底
onMounted(() => {
  // 不自动请求通知权限 — 由用户操作触发（onToggleNotification）
  // 仅读取通知状态，如果已开启则调度定时器
  if (notifEnabled.value) {
    scheduleReminder()
  }
})

onUnmounted(() => {
  stopCamera()
  cancelReminder()
})
</script>

<style scoped>
/* 日期卡片 */
.date-card {
  text-align: center;
  padding: var(--space-md);
}
.date-display {
  font-size: var(--font-body);
  color: var(--text-secondary);
}

/* 拍照区域 */
.preview-area {
  width: 100%;
  height: 280px;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--warm-pink);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-lg);
  border: 2px solid rgba(232, 117, 138, 0.15);
}
.video-preview,
.photo-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-loading {
  text-align: center;
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-md);
}
.preview-loading p {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.preview-placeholder {
  text-align: center;
  color: var(--text-secondary);
}
.placeholder-icon {
  font-size: 48px;
  display: block;
  margin-bottom: var(--space-sm);
}
.captured-actions {
  display: flex;
  gap: var(--space-md);
}
.captured-actions .btn {
  flex: 1;
}

/* 彩虹屁卡片 */
.compliment-card {
  background: linear-gradient(135deg, var(--warm-pink), var(--cream));
  animation: complimentGlow 2s ease-in-out infinite alternate;
}
@keyframes complimentGlow {
  from { box-shadow: 0 2px 8px rgba(232, 117, 138, 0); }
  to { box-shadow: 0 2px 16px rgba(232, 117, 138, 0.12); }
}
.compliment-header {
  font-size: var(--font-body-small);
  color: var(--primary);
  font-weight: 600;
  margin-bottom: var(--space-sm);
}
.compliment-text {
  font-size: var(--font-h3);
  line-height: 1.6;
  color: var(--text);
}
.compliment-time {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: var(--space-sm);
}

/* 照片墙 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}
.section-header h3 {
  font-size: var(--font-h3);
  font-weight: 600;
}
.section-subtitle {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
}
.photo-thumb {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  background: var(--warm-pink);
  animation: thumbFadeIn 0.35s ease both;
}
.photo-thumb:nth-child(1) { animation-delay: 0ms; }
.photo-thumb:nth-child(2) { animation-delay: 40ms; }
.photo-thumb:nth-child(3) { animation-delay: 80ms; }
.photo-thumb:nth-child(4) { animation-delay: 120ms; }
.photo-thumb:nth-child(5) { animation-delay: 160ms; }
.photo-thumb:nth-child(6) { animation-delay: 200ms; }
.photo-thumb:nth-child(7) { animation-delay: 240ms; }
.photo-thumb:nth-child(8) { animation-delay: 280ms; }
.photo-thumb:nth-child(9) { animation-delay: 320ms; }
.photo-thumb:nth-child(n+10) { animation-delay: 360ms; }
@keyframes thumbFadeIn {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}
.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform var(--transition-normal);
}
.photo-thumb:active {
  transform: scale(0.92);
}
.photo-thumb:active img {
  transform: scale(1.05);
}
.empty-thumb {
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  background: var(--warm-pink);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--text-secondary);
}

/* 成就徽章 */
.badge-grid {
  display: flex;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}
.badge-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  opacity: 0.5;
  transition: opacity var(--transition-normal);
}
.badge-item.earned {
  opacity: 1;
}
.badge-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}
.badge-name {
  font-size: var(--font-caption);
  font-weight: 500;
}
.badge-days {
  font-size: var(--font-badge);
  color: var(--text-secondary);
}
.badge-progress {
  margin-top: var(--space-md);
}
.badge-progress .progress-text {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
  display: block;
}

/* 通知开关 */
.notification-card {
  padding: var(--space-md) var(--space-xl);
}
.notification-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.notification-toggle span {
  font-size: var(--font-body);
}

/* 全屏画廊 */
.gallery-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gallery-close {
  position: absolute;
  top: calc(var(--safe-top) + var(--space-md));
  right: var(--space-lg);
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255,255,255,0.15);
  color: white;
  font-size: 18px;
  z-index: 10;
  cursor: pointer;
}

.gallery-swipe {
  width: 100%;
  height: 80vh;
}

.gallery-slide {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gallery-slide img {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: var(--radius-md);
}

.gallery-info {
  text-align: center;
  margin-top: var(--space-lg);
  color: rgba(255,255,255,0.8);
}

.gallery-info p {
  font-size: var(--font-body);
  line-height: 1.5;
}

/* 庆祝弹窗 */
.celebration-box {
  text-align: center;
}
.celebration-emoji {
  font-size: 64px;
  margin-bottom: var(--space-md);
  animation: bounceIn 0.5s ease;
}
.celebration-name {
  font-size: var(--font-h2);
  font-weight: 700;
  color: var(--primary);
  margin-top: var(--space-sm);
}

/* 提醒设置 */
.reminder-card {
  padding: var(--space-lg) var(--space-xl);
}
.reminder-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}
.reminder-icon {
  font-size: 20px;
}
.reminder-title {
  font-size: var(--font-h3);
  font-weight: 600;
}
.reminder-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}
.reminder-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
}
.reminder-toggle span {
  font-size: var(--font-body-small);
  color: var(--text);
}
.reminder-time-select {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.reminder-time-select span {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}
.reminder-select {
  padding: var(--space-xs) var(--space-sm);
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: var(--font-caption);
  background: var(--white);
  color: var(--text);
  outline: none;
  appearance: auto;
}
.reminder-custom-time {
  margin-top: var(--space-md);
  padding-left: var(--space-md);
}
.reminder-custom-time .time-input {
  width: 120px;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-body-small);
  text-align: center;
}
.reminder-status {
  margin-top: var(--space-sm);
  font-size: var(--font-caption);
  color: var(--primary);
  font-weight: 500;
}
</style>
