<template>
  <div class="page location-share-page">
    <!-- 顶部搜索栏 -->
    <div class="search-bar">
      <van-field
        v-model="searchKeyword"
        placeholder="搜索用户名..."
        left-icon="search"
        clearable
        class="search-input"
        @focus="onSearchFocus"
        @blur="onSearchBlur"
        @input="onSearchInput"
      />
      <div class="bell-btn" @click="showInvites = true">
        <span class="bell-icon">🔔</span>
        <span v-if="pendingCount > 0" class="bell-badge">{{ pendingCount }}</span>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-if="showResults && searchResults.length > 0" class="search-results">
      <div
        v-for="user in searchResults"
        :key="user.id"
        class="search-item"
        @mousedown.prevent=""
        @click="onSelectUser(user)"
      >
        <span class="user-emoji">👤</span>
        <span class="user-name">{{ user.display_name || user.username }}</span>
        <span class="user-username">@{{ user.username }}</span>
      </div>
    </div>

    <!-- 搜索结果为空 -->
    <div v-else-if="showResults && searchKeyword.length >= 2 && !isSearching" class="search-empty">
      未找到用户
    </div>

    <!-- 地图区域 -->
    <div class="map-container">
      <div id="location-map" class="map" :style="{ height: mapHeight + 'px' }"></div>
      <!-- 定位按钮 -->
      <button class="locate-btn" @click="centerOnMe">📍</button>
    </div>

    <!-- 定位权限提示条 -->
    <div v-if="showPermissionTip" class="permission-tip">
      <span>📍 请开启位置权限以使用位置共享</span>
      <button class="tip-btn" @click="openLocationSettings">前往设置</button>
      <button class="tip-close" @click="showPermissionTip = false">✕</button>
    </div>

    <!-- 底部空状态 -->
    <div v-if="!hasActiveShares" class="empty-state">
      <div class="empty-emoji">🗺️</div>
      <p class="empty-title">还没人在共享位置</p>
      <p class="empty-desc">搜索好友，邀请 TA 开始共享</p>
    </div>

    <!-- 底部抽屉 -->
    <div v-else class="bottom-drawer" :class="{ expanded: drawerExpanded, collapsed: !drawerExpanded }" :style="{ height: drawerHeight + 'px' }">
      <div class="drawer-handle" @click="toggleDrawer">
        <div class="drawer-bar"></div>
      </div>

      <div class="drawer-content">
        <div class="drawer-header">
          <span class="drawer-title">共享中</span>
          <span class="drawer-subtitle">{{ activeShares.length }} 人</span>
        </div>

        <!-- 共享卡片列表 -->
        <div class="share-cards">
          <div
            v-for="share in activeShares"
            :key="share.id"
            class="share-card-wrapper"
          >
            <div class="share-card" @click="centerOnPartner(share)">
              <div class="card-avatar">
                <span>👤</span>
                <span v-if="isPartnerOnline(share)" class="online-dot"></span>
              </div>
              <div class="card-info">
                <div class="card-name">{{ getPartnerName(share) }}</div>
                <div class="card-meta">
                  <span v-if="getPartnerLocation(share)">
                    📍 {{ formatDistance(calcDistance(myLat, myLng, getPartnerLocation(share).latitude, getPartnerLocation(share).longitude)) }}
                  </span>
                  <span class="card-time">
                    {{ formatTime(getPartnerLocation(share)?.created_at) }}
                  </span>
                </div>
                <div v-if="getPartnerAddress(share)" class="card-address">
                  📍 {{ getPartnerAddress(share) }}
                </div>
              </div>
              <button class="navigate-btn" @click.stop="openNavigation(share)">
                🧭
              </button>
            </div>
            <button class="close-share-btn" @click="onCloseShare(share)">
              关闭共享
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请确认弹窗 -->
    <Teleport to="body">
      <div v-if="showInviteConfirm" class="dialog-overlay" @click.self="showInviteConfirm = false">
        <div class="dialog-box">
          <h3>发送位置共享邀请</h3>
          <p class="dialog-desc">确定向 <strong>{{ selectedUser?.display_name || selectedUser?.username }}</strong> 发送邀请？</p>
          <p class="dialog-note">对方将能看到你的实时位置</p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showInviteConfirm = false">取消</button>
            <button class="btn btn-primary" @click="confirmSendInvite">确认发送</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 邀请列表弹窗 -->
    <Teleport to="body">
      <div v-if="showInvites" class="dialog-overlay" @click.self="showInvites = false">
        <div class="dialog-box">
          <h3>位置共享邀请</h3>
          <div v-if="pendingInvites.length === 0" class="invite-empty">
            <p>暂无邀请</p>
          </div>
          <div v-else class="invite-list">
            <div v-for="invite in pendingInvites" :key="invite.id" class="invite-item">
              <div class="invite-avatar">👤</div>
              <div class="invite-info">
                <!-- 修复：getPendingInvites 返回 sender 对象，不是 app_users 数组 -->
                                <div class="invite-name">{{ invite.sender?.display_name || invite.sender?.username || '未知' }}</div>
                <div class="invite-time">{{ formatTime(invite.created_at) }}</div>
              </div>
              <div class="invite-actions">
                <button class="btn btn-small btn-primary" @click="acceptInvite(invite)">接受</button>
                <button class="btn btn-small btn-secondary" @click="rejectInvite(invite)">拒绝</button>
              </div>
            </div>
          </div>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showInvites = false">关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 关闭共享确认弹窗 -->
    <Teleport to="body">
      <div v-if="showCloseConfirm" class="dialog-overlay" @click.self="showCloseConfirm = false">
        <div class="dialog-box">
          <h3>关闭位置共享</h3>
          <p class="dialog-desc">确定要关闭与 <strong>{{ closingShare ? getPartnerName(closingShare) : '' }}</strong> 的位置共享？</p>
          <p class="dialog-note">关闭后对方将看不到你的位置</p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showCloseConfirm = false">取消</button>
            <button class="btn btn-danger" @click="confirmCloseShare">确认关闭</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useAuth } from '../composables/useDatabase.js'
