/**
 * useCompliments.js — 智能彩虹屁引擎
 * 从 Photo.vue 抽离模板和生成逻辑，方便复用和独立维护
 */

// 节日映射
const FESTIVALS = {
  '01-01': { name: '元旦', emoji: '🎆' },
  '02-14': { name: '情人节', emoji: '💝' },
  '03-08': { name: '女神节', emoji: '👸' },
  '03-14': { name: '白色情人节', emoji: '🤍' },
  '05-20': { name: '520', emoji: '💕' },
  '06-01': { name: '儿童节', emoji: '🧒' },
  '08-15': { name: '七夕', emoji: '💌' },
  '10-01': { name: '国庆节', emoji: '🇨🇳' },
  '12-24': { name: '平安夜', emoji: '🎄' },
  '12-25': { name: '圣诞节', emoji: '🎅' }
}

// 全部彩虹屁模板（按分类）
const COMPLIMENT_TEMPLATES = {
  beauty: [
    '{name}今天的你太让人心动了！💕',
    '今天的{name}也超好看！🌟',
    '我的{name}怎么可以这么可爱！🥰',
    '每天都被{name}的美貌击中！💘',
    '{name}的笑容是今天最好的礼物！🎁',
    '今天的{name}闪闪发光呢！✨',
    '看到{name}的照片，心都化了～💗',
    '{name}真是一天比一天好看！🌹',
    '这位仙女今天也下凡了呀！🧚‍♀️',
    '{name}的颜值今天也是满分！💯',
    '今天的{name}让我又心动了一次！💓',
    '{name}今天也太好看了吧！😍',
    '这个世界因为有{name}才美好！🌈',
    '{name}的照片是我今天最大的惊喜！🎀',
    '每次看到{name}都觉得好幸福！🦋'
  ],
  makeup: [
    '今天的妆容也太精致了吧！像洋娃娃一样！💄',
    '这睫毛是真实存在的吗？忽闪忽闪的～✨',
    '口红颜色好好看！什么色号？🎨',
    '底妆好服帖！皮肤在发光诶！🌟',
    '眼睛里有星星！今天的妆容绝了！⭐',
    '这是仙女下凡吧？精致到每一根睫毛！🧚‍♀️',
    '化了妆的{name}是仙女本仙！👸',
    '今天的美貌又是犯规级别！🚨',
    '美妆博主看了都要来取经！💅',
    '这妆容简直是艺术品级别！🖼️'
  ],
  energy: [
    '看起来元气满满！今天一定会有好事发生！🍀',
    '眼神里有光！活力girl本人！⚡',
    '元气值拉满！可爱值也拉满！无死角可爱！💫',
    '今天的状态满分！像一个行走的小太阳！☀️',
    '看到{name}这么有活力，心情都跟着明亮了！🌞',
    '这就是元气少女的模样吧！活力四射！✨',
    '满血复活的状态！好看死了！🔥',
    '眼睛里藏着银河系！亮晶晶的！🌌',
    '精神满满的样子最帅了！光芒四射！🌟'
  ],
  special: [
    '在这个特别的日子里，{name}格外好看！🎂',
    '纪念日的{name}，眼里都是爱意的模样！💖',
    '今天的你比平时更美！是有什么开心的事吗？😊',
    '特殊日的{name}自带光环！👑',
    '连空气都是甜甜的！今天的你格外动人！🍬'
  ],
  morning: [
    '早安的{name}最好看了！睡眼惺忪也美～🌅',
    '一日之计在于晨，清晨的{name}最好看！🌄',
    '刚睡醒就这么好看，不公平！😤💕',
    '今天的早安打卡！美貌营业中～📸'
  ],
  noon: [
    '午间的{name}温柔得像一杯奶茶！🍵💛',
    '中午也这么好看，是要让我心动一整天吗？💓',
    '午后的阳光和{name}一样温暖～☀️',
    '午饭时间来一波美颜暴击！😍'
  ],
  evening: [
    '傍晚的{name}像晚霞一样绚丽！🌆',
    '夕阳西下，{name}的颜值在线！🌇',
    '日落时分的{name}，温柔了整个世界～🌅',
    '晚风轻拂，{name}的发丝都在发光✨'
  ]
}

/**
 * 生成一条彩虹屁
 * @param {string} girlfriendName — 女友昵称
 * @returns {string}
 */
export function generateCompliment(girlfriendName = '宝贝') {
  const now = new Date()
  const hour = now.getHours()
  const monthDay = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const todayFestival = FESTIVALS[monthDay]
  const name = girlfriendName || '宝贝'

  let selected = []
  selected = selected.concat(COMPLIMENT_TEMPLATES.beauty)

  // 时间段选择
  if (hour < 11) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.morning)
  } else if (hour < 14) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.noon)
  } else if (hour >= 17) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.evening)
  }

  // 50% 概率增加妆容/元气模板
  if (Math.random() > 0.4) {
    const makeupOrEnergy = Math.random() > 0.5
      ? COMPLIMENT_TEMPLATES.makeup
      : COMPLIMENT_TEMPLATES.energy
    selected = selected.concat(makeupOrEnergy)
  }

  // 特殊日
  if (todayFestival) {
    selected = selected.concat(COMPLIMENT_TEMPLATES.special)
  }

  // 随机选一条并替换昵称
  const tpl = selected[Math.floor(Math.random() * selected.length)]
  let result = tpl.replace(/{name}/g, name)

  // 节日有 50% 概率追加一句话
  if (todayFestival && Math.random() > 0.5) {
    result += `\n${todayFestival.emoji} 今天是${todayFestival.name}，也要开开心心的哦~`
  }

  return result
}
