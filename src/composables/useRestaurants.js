// useRestaurants.js — 餐厅搜索、收藏、转圈逻辑
import { ref, computed } from 'vue'
import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from './useStorage.js'

const SUPABASE_URL = import.meta.env?.VITE_SUPABASE_URL || 'https://db.przdbhvydkivybvgjlox.supabase.co'

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

// ========== 方法 ==========

function mapCategoryToEmoji(type) {
  const map = {
    '火锅': '🍲', '日料': '🍣', '西餐': '🍝', '快餐': '🍔', '甜点': '🍰',
    '咖啡': '☕', '烧烤': '🍖', '粤菜': '🥢', '湘菜': '🌶️', '餐厅': '🍽️',
    '面馆': '🍜', '饺子': '🥟', '韩国料理': '🍚', '泰国菜': '🍲', '鱼': '🐟'
  }
  for (const [key, emoji] of Object.entries(map)) {
    if (type?.includes(key)) return emoji
  }
  return '🍽️'
}

async function searchNearby(keyword = '', category = '餐厅', city = currentCity.value) {
  try {
    const params = new URLSearchParams({
      keyword: keyword || category,
      city,
      lat: userLat.value,
      lon: userLon.value,
      radius: 3000,
      offset: 20
    })
    const res = await fetch(`${SUPABASE_URL}/functions/v1/search-restaurants?${params}`)
    if (!res.ok) throw new Error('搜索失败')
    const data = await res.json()
    if (data.status === '1' && data.pois) {
      restaurants.value = data.pois.map(p => ({
        id: p.id || p.name,
        name: p.name,
        emoji: mapCategoryToEmoji(p.type),
        distance: p.distance ? `${p.distance}m` : '—',
        rating: p.rating || 4.0,
        tags: p.type ? p.type.split(';').slice(0, 3) : [],
        address: p.address,
        lat: p.location ? parseFloat(p.location.split(',')[1]) : 0,
        lon: p.location ? parseFloat(p.location.split(',')[0]) : 0,
        source: 'amap'
      }))
      return restaurants.value
    }
    return []
  } catch (e) {
    console.warn('POI search failed:', e)
    return []
  }
}

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

function spinWheel(excludedIds = []) {
  const candidates = favorites.value.filter(f => !excludedIds.includes(f.id))
  if (candidates.length === 0) return null
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function setLocation(city, lat, lon) {
  currentCity.value = city
  userLat.value = lat || 0
  userLon.value = lon || 0
}

export {
  restaurants, favorites, currentCity, userLat, userLon,
  categories, activeCategory, searchKeyword, locating,
  filteredRestaurants,
  searchNearby, toggleFavorite, isFavorite, spinWheel, setLocation, mapCategoryToEmoji
}
