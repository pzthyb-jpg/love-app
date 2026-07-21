// useLocation.js — 获取用户真实位置
import { ref } from 'vue'

const AMAP_KEY = import.meta.env?.VITE_AMAP_KEY || ''

/**
 * 高性能组合定位：GPS → ip-api.com → 高德 IP → fallback
 * ip-api.com 对国内 IP 识别更准（高德 IP 定位常偏到 ISP 注册地）
 */
export async function getLocation() {
  // 1. 优先：浏览器 GPS 定位（街道级精度）
  const gps = await getGPSLocation()
  if (gps) {
    const geoInfo = await reverseGeocode(gps.latitude, gps.longitude)
    return {
      city: geoInfo?.city || gps.city || '北京',
      region: geoInfo?.province || gps.region || '',
      country: '中国',
      lat: gps.latitude,
      lon: gps.longitude,
      address: geoInfo?.formattedAddress,
      source: 'gps'
    }
  }

  // 2. 降级：ip-api.com（对国内 IP 城市识别更准确）
  const ipApiLoc = await getLocationByIpApi()
  if (ipApiLoc && ipApiLoc.city) {
    return { ...ipApiLoc, source: 'ip-api' }
  }

  // 3. 再降级：高德 IP 定位
  const ipLoc = await getLocationByIP()
  if (ipLoc) return { ...ipLoc, source: 'amap-ip' }

  // 4. 最终 fallback
  return { city: '北京', region: '北京市', country: '中国', lat: 0, lon: 0, source: 'fallback' }
}

async function getLocationByIpApi() {
  try {
    const res = await fetch('https://ip-api.com/json/?lang=zh-CN')
    const data = await res.json()
    if (data.status !== 'success') return null
    let city = data.city || data.regionName || ''
    if (city.endsWith('市')) city = city.slice(0, -1)
    return {
      city,
      region: data.regionName || data.country || '',
      country: data.country || '中国',
      lat: data.lat || 0,
      lon: data.lon || 0,
    }
  } catch (e) {
    console.warn('ip-api 定位失败:', e)
    return null
  }
}

/**
 * 浏览器 GPS 定位（需要用户授权）
 * 使用 watchPosition 持续监听，优先返回高精度定位（<=100m 街道级），
 * 避免使用过时缓存（maximumAge:0），并防止 GPS 未锁定就超时降级到 IP 定位
 */
function getGPSLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    let settled = false
    let best = null
    let watchId = null

    const finish = (result) => {
      if (settled) return
      settled = true
      if (watchId !== null) navigator.geolocation.clearWatch(watchId)
      resolve(result)
    }

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords
        // 记录目前精度最高的一次定位
        if (!best || accuracy < best.accuracy) {
          best = { latitude, longitude, accuracy }
        }
        // 拿到街道级高精度定位立即返回
        if (accuracy <= 100) {
          finish(best)
        }
      },
      (err) => {
        // 权限拒绝 → 立即返回 null 走降级；
        // 超时等其他错误交给下方兼容定时器处理，不提前放弃
        if (err.code === 1) {
          console.warn('定位权限被拒绝')
          finish(null)
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0 // 强制实时定位，不复用缓存
      }
    )

    // 兼容：10 秒内未拿到高精度定位，返回目前最佳结果（避免地图久等）
    setTimeout(() => finish(best), 10000)
  })
}

/**
 * 高德 IP 定位（城市级，无需授权）
 */
async function getLocationByIP() {
  if (!AMAP_KEY) return null
  try {
    const res = await fetch(`https://restapi.amap.com/v3/ip?key=${AMAP_KEY}`)
    const data = await res.json()
    if (data.status !== '1') return null

    let lat = 0, lon = 0
    if (data.rectangle) {
      const rect = data.rectangle.split(';')
      if (rect.length === 2) {
        const p1 = rect[0].split(',')
        const p2 = rect[1].split(',')
        lon = (parseFloat(p1[0]) + parseFloat(p2[0])) / 2
        lat = (parseFloat(p1[1]) + parseFloat(p2[1])) / 2
      }
    }

    let city = data.city || data.province || '北京'
    if (city.endsWith('市')) city = city.slice(0, -1)

    return { city, region: data.province || '', country: '中国', lat, lon }
  } catch (e) {
    console.warn('IP 定位失败:', e)
    return null
  }
}

/**
 * 高德逆地理编码：坐标 → 地址文字
 */
async function reverseGeocode(lat, lon) {
  try {
    const res = await fetch(
      `https://restapi.amap.com/v3/geocode/regeo?key=${AMAP_KEY}&location=${lon},${lat}&extensions=base`
    )
    const data = await res.json()
    if (data.status === '1' && data.regeocode) {
      const addr = data.regeocode.addressComponent
      let city = addr.city || addr.province || ''
      if (!Array.isArray(city) && city.endsWith('市')) {
        city = city.slice(0, -1)
      }
      return {
        city,
        province: addr.province || '',
        district: addr.district || '',
        formattedAddress: data.regeocode.formatted_address || ''
      }
    }
    return null
  } catch (e) {
    return null
  }
}
