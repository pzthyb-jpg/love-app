<template>
  <div class="page lunch-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="emoji">🍽️</span>
      <h2>午餐大转盘</h2>
    </div>

    <!-- 转盘区域 -->
    <div class="wheel-section">
      <LunchWheel
        ref="wheelRef"
        :restaurants="restaurantList"
        @spin-start="onSpinStart"
        @spin-end="onSpinEnd"
      />
      <p class="wheel-hint" v-if="restaurantList.length < 2">
        至少需要 2 家餐厅才能转哟 🥟
      </p>
    </div>

    <!-- 本周统计 -->
    <div class="card stats-card">
      <h3 class="card-title">📊 本周统计</h3>
      <div class="stats-row">
        <div class="stats-item">
          <span class="stats-value">{{ weekSpinCount }}</span>
          <span class="stats-label">本周已转</span>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <span class="stats-value">{{ todaySpinCount }}</span>
          <span class="stats-label">今天已转</span>
        </div>
        <div class="stats-divider"></div>
        <div class="stats-item">
          <span class="stats-value">{{ totalSpinCount }}</span>
          <span class="stats-label">累计</span>
        </div>
      </div>
      <div v-if="topRestaurants.length" class="top-list">
        <div class="top-label">🏆 最常吃 TOP3</div>
        <div class="top-items">
          <span
            v-for="(item, idx) in topRestaurants"
            :key="idx"
            class="top-tag"
          >
            {{ item.emoji }} {{ item.name }} ×{{ item.count }}
          </span>
        </div>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <Teleport to="body">
      <div v-if="showResult" class="dialog-overlay" @click.self="closeResult">
        <div class="dialog-box result-box">
          <div class="result-emoji">{{ resultRestaurant?.emoji || '🍽️' }}</div>
          <h3>{{ resultRestaurant?.name || '去吃这家吧！' }}</h3>
          <p class="result-sub">今天就去吃这个吧 🎉</p>
          <div class="result-actions">
            <button class="btn btn-primary btn-small" @click="confirmResult">
              好！去吃！ 🎉
            </button>
            <button class="btn btn-secondary btn-small" @click="spinAgainExclude">
              🔁 再转（排除当前）
            </button>
          </div>
          <div class="result-secondary-actions">
            <button class="btn btn-ghost btn-small" @click="navigateToRestaurant">
              📍 导航
            </button>
            <button class="btn btn-ghost btn-small" @click="toggleFavorite">
              {{ isFavorited ? '💔 取消收藏' : '❤️ 收藏' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 餐厅管理 -->
    <div class="card manage-card">
      <div class="manage-header" @click="showManage = !showManage">
        <h3 class="card-title">🏪 餐厅管理</h3>
        <span class="toggle-icon">{{ showManage ? '▲' : '▼' }}</span>
      </div>
      <div v-show="showManage" class="manage-body">
        <div class="restaurant-list">
          <div
            v-for="(r, idx) in restaurantList"
            :key="idx"
            class="restaurant-item"
          >
            <span class="r-emoji">{{ r.emoji }}</span>
            <span class="r-name">{{ r.name }}</span>
            <button class="r-delete" @click="confirmDelete(r)">❌</button>
          </div>
        </div>
        <div class="manage-actions">
          <div class="add-row">
            <input
              v-model="newRestaurantName"
              placeholder="输入餐厅名称"
              class="input"
              maxlength="20"
              @keyup.enter="handleAddRestaurant"
            />
            <button class="btn btn-primary btn-small" @click="handleAddRestaurant">
              ➕ 添加
            </button>
          </div>
          <button class="btn btn-ghost btn-small btn-block" @click="resetAllRestaurants">
            🔄 重置默认列表
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import LunchWheel from '../components/LunchWheel.vue'
import { getTodayStr } from '../composables/useStreak.js'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'

const { state, addLunchRecord, addRestaurant, removeRestaurant, resetRestaurants } = useDataStore()

const wheelRef = ref(null)
const showManage = ref(true)
const newRestaurantName = ref('')
const showResult = ref(false)
const resultRestaurant = ref(null)
const excludedList = ref([])
const favorites = ref(safeGetFavorites())

function safeGetFavorites() {
  try {
    return JSON.parse(localStorage.getItem('favorite_restaurants') || '[]')
  } catch { return [] }
}

function safeSaveFavorites(arr) {
  try { localStorage.setItem('favorite_restaurants', JSON.stringify(arr)) } catch {}
}

// 餐厅列表（排除已排除的）
const restaurantList = computed(() => {
  return state.restaurants.filter(r => !excludedList.value.includes(r.name))
})

// 本周转盘次数
const weekSpinCount = computed(() => {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  return state.lunchHistory.filter(h => h.date >= weekStartStr).length
})

const todaySpinCount = computed(() => {
  const today = getTodayStr()
  return state.lunchHistory.filter(h => h.date === today).length
})

const totalSpinCount = computed(() => state.lunchHistory.length)

// TOP3 最常吃
const topRestaurants = computed(() => {
  const counts = {}
  state.lunchHistory.forEach(h => {
    counts[h.restaurant] = (counts[h.restaurant] || 0) + 1
  })
  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => {
      const r = state.restaurants.find(r => r.name === name)
      return { name, emoji: r?.emoji || '🍽️', count }
    })
  return items
})

const isFavorited = computed(() => {
  if (!resultRestaurant.value) return false
  return favorites.value.includes(resultRestaurant.value.name)
})

function onSpinStart() {
  showResult.value = false
  resultRestaurant.value = null
}

function onSpinEnd(winner) {
  resultRestaurant.value = winner
  showResult.value = true

  // 记录
  const now = new Date()
  addLunchRecord({
    restaurant: winner.name,
    date: getTodayStr(),
    time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  })

  hapticFeedback(null, HAPTIC_PATTERNS.SPIN_STOP)
}

function closeResult() {
  showResult.value = false
}

function confirmResult() {
  showResult.value = false
  window.__showToast?.('🎉 去吃 ' + resultRestaurant.value.name + '！', 'success')
}

function spinAgainExclude() {
  if (resultRestaurant.value) {
    excludedList.value.push(resultRestaurant.value.name)
  }
  showResult.value = false
  resultRestaurant.value = null
  nextTick(() => {
    wheelRef.value?.startSpin()
  })
}

function navigateToRestaurant() {
  if (!resultRestaurant.value) return
  const name = encodeURIComponent(resultRestaurant.value.name)
  // 高德地图 URI Scheme
  const amapUrl = `https://uri.amap.com/search?keyword=${name}&src=loveapp`
  window.location.href = amapUrl
}

function toggleFavorite() {
  if (!resultRestaurant.value) return
  const name = resultRestaurant.value.name
  const idx = favorites.value.indexOf(name)
  if (idx >= 0) {
    favorites.value.splice(idx, 1)
  } else {
    favorites.value.push(name)
  }
  safeSaveFavorites(favorites.value)
}

function handleAddRestaurant() {
  const name = newRestaurantName.value.trim()
  if (!name) return
  if (state.restaurants.some(r => r.name === name)) {
    window.__showToast?.('该餐厅已存在', 'error')
    return
  }
  // 随机选一个 emoji
  const emojis = ['🍜', '🍕', '🥗', '🍚', '🌮', '🍣', '🥘', '🍝', '🍛', '🥪', '🌯', '🥟']
  const emoji = emojis[Math.floor(Math.random() * emojis.length)]
  addRestaurant({ name, emoji, distance: '—', rating: 0, tags: [] })
  newRestaurantName.value = ''
  window.__showToast?.(`已添加 ${name}`, 'success')
}

function confirmDelete(r) {
  const result = window.confirm(`确定删除「${r.name}」吗？`)
  if (result) {
    removeRestaurant(r.name)
    window.__showToast?.(`已删除 ${r.name}`, 'info')
  }
}

function resetAllRestaurants() {
  const result = window.confirm('重置为默认餐厅列表？自定义餐厅将被清除。')
  if (result) {
    resetRestaurants()
    excludedList.value = []
    window.__showToast?.('已重置默认餐厅列表', 'success')
  }
}

// 确保至少有 2 家餐厅可转
const canSpin = computed(() => restaurantList.value.length >= 2)
</script>

<style scoped>
.lunch-page {
  padding-bottom: calc(var(--space-3xl) + var(--safe-bottom));
}

/* 转盘区域 */
.wheel-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-lg) 0 var(--space-xl);
}

