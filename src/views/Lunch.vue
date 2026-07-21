<template>
  <div class="page lunch-page">
    <!-- Header: 城市选择 + 胶囊 Tab -->
    <div class="lunch-header">
      <div class="city-selector" @click="showCityPicker = true">
        <span class="city-name">📍 {{ currentCity }}</span>
        <span class="city-arrow">▼</span>
      </div>
      <div class="capsule-tabs">
        <button
          :class="['capsule-btn', { active: activeTab === 'wheel' }]"
          @click="activeTab = 'wheel'"
        >转圈</button>
        <button
          :class="['capsule-btn', { active: activeTab === 'nearby' }]"
          @click="activeTab = 'nearby'"
        >附近</button>
      </div>
    </div>

    <!-- Tab: 转圈 -->
    <div v-show="activeTab === 'wheel'" class="tab-content">
      <!-- 转盘区域 -->
      <div class="wheel-section">
        <LunchWheel
          ref="wheelRef"
          :restaurants="favoritesList"
          @spin-start="onSpinStart"
          @spin-end="onSpinEnd"
        />
        <p class="wheel-hint" v-if="favoritesList.length < 2">
          {{ favoritesList.length === 0 ? '去「附近」收藏餐厅，开始转吧 🥟' : '至少需要 2 家餐厅才能转哟 🥟' }}
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
            <span v-for="(item, idx) in topRestaurants" :key="idx" class="top-tag">
              {{ item.emoji }} {{ item.name }} ×{{ item.count }}
            </span>
          </div>
        </div>
      </div>

      <!-- 餐厅管理 -->
      <div class="card manage-card">
        <van-collapse v-model="showManage" :accordion="true" class="manage-collapse">
          <van-collapse-item title="🏪 餐厅管理" name="manage">
            <div class="restaurant-list">
              <div v-for="(r, idx) in favoritesList" :key="idx" class="restaurant-item">
                <span class="r-emoji">{{ r.emoji || '🍽️' }}</span>
                <span class="r-name">{{ r.name }}</span>
                <button class="r-delete" @click="handleUnfavorite(r)">💔</button>
              </div>
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>
    </div>

    <!-- Tab: 附近 -->
    <div v-show="activeTab === 'nearby'" class="tab-content">
      <!-- 定位中 -->
      <div v-if="locating" class="location-loading">
        <div class="sp"></div>
        <p>正在定位你所在的城市...</p>
      </div>

      <!-- 已定位：POI 列表 -->
      <div v-else>
        <!-- 搜索 + 分类 -->
        <div class="filter-bar">
          <div class="sb">
            <input
              v-model="searchKeyword"
              placeholder="搜索餐厅名称"
              class="si"
            />
          </div>
          <div class="tags">
            <span
              v-for="cat in categories"
              :key="cat"
              :class="['tag', { active: activeCategory === cat }]"
              @click="activeCategory = cat"
            >{{ cat }}</span>
          </div>
        </div>

        <!-- POI 列表 -->
        <div class="poi-list">
          <div v-for="r in filteredRestaurants" :key="r.id" class="poi-card">
            <div class="poi-info">
              <div class="poi-name">{{ r.emoji }} {{ r.name }}</div>
              <div class="poi-meta">
                <span class="poi-star">★{{ r.rating }}</span>
                <span class="poi-dot">·</span>
                <span class="poi-dist">{{ r.distance }}</span>
                <span class="poi-dot">·</span>
                <span class="poi-cat">{{ r.tags?.[0] || '餐厅' }}</span>
              </div>
              <div class="poi-addr">{{ r.address }}</div>
            </div>
            <button
              :class="['fav-btn', { active: isFavorite(r.id) }]"
              @click="handleToggleFavorite(r)"
            >{{ isFavorite(r.id) ? '♥' : '♡' }}</button>
          </div>
          <div v-if="filteredRestaurants.length === 0" class="poi-empty">
            <p>没有找到相关餐厅</p>
          </div>
        </div>
        <div class="poi-foot">数据来自高德，仅展示 3000m 内</div>
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
            <van-button type="primary" size="small" @click="confirmResult">
              好！去吃！ 🎉
            </van-button>
            <van-button type="default" size="small" @click="spinAgainExclude">
              🔁 再转（排除当前）
            </van-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 城市选择弹窗 -->
    <Teleport to="body">
      <div v-if="showCityPicker" class="dialog-overlay" @click.self="showCityPicker = false">
        <div class="dialog-box city-picker">
          <h4>选择城市</h4>
          <div class="city-grid">
            <button
              v-for="city in availableCities"
              :key="city"
              :class="['city-btn', { active: currentCity === city }]"
              @click="handleChangeCity(city)"
            >{{ city }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <div :class="['toast', { show: toastVisible }]">{{ toastMessage }}</div>
  </div>
</template>

<script setup>
import { showToast } from 'vant'
import { ref, computed, onMounted } from 'vue'
import LunchWheel from '../components/LunchWheel.vue'
import { getTodayStr } from '../composables/useStreak.js'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'
import { launchConfetti } from '../utils/confetti.js'
import { useDataStore } from '../stores/dataStore.js'
import {
  favorites, restaurants, currentCity, userLat, userLon,
  categories, activeCategory, searchKeyword, locating, locationReady,
  filteredRestaurants, searchNearby, locateAndSearch, toggleFavorite, isFavorite, spinWheel, setLocation
} from '../composables/useRestaurants.js'

const { state, addLunchRecord } = useDataStore()

// Tab 状态
const activeTab = ref('wheel')
const showCityPicker = ref(false)
const availableCities = ['北京', '上海', '深圳', '成都', '杭州', '宁波', '温州', '绍兴']

// 转圈相关
const wheelRef = ref(null)
const showResult = ref(false)
const resultRestaurant = ref(null)
const showManage = ref('')
const excludedIds = ref([])

// Toast
const toastVisible = ref(false)
const toastMessage = ref('')
let toastTimer = null

function showToastMsg(msg) {
  toastMessage.value = msg
  toastVisible.value = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastVisible.value = false }, 2000)
}

