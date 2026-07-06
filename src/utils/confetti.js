/**
 * 轻量彩纸动画 — 纯 Canvas 实现，无依赖
 * @param {Object} opts - 配置项
 * @param {number} opts.count - 纸片数量 (默认 30)
 * @param {number} opts.duration - 动画时长 ms (默认 2000)
 * @param {string[]} opts.colors - 颜色数组
 * @param {number} opts.originX - 发射点 X (0~1，默认 0.5)
 * @param {HTMLElement} opts.container - 容器元素 (默认 document.body)
 */
export function launchConfetti(opts = {}) {
  const {
    count = 40,
    duration = 2500,
    colors = ['#FF6B9D', '#FFD700', '#A8E6CF', '#C084FC', '#FF8A80', '#81D4FA'],
    originX = 0.5,
    container = document.body
  } = opts

  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  container.appendChild(canvas)
  const ctx = canvas.getContext('2d')

  const particles = []
  for (let i = 0; i < count; i++) {
    particles.push({
      x: canvas.width * originX + (Math.random() - 0.5) * 60,
      y: canvas.height * 0.4,
      vx: (Math.random() - 0.5) * 12,
      vy: -(Math.random() * 14 + 6),
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 12,
      gravity: 0.35,
      opacity: 1,
      decay: 0.008 + Math.random() * 0.012,
      shape: Math.random() > 0.5 ? 'rect' : 'circle'
    })
  }

  const startTime = performance.now()
  function animate(now) {
    const elapsed = now - startTime
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let alive = 0
    for (const p of particles) {
      if (p.opacity <= 0) continue
      alive++
      p.x += p.vx
      p.vy += p.gravity
      p.y += p.vy
      p.rotation += p.rotationSpeed
      p.vx *= 0.98
      p.opacity -= p.decay

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.fillStyle = p.color
      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    if (alive > 0 && elapsed < duration) {
      requestAnimationFrame(animate)
    } else {
      canvas.remove()
    }
  }
  requestAnimationFrame(animate)
}
