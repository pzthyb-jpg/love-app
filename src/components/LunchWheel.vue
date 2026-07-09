<template>
  <div class="wheel-wrapper">
    <!-- 外圈流光装饰 -->
    <div class="wheel-ring">
      <div class="ring-glow"></div>
    </div>

    <!-- Canvas 转盘 -->
    <canvas
      ref="canvasRef"
      :width="canvasSize"
      :height="canvasSize"
      class="wheel-canvas"
    ></canvas>

    <!-- 指针 -->
    <div class="wheel-pointer" :class="{ 'pointer-bounce': pointerBounce }">
      <div class="pointer-arrow">▼</div>
    </div>

    <!-- 中间按钮 -->
    <button
      class="wheel-center-btn"
      :class="{ spinning: isSpinning }"
      @click="startSpin"
      :disabled="isSpinning || restaurants.length < 2"
    >
      <span v-if="isSpinning">🎡</span>
      <span v-else>🔀</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'

const props = defineProps({
  restaurants: {
    type: Array,
    default: () => []
  },
  spinning: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['spin-end', 'spin-start'])

const canvasRef = ref(null)
const canvasSize = 300
const isSpinning = ref(false)
const pointerBounce = ref(false)

let currentRotation = 0
let animationId = null
const COLORS = [
  '#E8758A', '#C084FC', '#FFD700', '#A8E6CF', '#FF8A80',
  '#81D4FA', '#FFB74D', '#CE93D8', '#80CBC4', '#F48FB1',
  '#B39DDB', '#FFCC80', '#90CAF9', '#A5D6A7', '#EF9A9A'
]

function drawWheel(rotation = 0) {
  const canvas = canvasRef.value
  if (!canvas || !props.restaurants.length) return

  const ctx = canvas.getContext('2d')
  const center = canvasSize / 2
  const radius = center - 8
  const count = props.restaurants.length
  const arcSize = (2 * Math.PI) / count

  ctx.clearRect(0, 0, canvasSize, canvasSize)

  // 绘制扇形
  for (let i = 0; i < count; i++) {
    const startAngle = rotation + i * arcSize
    const endAngle = startAngle + arcSize

    ctx.beginPath()
    ctx.moveTo(center, center)
    ctx.arc(center, center, radius, startAngle, endAngle)
    ctx.closePath()

    // 扇形填充
    const color = COLORS[i % COLORS.length]
    ctx.fillStyle = color
    ctx.fill()

    // 扇形描边
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    // 文字
    const midAngle = startAngle + arcSize / 2
    const textRadius = radius * 0.6
    const textX = center + Math.cos(midAngle) * textRadius
    const textY = center + Math.sin(midAngle) * textRadius

    ctx.save()
    ctx.translate(textX, textY)
    ctx.rotate(midAngle)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 13px -apple-system, "PingFang SC", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    const name = props.restaurants[i].name || ''
    const emoji = props.restaurants[i].emoji || ''
    const displayText = emoji ? `${emoji} ${name}` : name

    // 截断文字
    const maxWidth = radius * 0.38
    let text = displayText
    if (ctx.measureText(text).width > maxWidth) {
      text = text.slice(0, 4) + '..'
    }
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }

  // 中心圆
  ctx.beginPath()
  ctx.arc(center, center, 28, 0, 2 * Math.PI)
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.strokeStyle = '#E8758A'
  ctx.lineWidth = 3
  ctx.stroke()

  // 外圈
  ctx.beginPath()
  ctx.arc(center, center, radius + 2, 0, 2 * Math.PI)
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'
  ctx.lineWidth = 4
  ctx.stroke()
}

function getWinnerIndex(rotation) {
  const count = props.restaurants.length
  if (count === 0) return 0
  const arcSize = (2 * Math.PI) / count
  // 指针在顶部（-π/2 方向）
  // 标准化旋转角度
  let normRotation = rotation % (2 * Math.PI)
  if (normRotation < 0) normRotation += 2 * Math.PI
  // 计算指针位置对应的扇形索引
  // 指针指向顶部，即角度为 -π/2
  const pointerAngle = (3 * Math.PI) / 2 // 顶部方向
  const sectorAngle = (pointerAngle - normRotation + 2 * Math.PI) % (2 * Math.PI)
  const index = Math.floor(sectorAngle / arcSize)
  return index % count
}

function startSpin() {
  if (isSpinning.value || props.restaurants.length < 2) return

  isSpinning.value = true
  emit('spin-start')

  hapticFeedback(null, HAPTIC_PATTERNS.SPIN_STOP)

  const spinDuration = 4000 // 4秒
  const startTime = performance.now()
  // 随机旋转 5-8 圈 + 随机偏移
  const extraRotations = (5 + Math.random() * 3) * 2 * Math.PI
  const randomOffset = Math.random() * 2 * Math.PI
  const totalRotation = extraRotations + randomOffset
  const startRotation = currentRotation

  function animate(time) {
    const elapsed = time - startTime
    const progress = Math.min(elapsed / spinDuration, 1)

    // cubic-out 缓动：减速效果
    const eased = 1 - Math.pow(1 - progress, 4)

    currentRotation = startRotation + totalRotation * eased
    drawWheel(currentRotation)

    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      // 停止
      animationId = null
      currentRotation = startRotation + totalRotation

      // 指针弹簧回弹
      pointerBounce.value = true
      setTimeout(() => { pointerBounce.value = false }, 300)

      hapticFeedback(null, HAPTIC_PATTERNS.SPIN_STOP)

      isSpinning.value = false

      // 计算选中结果
      const winnerIndex = getWinnerIndex(currentRotation)
      const winner = props.restaurants[winnerIndex]
      emit('spin-end', winner)
    }
  }

  animationId = requestAnimationFrame(animate)
}