// 收藏列表（用于转圈）
const favoritesList = computed(() => {
  return favorites.value
    .filter(f => !excludedIds.value.includes(f.id))
    .map(f => ({
      name: f.name,
      emoji: f.emoji,
      id: f.id
    }))
})

// 统计
const weekSpinCount = computed(() => {
  const today = new Date()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))
  const weekStartStr = weekStart.toISOString().slice(0, 10)
  return state.lunchHistory.filter(h => h.date >= weekStartStr).length
})

const todaySpinCount = computed(() => {
  return state.lunchHistory.filter(h => h.date === getTodayStr()).length
})

const totalSpinCount = computed(() => state.lunchHistory.length)

const topRestaurants = computed(() => {
  const counts = {}
  state.lunchHistory.forEach(h => { counts[h.restaurant] = (counts[h.restaurant] || 0) + 1 })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, count]) => {
      const f = favorites.value.find(f => f.name === name)
      return { name, emoji: f?.emoji || '🍽️', count }
    })
})

// 转圈逻辑
function onSpinStart() {
  showResult.value = false
  resultRestaurant.value = null
}

function onSpinEnd(winner) {
  resultRestaurant.value = winner
  showResult.value = true
  const now = new Date()
  addLunchRecord({
    restaurant_name: winner.name,
    selected_at: new Date().toISOString()
  })
  hapticFeedback(null, HAPTIC_PATTERNS.SPIN_STOP)
  launchConfetti()
}

function closeResult() {
  showResult.value = false
  excludedIds.value = []
}

function confirmResult() {
  showResult.value = false
  showToast({ message: `🎉 去吃 ${resultRestaurant.value.name}！`, type: 'success' })
  excludedIds.value = []
}

function spinAgainExclude() {
  if (resultRestaurant.value) {
    excludedIds.value.push(resultRestaurant.value.id)
  }
  showResult.value = false
  resultRestaurant.value = null
  setTimeout(() => wheelRef.value?.startSpin(), 100)
}

// 收藏/取消收藏
function handleToggleFavorite(r) {
  toggleFavorite(r)
  showToastMsg(isFavorite(r.id) ? '已收藏，可以在「转圈」中选它了' : '已取消收藏')
}

function handleUnfavorite(r) {
  toggleFavorite(r)
  showToastMsg('已取消收藏')
}

// 切换城市
async function handleChangeCity(city) {
  showCityPicker.value = false
  locating.value = true
  try {
    setLocation(city, 0, 0)
    await searchNearby()
    showToastMsg(`已切换到 ${city}`)
  } catch (e) {
    showToastMsg('搜索失败，请稍后重试')
  }
  locating.value = false
}

// 初始化：自动定位 + 搜索附近
onMounted(async () => {
  await locateAndSearch()
})
</script>

<style scoped>
.lunch-page {
  padding-bottom: calc(var(--space-3xl) + var(--safe-bottom));
  min-height: 100%;
}

/* ===== Header ===== */
.lunch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  background: var(--bg);
  position: sticky;
  top: 0;
  z-index: 50;
}

.city-selector {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  flex-shrink: 0;
}

.city-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.city-arrow {
  font-size: 10px;
  color: var(--text-secondary);
}