.wheel-hint {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-top: var(--space-md);
  text-align: center;
}

/* 统计卡片 */
.stats-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-lg);
}

.stats-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stats-value {
  font-size: 28px;
  font-weight: 800;
  color: var(--primary);
}

.stats-label {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.stats-divider {
  width: 1px;
  height: 36px;
  background: var(--border);
}

.top-list {
  margin-top: var(--space-lg);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border);
}

.top-label {
  font-size: var(--font-body-small);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-sm);
}

.top-items {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.top-tag {
  padding: var(--space-xs) var(--space-md);
  background: linear-gradient(135deg, var(--warm-pink), var(--peach));
  border-radius: var(--radius-round);
  font-size: var(--font-caption);
  font-weight: 500;
  color: var(--text);
}

/* 结果弹窗 */
.result-box {
  padding: var(--space-2xl);
}

.result-emoji {
  font-size: 56px;
  margin-bottom: var(--space-md);
  animation: bounceIn 0.5s ease;
}

.result-sub {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-bottom: var(--space-lg);
}

.result-actions {
  display: flex;
  gap: var(--space-md);
  justify-content: center;
  margin-bottom: var(--space-md);
  flex-wrap: wrap;
}

.result-secondary-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: center;
}

.result-secondary-actions .btn-ghost {
  font-size: var(--font-caption);
  padding: var(--space-xs) var(--space-md);
}

/* 餐厅管理 */
.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.manage-header .toggle-icon {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.manage-body {
  margin-top: var(--space-lg);
}

.restaurant-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
  max-height: 240px;
  overflow-y: auto;
}

.restaurant-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--warm-pink);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.restaurant-item:active {
  background: var(--peach);
}

.r-emoji {
  font-size: 18px;
  width: 28px;
  text-align: center;
}

.r-name {
  flex: 1;
  font-size: var(--font-body);
  color: var(--text);
}

.r-delete {
  background: none;
  border: none;
  font-size: 14px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.5;
  transition: opacity var(--transition-fast);
}

.r-delete:active {
  opacity: 1;
}

.add-row {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.add-row .input {
  flex: 1;
}

/* 移动端适配 */
@media (min-width: 768px) {
  .lunch-page {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>
