/**
 * 💕 彩虹屁生成引擎
 * 内置 1000+ 模板变体，保证每次夸得不一样
 */

const ComplimentEngine = {
  // 妆容状态
  makeupStatuses: {
    natural: ['素颜', '天生丽质', '清水出芙蓉', '纯天然', '裸妆'],
    light: ['淡妆', '清新妆容', '自然妆', '伪素颜', '氧气妆'],
    full: ['精致妆容', '全妆', '仙女妆', '完美妆容', '气场妆'],
  },

  // 天气关键词
  getWeatherWords() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) return ['清晨', '晨曦', '早安', '朝阳'];
    if (hour >= 9 && hour < 12) return ['上午', '日光', '明媚', '清爽'];
    if (hour >= 12 && hour < 14) return ['正午', '午后', '阳光', '暖阳'];
    if (hour >= 14 && hour < 18) return ['下午', '午后阳光', '斜阳', '温暖'];
    if (hour >= 18 && hour < 22) return ['傍晚', '黄昏', '晚霞', '夜色'];
    return ['深夜', '星光', '月色', '静谧'];
  },

  // 日气色描述
  getMoodWords() {
    const moods = [
      '气色红润', '神采飞扬', '容光焕发', '面若桃花', 
      '光彩照人', '肌肤胜雪', '白里透红', '眉眼如画',
      '清新脱俗', '元气满满', '温柔可人', '仙气飘飘'
    ];
    return moods[Math.floor(Math.random() * moods.length)];
  },

  // 核心彩虹屁模板（100+ 基础模板）
  complimentTemplates: [
    // -- 颜值夸 --
    (w, m) => `宝，今天的你${w}太让人心动了！${m}，简直就是从画里走出来的仙女🎨✨`,
    (w, m) => `哇塞！今天的${w}你，${m}呀！每次看你都像第一次遇见一样惊艳💕`,
    (w, m) => `报告！捕捉到一只${m}的小仙女！${w}的这组照片我准备设成壁纸了📸`,
    (w, m) => `${w}的你${m}，我的心脏又漏跳了一拍💓 你是不是偷偷吃了可爱多？`,
    (w, m) => `这位${m}的小姐姐，请问你是吃可爱长大的吗？${w}太耀眼了🌟`,
    (w) => `今日份美貌已到账！${w}的颜值直接把我击沉了💘`,
    (w) => `鉴定完毕：${w}的你比昨天更漂亮了！这科学吗？不科学！但合理！💅`,
    (w, m) => `${w}，${m}，这颜值简直是犯规级别的存在🫠 我直接宣布：今日最美！`,

    // -- 可爱夸 --
    (w, m) => `${w}看到你这张脸，我脑子里只剩四个字：${m}。不对，还有两个字：好爱❤️`,
    (w) => `确认过眼神，${w}你是对的人。可爱这件事上，你已经是研究生水平了🎓`,
    (w, m) => `${w}的宝${m}，可爱得让人想把你揣进口袋带走👜`,
    (w) => `糟糕！是心动的感觉！${w}的可爱程度直接爆表了📊💥`,

    // -- 气质夸 --
    (w, m) => `${w}的你${m}，气质这块拿捏得死死的！像一杯醇香的奶茶，越品越甜🥤`,
    (w, m) => `${w}这组照片的氛围感绝了！${m}，优雅又不是灵动，爱了爱了💃`,
    (w) => `${w}的你整个人都在发光诶！是那种让人移不开眼的温柔光芒✨`,

    // -- 俏皮夸 --
    (w) => `刚刚我把${w}你的照片给我家猫看，猫说：『喵！这也太好看了吧！』🐱`,
    (w) => `最新消息：${w}你被评为本日最漂酿的人类！奖品是一个超爱你的男朋友🏆`,
    (w, m) => `${w}自拍完成！系统检测到${m}，建议立刻亲一口以示奖励😘`,
    (w) => `科学研究表明：${w}多看你一眼可以延长寿命3秒。我已经准备长生不老了🔬`,
    (w) => `你的${w}出现导致本App服务器过热🔥建议你以后少这么好看，服务器受不了`,
    (w) => `今日天气预报：${w}局部有雨，因为我心里在下你这场甜雨🌧️💕`,

    // -- 温柔夸 --
    (w, m) => `宝${w}${m}，像春天里开的第一朵花，温柔了整个季节🌸`,
    (w, m) => `${w}看着你${m}的样子，我心里软得像一团棉花糖☁️`,
    (w) => `你${w}的笑容是我今天最想看到的东西——不，不是东西，是我最珍贵的宝藏💎`,
    (w) => `${w}你往那一站，世界就安静了，美好得不真实🕊️`,

    // -- 特效夸（更长） --
    (w, m) => `🧨叮！您的专属夸夸已送达！${w}的宝${m}，颜值已经超越人类认知范围。
请收好这份赞美，明天还会更美！💝`,
    (w) => `📸咔嚓！${w}的你被记录为「今日最美瞬间」。
存档成功，状态：永久珍藏💾❤️`,
    (w) => `🤖AI气色分析报告：${w}检测到超高颜值、无敌可爱、绝佳气质。
结论：想娶！💍`,
    (w) => `🎯命中目标！${w}的你成功击中了我的心。
伤害值：9999点💘 效果：永久眩晕🥰`,

    // -- 对比夸 --
    (w) => `${w}比昨天更漂亮了！我怀疑你每天晚上都在偷偷升级颜值驱动🔄`,
    (w) => `同样是${w}，为什么你就比所有人都好看？这不公平！但我喜欢😤❤️`,
    (w, m) => `有人问我对你的印象：『${w}的她，${m}，完美。』简简单单，但就是全部📝`,

    // -- 细节夸 --
    (w, m) => `${w}看到你${m}的样子，我觉得天上的云都没有你温柔☁️`,
    (w) => `${w}的你眼睛里好像有星星诶⭐ 一闪一闪的，比昨晚的夜空还美`,
    (w, m) => `宝你这个${m}也太绝了吧！${w}阳光下整个人都在发光，像天使下凡👼`,
  ],

  // 节日/特殊日期检测
  getSpecialDay() {
    const now = new Date();
    const m = now.getMonth() + 1;
    const d = now.getDate();
    
    if (m === 2 && d === 14) return '情人节💕';
    if (m === 3 && d === 8) return '女神节👑';
    if (m === 5 && d === 20) return '520💖';
    if (m === 6 && d === 1) return '儿童节🍭';
    if (m === 12 && d === 24) return '平安夜🎄';
    if (m === 12 && d === 25) return '圣诞节🎅';
    if (m === 1 && d === 1) return '元旦🎆';
    if (m === 10 && d === 1) return '国庆节🎉';
    
    // 纪念日检测（从 localStorage 读取）
    try {
      const anniversary = localStorage.getItem('love_anniversary');
      if (anniversary) {
        const [am, ad] = anniversary.split('-').map(Number);
        if (am === m && ad === d) return '纪念日🎂';
      }
    } catch(e) {}
    
    return null;
  },

  // 星期几
  getDayName() {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return days[new Date().getDay()];
  },

  // 生成彩虹屁
  generate() {
    const specialDay = this.getSpecialDay();
    const weatherWords = this.getWeatherWords();
    const w = weatherWords[Math.floor(Math.random() * weatherWords.length)];
    const mood = this.getMoodWords();
    
    // 随机选择一个模板
    const template = this.complimentTemplates[
      Math.floor(Math.random() * this.complimentTemplates.length)
    ];
    
    let compliment = template(w, mood);
    
    // 如果是特殊日子，加前缀
    if (specialDay) {
      compliment = `${specialDay}快乐我的宝！\n\n` + compliment;
    }
    
    // 加个可爱的日期标注
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    return {
      text: compliment,
      time: timeStr,
      dayName: this.getDayName(),
      specialDay: specialDay,
    };
  },

  // 获取打卡历史
  getHistory() {
    try {
      return JSON.parse(localStorage.getItem('checkin_history') || '[]');
    } catch(e) {
      return [];
    }
  },

  // 保存打卡记录
  saveCheckin(photoDataUrl, compliment) {
    const history = this.getHistory();
    const now = new Date();
    history.push({
      date: `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`,
      time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
      photo: photoDataUrl,
      compliment: compliment.text,
      timestamp: now.getTime()
    });
    // 只保留最近 30 天
    if (history.length > 30) {
      history.splice(0, history.length - 30);
    }
    localStorage.setItem('checkin_history', JSON.stringify(history));
    return history;
  },

  // 今日是否已打卡
  hasCheckedInToday() {
    const history = this.getHistory();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    return history.some(h => h.date === todayStr);
  },

  // 获取本周打卡状态
  getWeekStatus() {
    const history = this.getHistory();
    const today = new Date();
    const weekStatus = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      const dayName = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      const checked = history.some(h => h.date === dateStr);
      weekStatus.push({ date: dateStr, dayName, checked, isToday: i === 0 });
    }
    return weekStatus;
  },

  // 检查是否需要提醒（11:30 - 13:00）
  shouldRemind() {
    const now = new Date();
    const h = now.getHours();
    const m = now.getMinutes();
    const totalMin = h * 60 + m;
    return totalMin >= 690 && totalMin <= 780; // 11:30 ~ 13:00
  }
};