.capsule-tabs {
  display: flex;
  border: 1.5px solid var(--primary);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(232, 117, 138, 0.15);
}

.capsule-btn {
  padding: 6px 22px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  font-weight: 500;
  font-family: inherit;
  transition: all 0.2s;
}

.capsule-btn.active {
  background: var(--primary);
  color: var(--white);
}

html[data-theme="dark"] .capsule-btn.active {
  color: #FFFFFF;
}

/* ===== Tab Content ===== */
.tab-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* ===== 转圈 Tab ===== */
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

/* ===== 附近 Tab ===== */
.location-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  gap: 16px;
}

.sp {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.location-loading p {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 搜索 + 分类 */
.filter-bar {
  padding: 8px 16px 0;
}

.sb {
  position: relative;
  margin-bottom: 8px;
}

.sb input {
  width: 100%;
  padding: 10px 14px 10px 36px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  background: var(--white);
  outline: none;
  box-sizing: border-box;
}

.sb input:focus {
  border-color: var(--primary);
}

.sb::before {
  content: '🔍';
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
}

.tags {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
  scrollbar-width: none;
}

.tags::-webkit-scrollbar {
  display: none;
}

.tag {
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--white);
  color: var(--text-secondary);
  transition: all 0.15s;
}

.tag.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

html[data-theme="dark"] .tag.active {
  color: #FFFFFF;
}

/* POI 列表 */
.poi-list {
  padding: 8px 16px;
  flex: 1;
  min-height: 0;
}

.poi-card {
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: all 0.15s ease;
}

.poi-card:active {
  transform: scale(0.98);
}

.poi-info {
  flex: 1;
  min-width: 0;
}

.poi-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.poi-meta {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.poi-star {
  color: #F5A623;
}

.poi-dot {
  opacity: 0.5;
}

.poi-addr {
  font-size: 11px;
  color: var(--text-secondary);
  opacity: 0.7;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fav-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: var(--white);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  transition: all 0.15s;
}

.fav-btn.active {
  border-color: var(--primary);
  background: #FFF0F3;
  color: var(--primary);
}

html[data-theme="dark"] .fav-btn.active {
  background: rgba(232, 117, 138, 0.2);
}

.poi-empty {
  text-align: center;
  padding: 40px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.poi-foot {
  text-align: center;
  font-size: 11px;
  color: var(--text-secondary);
  padding: 12px 16px 8px;
  opacity: 0.7;
}

/* ===== 统计卡片 ===== */
.stats-card {
  margin: 0 16px;
}

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

/* ===== 结果弹窗 ===== */
.result-box {
  padding: var(--space-2xl);
  text-align: center;
}

.result-emoji {
  font-size: 56px;
  margin-bottom: var(--space-md);
  animation: bounceIn 0.5s ease;
}

.result-box h3 {
  font-size: var(--font-h2);
  font-weight: 700;
  color: var(--text);
  margin-bottom: var(--space-xs);
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
  flex-wrap: wrap;
}

/* ===== 城市选择弹窗 ===== */
.city-picker {
  padding: 24px;
}

.city-picker h4 {
  font-size: 16px;
  margin-bottom: 16px;
  color: var(--text);
}

.city-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.city-btn {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  font-size: 14px;
  cursor: pointer;
  color: var(--text);
  transition: all 0.15s;
}

.city-btn.active {
  background: var(--primary);
  color: var(--white);
  border-color: var(--primary);
}

html[data-theme="dark"] .city-btn.active {
  color: #FFFFFF;
}

/* ===== 餐厅管理 ===== */
.manage-card {
  margin: 0 16px;
  padding: 0;
  overflow: hidden;
}

.manage-collapse {
  --van-collapse-title-background: transparent;
  --van-collapse-title-font-size: 17px;
  --van-collapse-title-font-weight: 600;
  --van-collapse-title-padding: var(--space-lg) var(--space-xl);
  --van-collapse-content-background: transparent;
  --van-collapse-content-padding: 0 var(--space-xl) var(--space-xl);
}

.restaurant-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 200px;
  overflow-y: auto;
}

.restaurant-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--warm-pink);
  border-radius: var(--radius-sm);
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
  opacity: 0.6;
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: #FFFFFF;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 13px;
  opacity: 0;
  z-index: 300;
  pointer-events: none;
  max-width: 320px;
  text-align: center;
  transition: opacity 0.3s;
}

.toast.show {
  opacity: 1;
}

/* ===== Dialog Overlay (Teleport) - 使用全局样式 ===== */

/* ===== 移动端适配 ===== */
@media (min-width: 768px) {
  .lunch-page {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>
