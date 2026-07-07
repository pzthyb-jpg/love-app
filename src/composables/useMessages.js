// useMessages.js — 留言匹配算法

// 获取今天的留言
function getTodaysMessage(messages, currentDateStr, currentHour) {
  if (!messages || !messages.length) return null

  // 计算今日适合展示的时间段
  const hour = currentHour || new Date().getHours()

  // 判断今天是否是特殊日（纪念日或节日）
  function isSpecialDay(dateStr) {
    const d = new Date(dateStr + 'T00:00:00')
    const month = d.getMonth() + 1
    const day = d.getDate()

    // 常见节日
    const festivals = {
      '1-1': '元旦',
      '2-14': '情人节',
      '3-8': '妇女节',
      '5-1': '劳动节',
      '5-20': '520',
      '6-1': '儿童节',
      '7-7': '七夕',
      '8-15': '中秋节',
      '10-1': '国庆节',
      '12-24': '平安夜',
      '12-25': '圣诞节'
    }

    return festivals[`${month}-${day}`] || false
  }

  // 1. 筛选出今天还没展示过的留言
  let available = messages.filter(m => !m.displayedDates || !m.displayedDates.includes(currentDateStr))

  // 如果所有留言都已展示，重置
  if (available.length === 0) {
    messages.forEach(m => { m.displayedDates = [] })
    available = [...messages]
    // 保存重置到 localStorage
    return { reset: true }
  }

  // 2. 检查特殊日
  const specialDay = isSpecialDay(currentDateStr)

  // 3. 特殊日优先展示 special 类型
  if (specialDay) {
    const specialMsg = available.find(m => m.type === 'special')
    if (specialMsg) return specialMsg
  }

  // 4. 按时间段匹配留言类型
  if (hour >= 6 && hour < 12) {
    const morning = available.find(m => m.type === 'morning')
    if (morning) return morning
  }
  if (hour >= 18 && hour < 24) {
    const evening = available.find(m => m.type === 'evening')
    if (evening) return evening
  }

  // 5. 兜底：随机选一条
  const randomPool = available.filter(m => m.type === 'random')
  if (randomPool.length > 0) {
    return randomPool[Math.floor(Math.random() * randomPool.length)]
  }

  // 6. 最后兜底：任何类型都可以
  return available[Math.floor(Math.random() * available.length)]
}

// 生成默认留言
function getDefaultMessages() {
  return [
    {
      id: 1,
      text: '早安宝贝！今天也要开心哦❤️',
      type: 'morning',
      author: '男朋友',
      createdAt: new Date().toISOString().slice(0, 10),
      displayedDates: [],
      specialCondition: null
    },
    {
      id: 2,
      text: '宝，今天打卡了吗？想看看你😘',
      type: 'random',
      author: '男朋友',
      createdAt: new Date().toISOString().slice(0, 10),
      displayedDates: [],
      specialCondition: null
    },
    {
      id: 3,
      text: '晚安我的宝！今天辛苦了，好好休息💤',
      type: 'evening',
      author: '男朋友',
      createdAt: new Date().toISOString().slice(0, 10),
      displayedDates: [],
      specialCondition: null
    }
  ]
}

// 替换留言中的模板变量
function formatMessageText(text, loveDays) {
  if (!text) return ''
  return text.replace(/\{\{days\}\}/g, loveDays || '??')
}

export { getTodaysMessage, getDefaultMessages, formatMessageText }