import { getLocation } from '../composables/useLocation.js'
import {
  useLocationShare,
  calcDistance,
  formatDistance
} from '../composables/useLocationShare.js'

const { currentUser } = useAuth()
const locationShare = useLocationShare()
const router = useRouter()

// ========== 状态 ==========

const searchKeyword = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const showResults = ref(false)

const activeShares = ref([])
const pendingInvites = ref([])
const partnerLocations = ref({}) // { shareId: { latitude, longitude, created_at } }
const partnerAddresses = ref({}) // { shareId: address }

const hasActiveShares = computed(() => activeShares.value.length > 0)
const pendingCount = ref(0)

const showPermissionTip = ref(false)
const showInviteConfirm = ref(false)
const showInvites = ref(false)
const showCloseConfirm = ref(false)
const selectedUser = ref(null)
const closingShare = ref(null)

const drawerExpanded = ref(false)
const drawerHeight = ref(80)

const myLat = ref(0)
const myLng = ref(0)
const mapHeight = ref(400)

// ========== 地图相关 ==========

let mapInstance = null
let geocoder = null
let selfMarker = null
let partnerMarkers = ref({})

// ========== 防抖 ==========

let searchTimer = null
let locationUploadTimer = null

function debounce(fn, delay = 300) {
  return function (...args) {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => fn(...args), delay)
  }
}

// ========== 搜索 ==========

async function doSearch() {
  const keyword = searchKeyword.value.trim()
  if (keyword.length < 2) {
    searchResults.value = []
    return
  }
  isSearching.value = true
  const { data, error } = await locationShare.searchUsers(keyword)
  isSearching.value = false
  if (error) {
    showToast({ message: error.message, type: 'fail' })
  } else {
    searchResults.value = data || []
  }
}

const debouncedSearch = debounce(doSearch, 300)

function onSearchInput() {
  debouncedSearch()
}

function onSearchFocus() {
  showResults.value = true
}

function onSearchBlur() {
  // 延迟隐藏，让点击事件能触发
  setTimeout(() => {
    showResults.value = false
  }, 200)
}

function onSelectUser(user) {
  selectedUser.value = user
  showInviteConfirm.value = true
  showResults.value = false
  searchKeyword.value = ''
}

// ========== 邀请 ==========

async function confirmSendInvite() {
  if (!selectedUser.value) return
  const { error } = await locationShare.sendInvite(selectedUser.value.id)
  if (error) {
    showToast({ message: error.message, type: 'fail' })
  } else {
    showToast({ message: '邀请已发送 💕', type: 'success' })
  }
  showInviteConfirm.value = false
  selectedUser.value = null
}

async function acceptInvite(invite) {
  const { error } = await locationShare.respondInvite(invite.id, 'accepted')
  if (error) {
    showToast({ message: error.message, type: 'fail' })
  } else {
    showToast({ message: '已接受邀请 💖', type: 'success' })
    loadPendingInvites()
    loadActiveShares()
  }
}