function resetWheel() {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  isSpinning.value = false
  currentRotation = 0
  drawWheel(0)
}

defineExpose({ startSpin, resetWheel })

onMounted(() => {
  nextTick(() => drawWheel(0))
})

watch(() => props.restaurants, () => {
  resetWheel()
}, { deep: true })
</script>

<style scoped>
.wheel-wrapper {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 外圈流光 */
.wheel-ring {
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  background: conic-gradient(
    #E8758A, #C084FC, #FFD700, #A8E6CF, #FF8A80,
    #E8758A, #C084FC, #FFD700, #A8E6CF, #FF8A80,
    #E8758A
  );
  animation: ringSpin 3s linear infinite;
  mask: radial-gradient(circle at center, transparent 152px, black 154px);
  -webkit-mask: radial-gradient(circle at center, transparent 152px, black 154px);
}

.ring-glow {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: inherit;
  filter: blur(6px);
  opacity: 0.3;
  animation: ringSpin 3s linear infinite;
  mask: radial-gradient(circle at center, transparent 152px, black 154px);
  -webkit-mask: radial-gradient(circle at center, transparent 152px, black 154px);
}

@keyframes ringSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.wheel-canvas {
  position: relative;
  z-index: 2;
  border-radius: 50%;
  width: 300px;
  height: 300px;
}

/* 指针 */
.wheel-pointer {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.wheel-pointer.pointer-bounce {
  transform: translateX(-50%) translateY(6px) scale(0.9);
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pointer-arrow {
  font-size: 28px;
  color: var(--primary);
  text-shadow: 0 2px 8px rgba(232, 117, 138, 0.4);
  line-height: 1;
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.15));
}

/* 中间按钮 */
.wheel-center-btn {
  position: absolute;
  z-index: 4;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 3px solid var(--primary);
  background: var(--white);
  font-size: 22px;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.wheel-center-btn:active:not(:disabled) {
  transform: scale(0.92);
}

.wheel-center-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.wheel-center-btn.spinning {
  animation: pulseBtn 0.8s ease infinite;
}

@keyframes pulseBtn {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* 移动端适配 */
@media (max-width: 374px) {
  .wheel-wrapper,
  .wheel-canvas {
    width: 260px;
    height: 260px;
  }
  .wheel-ring {
    inset: -8px;
    -webkit-mask: radial-gradient(circle at center, transparent 132px, black 134px);
    mask: radial-gradient(circle at center, transparent 132px, black 134px);
  }
}
</style>
