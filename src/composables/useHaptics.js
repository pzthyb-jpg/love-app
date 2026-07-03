// useHaptics.js — 触感反馈工具函数
// iOS 不支持的 vibrate，降级为 CSS 动画

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function vibrate(pattern) {
  if (!isIOS() && navigator.vibrate) {
    navigator.vibrate(pattern)
    return true
  }
  return false
}

// 给元素添加触感回落 CSS 动画
function hapticFallback(el) {
  if (!el) return
  el.classList.remove('haptic-fallback')
  // 触发 reflow
  void el.offsetWidth
  el.classList.add('haptic-fallback')
}

// 综合触感：优先原生 vibrate，降级 CSS 动画
function hapticFeedback(el, pattern = 20) {
  const vibrated = vibrate(pattern)
  if (!vibrated && el) {
    hapticFallback(el)
  }
}

// 预设触感模式
const HAPTIC_PATTERNS = {
  LIGHT: 10,           // tab 切换
  SHUTTER: [15, 30, 15], // 拍照
  SPIN_STOP: 50,       // 转盘停止
  SUBMIT: 20,          // 提交愿望
  ACHIEVEMENT: [50, 100, 50], // 成就达成
  ERROR: [30, 50, 30], // 错误操作
  DELETE: [20, 40, 20] // 删除
}

export { isIOS, vibrate, hapticFallback, hapticFeedback, HAPTIC_PATTERNS }