async function rejectInvite(invite) {
  const { error } = await locationShare.respondInvite(invite.id, 'rejected')
  if (error) {
    showToast({ message: error.message, type: 'fail' })
  } else {
    showToast({ message: '已拒绝' })
    loadPendingInvites()
  }
}

async function loadPendingInvites() {
  const { data, error } = await locationShare.getPendingInvites()
  if (data) {
    pendingInvites.value = data
    pendingCount.value = data.length
  }
}

// ========== 共享管理 ==========

async function loadActiveShares() {
  const { data, error } = await locationShare.getActiveShares()
  if (error) {
    showToast({ message: error.message, type: 'fail' })
    return
  }
  activeShares.value = data || []

  if (data) {
    // 获取每个共享关系的对方最新位置
    for (const share of data) {
      const partnerId = share.sender_id === currentUser.value.id ? share.receiver_id : share.sender_id
      const loc = await locationShare.getPartnerLocation(share.id, partnerId)
      if (loc) {
        partnerLocations.value[share.id] = loc
        // 逆地理编码
        reverseGeocode(loc.latitude, loc.longitude).then(addr => {
          if (addr) partnerAddresses.value[share.id] = addr
        })
      }
    }
    updatePartnerMarkers()
  }
}

// 修复：getActiveShares 返回的 enriched 对象中包含 partner 属性
function getPartnerName(share) {
  return share.partner?.display_name || share.partner?.username || '对方'
}

function getPartnerLocation(share) {
  return partnerLocations.value[share.id] || null
}

function getPartnerAddress(share) {
  return partnerAddresses.value[share.id] || ''
}

function isPartnerOnline(share) {
  const loc = partnerLocations.value[share.id]
  if (!loc) return false
  // 5 分钟内更新过算在线
  const lastUpdate = new Date(loc.created_at).getTime()
  return Date.now() - lastUpdate < 5 * 60 * 1000
}

function onCloseShare(share) {
  closingShare.value = share
  showCloseConfirm.value = true
}

async function confirmCloseShare() {
  if (!closingShare.value) return
  const { error } = await locationShare.closeShare(closingShare.value.id, 'user_initiated')
  if (error) {
    showToast({ message: error.message, type: 'fail' })
  } else {
    showToast({ message: '已关闭共享' })
    loadActiveShares()
    removePartnerMarker(closingShare.value.id)
  }
  showCloseConfirm.value = false
  closingShare.value = null
}

// ========== 地图初始化 ==========

async function initMap() {
  if (typeof AMap === 'undefined') {
    showToast({ message: '地图加载失败，请刷新重试', type: 'fail' })
    return
  }

  // 获取当前位置
  const loc = await myGetLocation()
  myLat.value = loc?.latitude || loc?.lat || 0
  myLng.value = loc?.longitude || loc?.lon || 0

  if (myLat.value === 0 && myLng.value === 0) {
    showPermissionTip.value = true
    myLat.value = 39.9088
    myLng.value = 116.3974
  } else {
    showPermissionTip.value = false
  }

  // 计算地图区域
  const vh = window.innerHeight
  mapHeight.value = vh - 60 - (hasActiveShares.value ? 80 : 140)

  // 创建地图
  mapInstance = new AMap.Map('location-map', {
    zoom: 15,
    center: [myLng.value, myLat.value],
    mapStyle: 'amap://styles/normal',
  })

  // 添加自身标记
  selfMarker = new AMap.Marker({
    position: [myLng.value, myLat.value],
    title: '我的位置',
    icon: new AMap.Icon({
      size: new AMap.Size(30, 30),
      image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
      imageSize: new AMap.Size(30, 30)
    }),
    offset: new AMap.Pixel(-15, -30)
  })
  selfMarker.setMap(mapInstance)

  // 定位更新
  startLocationTracking()

  // 加载共享关系并添加对方标记
  await loadActiveShares()
}

async function myGetLocation() {
  return await getLocation()
}

function startLocationTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        const accuracy = position.coords.accuracy

        const prevLat = myLat.value
        const prevLng = myLng.value

        myLat.value = lat
        myLng.value = lng

        // 更新标记
        if (selfMarker) {
          selfMarker.setPosition([lng, lat])
        }

        // 距离 > 5m 才更新服务器
        if (prevLat && prevLng && calcDistance(prevLat, prevLng, lat, lng) < 5) {
          return
        }

        // 上传位置（如果有活跃共享）
        if (activeShares.value.length > 0) {
          for (const share of activeShares.value) {
            await locationShare.uploadLocation(share.id, lat, lng, accuracy)
          }
        }
      },
      (err) => {
        console.warn('定位失败:', err.message)
        if (err.code === 1) {
          showPermissionTip.value = true
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }
}

