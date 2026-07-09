// useRestaurants.js — 餐厅搜索、收藏、转圈逻辑（高德 POI 直连）
import { ref, computed } from 'vue'
import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from './useStorage.js'
import { getLocation } from './useLocation.js'

const AMAP_KEY = import.meta.env?.VITE_AMAP_KEY || ''
const AMAP_BASE = 'https://restapi.amap.com/v3'

// ========== 状态 ==========

const restaurants = ref([])         // POI 搜索结果
const favorites = ref(safeGetJSON(STORAGE_KEYS.FAVORITE_RESTAURANTS, []))
const currentCity = ref('北京')
const userLat = ref(0)
const userLon = ref(0)
const categories = ['全部', '火锅', '日料', '西餐', '快餐', '甜点', '咖啡', '烧烤', '粤菜', '湘菜']
const activeCategory = ref('全部')
const searchKeyword = ref('')
const locating = ref(false)
const locationReady = ref(false)

// ========== 计算属性 ==========

const filteredRestaurants = computed(() => {
  let list = restaurants.value
  if (activeCategory.value !== '全部') {
    list = list.filter(r => r.tags?.includes(activeCategory.value) || r.name?.includes(activeCategory.value))
  }
  if (searchKeyword.value) {
    const q = searchKeyword.value.toLowerCase()
    list = list.filter(r => r.name?.toLowerCase().includes(q) || r.tags?.some(t => t.includes(q)))
  }
  return list
})

// ========== 工具函数 ==========

function mapCategoryToEmoji(type) {
  const map = {
    '火锅': '🍲', '日料': '🍣', '西餐': '🍝', '快餐': '🍔', '甜点': '🍰',
    '咖啡': '☕', '烧烤': '🍖', '粤菜': '🥢', '湘菜': '🌶️', '餐厅': '🍽️',
    '面馆': '🍜', '饺子': '🥟', '韩国料理': '🍚', '泰国菜': '🍲', '鱼': '🐟',
    '面包': '🥐', '粥': '🥣', '自助': '🍱', '海鲜': '🦐'
  }
  for (const [key, emoji] of Object.entries(map)) {
    if (type?.includes(key)) return emoji
  }
  return '🍽️'
}

// Haversine 公式计算两点距离（米）
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function formatDistance(meters) {
  if (!meters || isNaN(meters)) return '—'
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${Math.round(meters)}m`
}

// ========== POI 搜索（基于坐标） ==========

async function searchNearby(keyword = '', category = '餐厅', city = currentCity.value) {
  if (!AMAP_KEY) {
    console.warn('未配置高德 API Key')
    return []
  }

  try {
    const searchTerm = keyword || category

    // 如果有用户坐标，用周边搜索（更精确）
    let url
    if (userLat.value && userLon.value) {
      // 周边搜索：基于用户坐标 + 半径 3000m
      url = `${AMAP_BASE}/place/around?key=${AMAP_KEY}&location=${userLon.value},${userLat.value}&keywords=${encodeURIComponent(searchTerm)}&radius=3000&offset=20&page=1&extensions=all`
    } else {
      // 城市搜索：fallback
      url = `${AMAP_BASE}/place/text?key=${AMAP_KEY}&keywords=${encodeURIComponent(searchTerm)}&city=${city}&offset=20&page=1&extensions=all`
    }

    const res = await fetch(url)
    if (!res.ok) throw new Error('POI 搜索失败')
    const data = await res.json()

    if (data.status === '1' && data.pois) {
      restaurants.value = data.pois.map(p => {
        const lat = p.location ? parseFloat(p.location.split(',')[1]) : 0
        const lon = p.location ? parseFloat(p.location.split(',')[0]) : 0
        // 计算真实距离
        let distance = '—'
        if (userLat.value && userLon.value && lat && lon) {
          const distM = haversineDistance(userLat.value, userLon.value, lat, lon)
          distance = formatDistance(distM)
        }

        return {
          id: p.id || p.name,
          name: p.name,
          emoji: mapCategoryToEmoji(p.type),
          distance,
          rating: p.rating ? parseFloat(p.rating) : 4.0,
          tags: p.type ? p.type.split(';').slice(0, 3) : [],
          address: p.address || '',
          lat,
          lon,
          source: 'amap'
        }
      })
      return restaurants.value
    }
    return []
  } catch (e) {
    console.warn('POI search failed:', e)
    return []
  }
}

// ========== 定位 + 搜索 ==========

async function locateAndSearch() {
  locating.value = true
  try {
    const loc = await getLocation()
    if (loc) {
      currentCity.value = loc.city
      userLat.value = loc.lat
      userLon.value = loc.lon
    }
    await searchNearby()
    locationReady.value = true
    locating.value = false
  } catch (e) {
    locating.value = false
    console.warn('定位失败:', e)
  }
}

// ========== 收藏管理 ==========

function toggleFavorite(restaurant) {
  const idx = favorites.value.findIndex(f => f.id === restaurant.id)
  if (idx >= 0) {
    favorites.value.splice(idx, 1)
  } else {
    favorites.value.push({ ...restaurant })
  }
  safeSetJSON(STORAGE_KEYS.FAVORITE_RESTAURANTS, JSON.parse(JSON.stringify(favorites.value)))
}

function isFavorite(id) {
  return favorites.value.some(f => f.id === id)
}

// ========== 转圈逻辑 ==========

function spinWheel(excludedIds = []) {
  const candidates = favorites.value.filter(f => !excludedIds.includes(f.id))
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

// ========== 位置设置 ==========

function setLocation(city, lat, lon) {
  currentCity.value = city
  userLat.value = lat || 0
  userLon.value = lon || 0
}

export {
  restaurants, favorites, currentCity, userLat, userLon,
  categories, activeCategory, searchKeyword, locating, locationReady,
  filteredRestaurants,
  searchNearby, locateAndSearch, toggleFavorite, isFavorite, spinWheel, setLocation, mapCategoryToEmoji
}
