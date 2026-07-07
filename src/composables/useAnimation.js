// ============================================================
// useAnimation — 动画组合式函数
// 提供程序化触发动画的能力，与 vAnimate 指令互补
// 用法：
//   const { fadeInUp, ripple, explosion, shake, pulse } = useAnimation()
//   await fadeInUp(element, { delay: 200 })
// ============================================================

import { ref } from 'vue'

// 检查是否应该执行动画
function shouldAnimate() {
  if (typeof window === 'undefined') return true
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  return !mediaQuery.matches
}

// 工具：等待动画结束
function waitForAnimation(el) {
  return new Promise((resolve) => {
    const onEnd = () => {
      el.removeEventListener('animationend', onEnd)
      resolve()
    }
    el.addEventListener('animationend', onEnd)
    // 超时兜底
    setTimeout(resolve, 1500)
  })
}

// 工具：等待指定时间
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useAnimation() {
  // 全局动画开关（可用于用户设置中关闭动画）
  const animationsEnabled = ref(true)

  function setAnimationsEnabled(enabled) {
    animationsEnabled.value = enabled
  }

  // ============================================================
  // fadeInUp — 淡入上浮
  // ============================================================
  async function fadeInUp(el, options = {}) {
    if (!el || !animationsEnabled.value || !shouldAnimate()) return

    const { delay: delayMs = 0, duration = 500, distance = 24 } = options

    el.classList.add('fade-in-up')

    if (delayMs) {
      el.style.setProperty('--delay', `${delayMs}ms`)
      el.style.animationDelay = `${delayMs}ms`
    }
    if (duration !== 500) {
      el.style.animationDuration = `${duration}ms`
    }
    if (distance !== 24) {
      el.style.setProperty('--fade-distance', `${distance}px`)
    }

    // 初始不可见
    el.style.opacity = '0'
    requestAnimationFrame(() => {
      el.style.opacity = ''
    })

    await waitForAnimation(el)
  }

  // 批量 fadeInUp（staggered）
  async function fadeInUpList(elements, options = {}) {
    if (!animationsEnabled.value || !shouldAnimate()) return

    const { stagger = 80, duration = 500 } = options

    for (let i = 0; i < elements.length; i++) {
      fadeInUp(elements[i], { delay: i * stagger, duration })
      await delay(stagger / 2) // 错开启动
    }
  }

  // ============================================================
  // ripple — 水波纹
  // ============================================================
  async function ripple(el, options = {}) {
    if (!el || !animationsEnabled.value || !shouldAnimate()) return

    const { color = 'light', x, y } = options
    const rect = el.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)

    const posX = x !== undefined ? x - rect.left - size / 2 : rect.width / 2 - size / 2
    const posY = y !== undefined ? y - rect.top - size / 2 : rect.height / 2 - size / 2

    const rippleEl = document.createElement('span')
    rippleEl.className = `ripple-effect ripple-effect--${color}`
    Object.assign(rippleEl.style, {
      width: `${size}px`,
      height: `${size}px`,
      left: `${posX}px`,
      top: `${posY}px`,
      position: 'absolute'
    })

    // 确保容器有 overflow hidden
    const computed = getComputedStyle(el)
    if (computed.overflow === 'visible') {
      el.style.overflow = 'hidden'
    }

    el.appendChild(rippleEl)
    await waitForAnimation(rippleEl)
    rippleEl.remove()
  }

  // ============================================================
  // explosion — 爆炸扩散
  // ============================================================
  async function explosion(el, options = {}) {
    if (!el || !animationsEnabled.value || !shouldAnimate()) return

    const { color = '#E8758A', rings = 3, particles = 8 } = options

    const explodeContainer = document.createElement('span')
    explodeContainer.className = 'explosion-container'
    Object.assign(explodeContainer.style, {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: '10'
    })

    // 环形扩散
    for (let i = 0; i < rings; i++) {
      const ring = document.createElement('span')
      ring.className = 'explosion-ring'
      Object.assign(ring.style, {
        width: `${30 + i * 20}px`,
        height: `${30 + i * 20}px`,
        borderColor: color
      })
      explodeContainer.appendChild(ring)
    }

    // 粒子
    for (let i = 0; i < particles; i++) {
      const angle = (360 / particles) * i
      const tx = Math.cos((angle * Math.PI) / 180) * 60
      const ty = Math.sin((angle * Math.PI) / 180) * 60
      const particle = document.createElement('span')
      particle.className = 'explosion-particle'
      const pSize = Math.random() * 6 + 3
      Object.assign(particle.style, {
        width: `${pSize}px`,
        height: `${pSize}px`,
        background: color,
        left: '50%',
        top: '50%',
        '--tx': `${tx}px`,
        '--ty': `${ty}px`
      })
      explodeContainer.appendChild(particle)
    }

    el.appendChild(explodeContainer)
    await waitForAnimation(explodeContainer)
    explodeContainer.remove()
  }

  // ============================================================
  // shake — 摇晃（错误提示）
  // ============================================================
  async function shake(el) {
    if (!el || !animationsEnabled.value || !shouldAnimate()) return

    el.classList.add('shake')
    await waitForAnimation(el)
    el.classList.remove('shake')
  }

  // ============================================================
  // pulse — 心跳脉冲
  // ============================================================
  async function pulse(el) {
    if (!el || !animationsEnabled.value || !shouldAnimate()) return

    el.classList.add('pulse')
    await waitForAnimation(el)
    el.classList.remove('pulse')
  }

  // ============================================================
  // scaleIn — 缩放进入
  // ============================================================
  async function scaleIn(el) {
    if (!el || !animationsEnabled.value || !shouldAnimate()) return

    el.classList.add('scale-in')
    await waitForAnimation(el)
  }

  // ============================================================
  // slideDown — 下滑进入
  // ============================================================
  async function slideDown(el) {
    if (!el || !animationsEnabled.value || !shouldAnimate()) return

    el.classList.add('slide-down')
    await waitForAnimation(el)
  }

  // ============================================================
  // confetti — 彩纸飘落（庆祝用）
  // ============================================================
  async function confetti(container = document.body, options = {}) {
    if (!animationsEnabled.value || !shouldAnimate()) return

    const {
      count = 30,
      colors = ['#E8758A', '#F4A5B5', '#A78BFA', '#6EE7B7', '#FBBF24', '#FB7185'],
      duration = 1500
    } = options

    const fragments = []

    for (let i = 0; i < count; i++) {
      const piece = document.createElement('span')
      piece.className = 'confetti-piece'
      const color = colors[Math.floor(Math.random() * colors.length)]
      const left = Math.random() * 100
      const delay = Math.random() * 300
      const rotation = Math.random() * 360

      Object.assign(piece.style, {
        left: `${left}%`,
        top: '-10px',
        background: color,
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        transform: `rotate(${rotation}deg)`
      })

      container.appendChild(piece)
      fragments.push(piece)
    }

    await delay(duration + 400)
    fragments.forEach(f => f.remove())
  }

  return {
    animationsEnabled,
    setAnimationsEnabled,
    fadeInUp,
    fadeInUpList,
    ripple,
    explosion,
    shake,
    pulse,
    scaleIn,
    slideDown,
    confetti,
    delay
  }
}
