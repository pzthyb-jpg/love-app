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
        <img v-else-if="capturedPhoto && cameraState === 'captured'" :src="capturedPhoto" class="photo-preview" />
        <div v-else-if="cameraState === 'preview'" class="preview-container">
          <img :src="capturedPhoto" class="photo-preview" />
          <div class="preview-overlay">
            <div class="preview-compliment">"{{ compliment }}"</div>
            <div class="preview-actions">
              <van-button type="default" @click="retakePhoto">📸 重拍</van-button>
              <van-button type="primary" @click="confirmPhoto">✅ 确认打卡</van-button>
            </div>
          </div>
        </div>
        <div v-else class="preview-placeholder">
          <span class="placeholder-icon">📸</span>
          <p>点击下方按钮开始拍照</p>
        </div>
      </div>

      <!-- 拍照按钮 -->
      <div class="camera-actions">
        <van-button v-if="cameraState === 'idle'" type="primary" block @click="openCamera">
          📸 咔嚓拍照
        </van-button>
        <van-button v-else-if="cameraState === 'opening'" type="primary" block disabled>
          ⏳ 正在打开摄像头...
        </van-button>
        <van-button v-else-if="cameraState === 'ready'" type="primary" block @click="takePhoto">
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
        <input type="time" v-model="customReminderTime" class="input time-input" @change="onCustomTimeChange" />
      </div>
      <p v-if="reminderScheduled" class="reminder-status">✅ 下次提醒 {{ nextReminderText }}</p>
    </div>

    <!-- 今日彩虹屁 -->
    <ComplimentCard :compliment="compliment" :time="currentTime" />

    <!-- 照片墙 -->
    <PhotoWall :photos="recentPhotos" @open="openGallery" />

    <!-- 成就徽章 -->
    <BadgeGrid :badges="allBadges" :next="nextMilestone" />

    <!-- 全屏照片浏览 -->
    <GalleryOverlay
      :visible="galleryOpen"
      :photos="galleryPhotos"
      :initial-index="galleryIndex"
      @close="galleryOpen = false"
    />

    <!-- 摄像头权限引导弹窗 -->
    <CameraGuideModal
      :visible="showCameraGuide"
      @close="showCameraGuide = false"
      @openSettings="openAppSettings"
    />

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
import { calculateStreak, checkMilestone, getNextMilestone, BADGE_DEFINITIONS } from '../composables/useStreak.js'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'
import { useReminder } from '../composables/useReminder.js'
import { generateCompliment } from '../composables/useCompliments.js'

import ComplimentCard from '../components/ComplimentCard.vue'
import PhotoWall from '../components/PhotoWall.vue'
import BadgeGrid from '../components/BadgeGrid.vue'
import GalleryOverlay from '../components/GalleryOverlay.vue'
import CameraGuideModal from '../components/CameraGuideModal.vue'

const { state, girlfriendName, checkinStreak, addCheckin, updateStreak, addBadge } = useDataStore()

const videoRef = ref(null)
const previewRef = ref(null)

// 摄像头状态
const cameraState = ref('idle')
const capturedPhoto = ref(null)
const compliment = ref('')
let mediaStream = null

// 弹窗
const showCameraGuide = ref(false)
const showCelebration = ref(false)
const newBadge = ref(null)

// 画廊
const galleryOpen = ref(false)
const galleryPhotos = ref([])
const galleryIndex = ref(0)

// 提醒
const {
  notifEnabled,
  reminderTime: selectedReminderTime,
  customReminderTime,
  reminderScheduled,
  nextReminderText,
  onToggleNotification,
  onReminderTimeChange,
  onCustomTimeChange,
  scheduleReminder,
  cancelReminder
} = useReminder()

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
  return state.checkinHistory.filter(h => h.date >= cutoff && h.photo).slice(0, 14)
})

// 全部徽章
const allBadges = computed(() => {
  return BADGE_DEFINITIONS.map(def => ({
    ...def,
    earned: (state.checkinStats?.badges || []).some(b => b.id === def.id)
  }))
})

// 下一个里程碑
const nextMilestone = computed(() => {
  const streak = calculateStreak(state.checkinHistory)
  return getNextMilestone(streak, state.checkinStats?.badges || [])
})

// formatDate 辅助
function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
    cameraState.value = 'idle'
    showCameraGuide.value = true
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
  ctx.scale(-1, 1)
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
  capturedPhoto.value = canvas.toDataURL('image/jpeg', 0.7)
  compliment.value = generateCompliment(girlfriendName.value)
  cameraState.value = 'preview'
  hapticFeedback(null, HAPTIC_PATTERNS.SHUTTER)
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
}

// 重拍
function retakePhoto() {
  cameraState.value = 'opening'
  capturedPhoto.value = null
  compliment.value = ''
  openCamera()
}