// ========== 地图标记更新 ==========

function updatePartnerMarkers() {
  if (!mapInstance) return

  // 清除旧的对方标记
  Object.values(partnerMarkers.value || {}).forEach(m => m.setMap(null))
  partnerMarkers.value = {}

  activeShares.value.forEach(share => {
    const loc = partnerLocations.value[share.id]
    if (!loc) return

    const marker = new AMap.Marker({
      position: [loc.longitude, loc.latitude],
      title: getPartnerName(share),
      icon: new AMap.Icon({
        size: new AMap.Size(36, 36),
        image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
        imageSize: new AMap.Size(36, 36)
      }),
      offset: new AMap.Pixel(-18, -36)
    })

    // 信息窗体
    marker.on('click', () => {
      const infoWindow = new AMap.InfoWindow({
        content: `
          <div style="padding:8px 12px;font-size:13px;">
            <div style="font-weight:600;margin-bottom:4px;">${getPartnerName(share)}</div>
            <div style="color:#666;">${formatTime(loc.created_at)}</div>
            <div style="color:#666;margin-top:2px;">${formatDistance(calcDistance(myLat.value, myLng.value, loc.latitude, loc.longitude))}</div>
          </div>
        `,
        offset: new AMap.Pixel(0, -40)
      })
      infoWindow.open(mapInstance, [loc.longitude, loc.latitude])
    })

    marker.setMap(mapInstance)
    partnerMarkers.value[share.id] = marker
  })

  // 视野自适应
  if (Object.keys(partnerMarkers.value).length > 0 || selfMarker) {
    const allMarkers = [selfMarker, ...Object.values(partnerMarkers.value)].filter(Boolean)
    mapInstance.setFitView(allMarkers, false, [50, 50, 50, 50])
  }
}

function removePartnerMarker(shareId) {
  const marker = partnerMarkers.value[shareId]
  if (marker) {
    marker.setMap(null)
    delete partnerMarkers.value[shareId]
  }
}

// ========== 操作 ==========

function centerOnMe() {
  if (mapInstance && myLat.value && myLng.value) {
    mapInstance.setCenter([myLng.value, myLat.value])
    mapInstance.setZoom(15)
  }
}

function centerOnPartner(share) {
  const loc = partnerLocations.value[share.id]
  if (loc && mapInstance) {
    mapInstance.setCenter([loc.longitude, loc.latitude])
    mapInstance.setZoom(16)
  }
}

function openNavigation(share) {
  const loc = partnerLocations.value[share.id]
  if (!loc) return
  const url = `https://uri.amap.com/navigation?to=${loc.longitude},${loc.latitude},${getPartnerName(share)}&mode=car&src=love-app`
  window.open(url, '_blank')
}

function openLocationSettings() {
  // PWA 中无法直接打开系统设置，提示
  showToast({ message: '请在浏览器/系统设置中开启位置权限', type: 'fail' })
}

// ========== 逆地理编码 ==========

