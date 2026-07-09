// useLocation.js — 获取用户真实位置
import { ref } from 'vue'

const AMAP_KEY = import.meta.env?.VITE_AMAP_KEY || ''

/**
 * 高性能组合定位：优先 GPS（街道级）→ 降级 IP 定位（城市级）
 */
export async function getLocation() {
  // 优先：浏览器 GPS 定位（街道级精度）
  const gps = await getGPSLocation()
  if (gps) {
    // 用高德逆地理编码获取详细地址
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

  // 降级：IP 定位（城市级，无需授权）
  const ipLoc = await getLocationByIP()
  if (ipLoc) return { ...ipLoc, source: 'ip' }

  // 最终 fallback
  return { city: '北京', region: '北京市', country: '中国', lat: 0, lon: 0, source: 'fallback' }
}

/**
 * 浏览器 GPS 定位（需要用户授权，精度街道级）
 */
function getGPSLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        })
      },
      (err) => {
        console.warn('GPS 定位失败:', err.message)
        resolve(null)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 分钟缓存
      }
    )
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