// 打开应用设置
function openAppSettings() {
  showCameraGuide.value = false
  if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    window.open('app-settings:', '_self')
  } else if (navigator.userAgent.match(/Android/i)) {
    window.open('package:' + location.host, '_self')
  }
  setTimeout(() => {
    showToast({ message: '请手动打开系统设置 > 应用 > 权限', type: 'fail' })
  }, 500)
}

// 确认打卡
function confirmPhoto() {
  if (!capturedPhoto.value) return
  const today = formatDate(new Date())
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const comp = generateCompliment(girlfriendName.value)
  compliment.value = comp

  addCheckin({ date: today, time, photo: capturedPhoto.value, compliment: comp, timestamp: now.getTime() })

  const streak = calculateStreak(state.checkinHistory)
  updateStreak({
    streakDays: streak,
    lastCheckinDate: today,
    longestStreak: Math.max(streak, checkinStreak.value?.longestStreak || 0),
    initialized: true
  })

  const milestone = checkMilestone(streak, state.checkinStats?.badges || [])
  if (milestone) {
    addBadge(milestone)
    newBadge.value = milestone
    showCelebration.value = true
    hapticFeedback(null, HAPTIC_PATTERNS.ACHIEVEMENT)
  }

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

// 画廊操作
function openGallery(index) {
  galleryPhotos.value = recentPhotos.value.map(p => ({ photo: p.photo, date: p.date, compliment: p.compliment }))
  galleryIndex.value = index
  galleryOpen.value = true
}

function dismissCelebration() {
  showCelebration.value = false
  newBadge.value = null
}

onMounted(() => {
  if (notifEnabled.value) scheduleReminder()
})

onUnmounted(() => {
  stopCamera()
  cancelReminder()
})
</script>

<style scoped>
.date-card { text-align: center; padding: var(--space-md); }
.date-display { font-size: var(--font-body); color: var(--text-secondary); }

.preview-area {
  width: 100%; height: 280px; border-radius: var(--radius-md); overflow: hidden;
  background: var(--warm-pink); display: flex; align-items: center; justify-content: center;
  margin-bottom: var(--space-lg); border: 2px solid rgba(232, 117, 138, 0.15); position: relative;
}
.preview-container { position: relative; width: 100%; height: 100%; }
.preview-overlay {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: var(--space-lg); color: white;
}
.preview-compliment { font-size: var(--font-body); line-height: 1.5; margin-bottom: var(--space-md); text-align: center; }
.preview-actions { display: flex; gap: var(--space-md); justify-content: center; }

.video-preview, .photo-preview { width: 100%; height: 100%; object-fit: cover; }
.preview-loading { text-align: center; color: var(--text-secondary); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-md); }
.preview-loading p { font-size: var(--font-body-small); color: var(--text-secondary); }
.preview-placeholder { text-align: center; color: var(--text-secondary); }
.placeholder-icon { font-size: 48px; display: block; margin-bottom: var(--space-sm); }
.captured-actions { display: flex; gap: var(--space-md); }
.captured-actions .btn { flex: 1; }

.celebration-box { text-align: center; }
.dialog-box { background: var(--white); border-radius: 16px; width: 85%; max-width: 360px; padding: var(--space-2xl); }
.dialog-box h3 { font-size: var(--font-h2); font-weight: 700; color: var(--text); margin-bottom: var(--space-sm); box-shadow: none; }
.celebration-emoji { font-size: 64px; margin-bottom: var(--space-md); animation: bounceIn 0.5s ease; }
.celebration-name { font-size: var(--font-h2); font-weight: 700; color: var(--primary); margin-top: var(--space-sm); }

.reminder-card { padding: var(--space-lg) var(--space-xl); }
.reminder-header { display: flex; align-items: center; gap: var(--space-sm); margin-bottom: var(--space-lg); }
.reminder-icon { font-size: 20px; }
.reminder-title { font-size: var(--font-h3); font-weight: 600; }
.reminder-row { display: flex; justify-content: space-between; align-items: center; gap: var(--space-md); }
.reminder-toggle { display: flex; align-items: center; gap: var(--space-sm); flex: 1; }
.reminder-toggle span { font-size: var(--font-body-small); color: var(--text); }
.reminder-time-select { display: flex; align-items: center; gap: var(--space-sm); }
.reminder-time-select span { font-size: var(--font-caption); color: var(--text-secondary); }
.reminder-select { padding: var(--space-xs) var(--space-sm); border: 1.5px solid var(--border); border-radius: var(--radius-sm); font-size: var(--font-caption); background: var(--white); color: var(--text); outline: none; appearance: auto; }
.reminder-custom-time { margin-top: var(--space-md); padding-left: var(--space-md); }
.reminder-custom-time .time-input { width: 120px; padding: var(--space-xs) var(--space-sm); font-size: var(--font-body-small); text-align: center; }
.reminder-status { margin-top: var(--space-sm); font-size: var(--font-caption); color: var(--primary); font-weight: 500; }
</style>
