// useLocation.js — 基于 IP 的定位获取

/**
 * 获取用户当前位置（城市级）
 * 使用 ip-api.com（免费，支持中文，CORS 友好）
 * 返回: { city, region, country, lat, lon }
 */
export async function getLocationByIP() {
  try {
    const res = await fetch('http://ip-api.com/json/?lang=zh-CN')
    if (!res.ok) throw new Error('IP 定位失败')
    const data = await res.json()
    if (data.status !== 'success') throw new Error(data.message || 'IP 定位失败')
    return {
      city: data.city,
      region: data.regionName,
      country: data.country,
      lat: data.lat,
      lon: data.lon
    }
  } catch (e) {
    console.warn('IP 定位失败:', e)
    return null
  }
}

/**
 * 备用：通过高德 IP 定位 (需要 Amap Key)
 */
export async function getLocationByAmap(key) {
  try {
    const res = await fetch(`https://restapi.amap.com/v3/ip?key=${key}`)
    const data = await res.json()
    if (data.status !== '1') throw new Error(data.info || '高德定位失败')
    // data.rectangle 是矩形边界 "lng1,lat1;lng2,lat2"
    const rect = data.rectangle ? data.rectangle.split(';') : []
    let lat = 0, lon = 0
    if (rect.length === 2) {
      const p1 = rect[0].split(',')
      const p2 = rect[1].split(',')
      lon = (parseFloat(p1[0]) + parseFloat(p2[0])) / 2
      lat = (parseFloat(p1[1]) + parseFloat(p2[1])) / 2
    }
    return {
      city: data.city,
      region: data.province,
      country: '中国',
      lat,
      lon
    }
  } catch (e) {
    console.warn('高德定位失败:', e)
    return null
  }
}
