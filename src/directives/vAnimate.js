// ============================================================
// vAnimate — Vue 3 自定义动画指令
// 用法：
//   <div v-fade-in-up>内容</div>
//   <div v-fade-in-up="{ delay: 200 }">内容</div>
//   <button v-ripple>点击我</button>
//   <button v-ripple="{ color: 'primary' }">点击我</button>
//   <div v-explosion>爆炸效果</div>
// ============================================================

import './../assets/styles/animations.css'

// --- 工具函数 ---

function applyStyles(el, styles) {
  Object.assign(el.style, styles)
}

function removeStyles(el, styles) {
  styles.forEach(s => { el.style[s] = '' })
}

// 处理 prefers-reduced-motion
function shouldAnimate() {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  return !mediaQuery.matches
}

// ============================================================
// v-fade-in-up — 元素出现时淡入上浮
// 选项: { delay?: number, duration?: number, distance?: number }
// ============================================================
const fadeInUp = {
  mounted(el, binding) {
    const options = binding.value || {}
    const { delay = 0, duration = 500, distance = 24 } = options

    el.classList.add('fade-in-up')

    if (delay) {
      el.style.setProperty('--delay', `${delay}ms`)
      el.style.animationDelay = `${delay}ms`
    }
    if (duration !== 500) {
      el.style.animationDuration = `${duration}ms`
    }
    if (distance !== 24) {
      // 动态设置距离
      el.style.setProperty('--fade-distance', `${distance}px`)
    }

    // 确保初始不可见防止闪烁
    el.style.opacity = '0'
    requestAnimationFrame(() => {
      el.style.opacity = ''
    })
  }
}

// ============================================================
// v-ripple — 点击水波纹效果
// 选项: { color?: 'light' | 'dark' | 'primary' }
// ============================================================
const ripple = {
  mounted(el, binding) {
    const options = binding.value || {}
    const color = options.color || 'light'

    // 确保容器有正确的样式
    if (getComputedStyle(el).position === 'static') {
      el.classList.add('ripple-container')
    }

    const handler = (event) => {
      if (!shouldAnimate()) return

      const rect = el.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = event.clientX - rect.left - size / 2
      const y = event.clientY - rect.top - size / 2

      const rippleEl = document.createElement('span')
      rippleEl.className = `ripple-effect ripple-effect--${color}`
      applyStyles(rippleEl, {
        width: `${size}px`,
        height: `${size}px`,
        left: `${x}px`,
        top: `${y}px`
      })

      el.appendChild(rippleEl)

      const cleanup = () => {
        rippleEl.remove()
      }
      rippleEl.addEventListener('animationend', cleanup, { once: true })
    }

    el._rippleHandler = handler
    el.addEventListener('pointerdown', handler)
  },

  unmounted(el) {
    if (el._rippleHandler) {
      el.removeEventListener('pointerdown', el._rippleHandler)
      delete el._rippleHandler
    }
  }
}

// ============================================================
// v-explosion — 爆炸扩散效果
// 选项: { color?: string, rings?: number, particles?: number }
// ============================================================
const explode = {
  mounted(el, binding) {
    const options = binding.value || {}
    const { color = '#E8758A', rings = 3, particles = 8 } = options

    // 确保容器有正确的样式
    const computed = getComputedStyle(el)
    if (computed.position === 'static') {
      applyStyles(el, { position: 'relative' })
    }

    const handler = (event) => {
      if (!shouldAnimate()) return

      // 创建爆炸容器
      const explodeContainer = document.createElement('span')
      explodeContainer.className = 'explosion-container'
      applyStyles(explodeContainer, {
        position: 'absolute',
        inset: '0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: '10'
      })

      // 创建环形扩散
      for (let i = 0; i < rings; i++) {
        const ring = document.createElement('span')
        ring.className = 'explosion-ring'
        applyStyles(ring, {
          width: `${30 + i * 20}px`,
          height: `${30 + i * 20}px`,
          borderColor: color
        })
        explodeContainer.appendChild(ring)
      }

      // 创建粒子
      for (let i = 0; i < particles; i++) {
        const angle = (360 / particles) * i
        const tx = Math.cos((angle * Math.PI) / 180) * 60
        const ty = Math.sin((angle * Math.PI) / 180) * 60
        const particle = document.createElement('span')
        particle.className = 'explosion-particle'
        const size = Math.random() * 6 + 3
        applyStyles(particle, {
          width: `${size}px`,
          height: `${size}px`,
          background: color,
          left: '50%',
          top: '50%',
          '--tx': `${tx}px`,
          '--ty': `${ty}px`
        })
        explodeContainer.appendChild(particle)
      }

      el.appendChild(explodeContainer)

      const cleanup = () => {
        explodeContainer.remove()
      }
      explodeContainer.addEventListener('animationend', cleanup, { once: true })

      // 双保险：确保动画结束后清理
      setTimeout(cleanup, 1500)
    }

    el._explodeHandler = handler
    el.addEventListener('pointerdown', handler)
  },

  unmounted(el) {
    if (el._explodeHandler) {
      el.removeEventListener('pointerdown', el._explodeHandler)
      delete el._explodeHandler
    }
  }
}

// ============================================================
// 导出所有动画指令
// ============================================================
export default {
  install(app) {
    app.directive('fade-in-up', fadeInUp)
    app.directive('ripple', ripple)
    app.directive('explosion', explode)
  }
}

// 单独导出以供按需导入
export { fadeInUp, ripple, explode }