async function reverseGeocode(lat, lng) {
  const AMAP_KEY = import.meta.env.VITE_AMAP_KEY
  if (!AMAP_KEY) return null
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lng},${lat}&extensions=base`
    )
    const data = await res.json()
    if (data.status === '1' && data.regeocode) {
      return data.regeocode.formatted_address
    }
    return null
  } catch {
    return null
  }
}

// ========== 抽屉 ==========

function toggleDrawer() {
  drawerExpanded.value = !drawerExpanded.value
  if (drawerExpanded.value) {
    const vh = window.innerHeight
    drawerHeight.value = Math.min(vh * 0.5, 400)
  } else {
    drawerHeight.value = 80
  }
  // 调整地图大小
  setTimeout(adjustMapHeight, 300)
}

function adjustMapHeight() {
  const vh = window.innerHeight
  const drawerH = drawerHeight.value
  mapHeight.value = Math.max(vh - 60 - drawerH - 20, 200)
  if (mapInstance) {
    mapInstance.setStatus({})
    setTimeout(() => mapInstance.setFitView(), 100)
  }
}

// ========== 工具函数 ==========

function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = (now - date) / 1000
    if (diff < 60) return '刚刚'
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  } catch {
    return ''
  }
}

// ========== 生命周期 ==========

onMounted(() => {
  initMap()
  loadPendingInvites()
})

onUnmounted(() => {
  if (mapInstance) {
    mapInstance.destroy()
    mapInstance = null
  }
  clearTimeout(searchTimer)
  clearTimeout(locationUploadTimer)
})
</script>

<style scoped>
.location-share-page {
  padding: 0;
  position: relative;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 搜索栏 */
.search-bar {
  position: absolute;
  top: calc(var(--safe-top) + 8px);
  left: 12px;
  right: 12px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  background: var(--white);
  border-radius: var(--radius-round);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.search-input :deep(.van-field__control) {
  padding: 0 12px;
}

van-field ::placeholder {
  opacity: 0.3;
}

.bell-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-md);
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.bell-icon {
  font-size: 20px;
}

.bell-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #EF4444;
  color: white;
  font-size: 10px;
  font-weight: 600;
  min-width: 18px;
  height: 18px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
}

/* 搜索结果 */
.search-results {
  position: absolute;
  top: calc(var(--safe-top) + 60px);
  left: 12px;
  right: 12px;
  background: var(--white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  z-index: 99;
  max-height: 220px;
  overflow-y: auto;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
}

.search-item:last-child {
  border-bottom: none;
}

.search-item:active {
  background: var(--bg);
}

.user-emoji {
  font-size: 28px;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.user-username {
  font-size: 12px;
  color: var(--text-tertiary);
}

.search-empty {
  position: absolute;
  top: calc(var(--safe-top) + 60px);
  left: 12px;
  right: 12px;
  background: var(--white);
  border-radius: var(--radius-md);
  padding: 16px;
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  z-index: 99;
}

/* 地图 */
.map-container {
  position: relative;
  flex: 1;
  margin-top: 60px;
}

.map {
  width: 100%;
}

.locate-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--white);
  border: none;
  box-shadow: var(--shadow-md);
  font-size: 22px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.locate-btn:active {
  transform: scale(0.95);
}

/* 权限提示 */
.permission-tip {
  position: absolute;
  top: calc(var(--safe-top) + 60px);
  left: 12px;
  right: 12px;
  background: #FEF3C7;
  border-radius: var(--radius-md);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #92400E;
  z-index: 98;
}

.tip-btn {
  border: none;
  background: #92400E;
  color: white;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  white-space: nowrap;
}

.tip-close {
  border: none;
  background: none;
  font-size: 16px;
  color: #92400E;
  cursor: pointer;
  padding: 4px;
  margin-left: auto;
}

/* 空状态 */
.empty-state {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 140px;
  background: var(--white);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.empty-emoji {
  font-size: 40px;
  margin-bottom: 8px;
}

.empty-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.empty-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0 0;
}

/* 底部抽屉 */
.bottom-drawer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--white);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 50;
  transition: height 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.drawer-handle {
  display: flex;
  justify-content: center;
  padding: 8px;
  cursor: pointer;
}

.drawer-bar {
  width: 40px;
  height: 4px;
  border-radius: 2px;
  background: var(--border);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
}

.drawer-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.drawer-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
}

/* 共享卡片 */
.share-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-card-wrapper {
  overflow: hidden;
  border-radius: var(--radius-md);
}

.share-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--bg);
  cursor: pointer;
}

.share-card:active {
  opacity: 0.7;
}

.card-avatar {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.online-dot {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  background: #10B981;
  border-radius: 50%;
  border: 2px solid var(--white);
}

.card-info {
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.card-address {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.navigate-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--white);
  border: none;
  box-shadow: var(--shadow-sm);
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
}

.close-share-btn {
  height: 100%;
  background: #EF4444;
  color: white;
  border: none;
  font-size: 13px;
  font-weight: 500;
  padding: 0 20px;
  white-space: nowrap;
  cursor: pointer;
}

/* 弹窗 */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.dialog-box {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  width: 100%;
  max-width: 320px;
  box-shadow: var(--shadow-lg);
}

.dialog-box h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 12px;
}

.dialog-desc {
  font-size: 14px;
  color: var(--text);
  margin: 0 0 8px;
}

.dialog-note {
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 0 0 16px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.invite-empty {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 14px;
  padding: 20px 0;
}

.invite-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 12px;
}

.invite-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg);
  border-radius: var(--radius-md);
}

.invite-avatar {
  font-size: 24px;
}

.invite-info {
  flex: 1;
}

.invite-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.invite-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.invite-actions {
  display: flex;
  gap: 6px;
}

/* Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  transition: all 0.2s ease;
  flex: 1;
}

.btn:active {
  transform: scale(0.97);
}

.btn-primary {
  background: var(--primary);
  color: var(--white);
}

.btn-secondary {
  background: var(--border-light);
  color: var(--text);
}

.btn-danger {
  background: #EF4444;
  color: var(--white);
}

.btn-small {
  font-size: 12px;
  padding: 6px 14px;
}
</style>
