<template>
  <div class="page wish-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="emoji">✨</span>
      <h2>愿望池</h2>
    </div>

    <!-- 来自男朋友的话 -->
    <div v-if="latestMessage" class="card msg-preview-card" @click="showAllMessages = true">
      <div class="msg-preview">
        <div class="msg-avatar">💌</div>
        <div class="msg-content">
          <div class="msg-label">💕 来自男朋友的话</div>
          <p class="msg-text">"{{ latestMessage.text }}"</p>
          <p class="msg-meta">— {{ latestMessage.author }} · 查看全部 →</p>
        </div>
      </div>
    </div>

    <!-- 新增入口 -->
    <div class="card input-card">
      <van-button type="primary" round block @click="goToNewWishForm">
        ✨ 许愿/吐槽
      </van-button>
      <p class="input-hint">点击按钮跳转新页面，写下你的愿望或吐槽吧</p>
    </div>

    <!-- 筛选栏 -->
    <van-tabs v-model:active="activeFilter" type="card" class="filter-tabs" color="var(--primary)" background="transparent">
      <van-tab title="🌊 全部" name="all" />
      <van-tab title="✨ 愿望" name="wish" />
      <van-tab title="😤 吐槽" name="vent" />
      <van-tab title="✅ 已实现" name="fulfilled" />
    </van-tabs>

    <!-- 气泡展示区 -->
    <div class="bubble-area" ref="bubbleAreaRef">
      <div v-if="filteredWishes.length === 0" class="empty-state">
        <div class="emoji">🌈</div>
        <p>还没有{{ activeFilter === 'all' ? '' : '符合条件的' }}内容哦</p>
      </div>
      <div
        v-for="(wish, index) in filteredWishes"
        :key="wish.id"
        class="wish-bubble"
        :class="[
          wish.type === 'vent' ? 'vent' : 'wish',
          wish.fulfilled ? 'fulfilled' : ''
        ]"
        :style="{ animationDelay: (index * 60) + 'ms' }"
        @touchstart.passive="onBubbleTouchStart($event, wish)"
        @touchend="onBubbleTouchEnd($event, wish)"
      >
        <div v-if="longPressProgress > 0" class="bubble-progress-ring" :style="{ '--progress': longPressProgress }"></div>
        <div class="bubble-deco">
          <span v-if="wish.type === 'wish' && !wish.fulfilled">⭐</span>
          <span v-else-if="wish.type === 'vent'">⚡</span>
          <span v-else>✅</span>
        </div>
        <p class="bubble-text">{{ wish.text }}</p>
        <div class="bubble-meta">
          <span class="bubble-time">{{ wish.timeStr || wish.dateStr }}</span>
          <span v-if="wish.fulfilled && wish.fulfilledBy" class="bubble-fulfilled-by">
            · {{ wish.fulfilledBy }} 实现
          </span>
        </div>
      </div>
    </div>

    <!-- 留言详情弹窗 -->
    <Teleport to="body">
      <div v-if="showAllMessages" class="dialog-overlay" @click.self="showAllMessages = false">
        <div class="dialog-box messages-dialog">
          <h3>💌 男朋友的留言板</h3>
          <div class="messages-list">
            <div v-if="allMessages.length === 0" class="empty-msg">
              还没有留言哦 💕
            </div>
            <div
              v-for="msg in allMessages"
              :key="msg.id"
              class="message-item"
            >
              <div class="msg-type-tag" :class="msg.type">{{ typeLabel(msg.type) }}</div>
              <p class="message-text">"{{ msg.text }}"</p>
              <p class="message-author">— {{ msg.author }} · {{ msg.createdAt }}</p>
            </div>
          </div>
          <div class="dialog-actions">
            <van-button type="primary" size="small" @click="showAllMessages = false">
              知道了 💕
            </van-button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 操作菜单 - Vant ActionSheet -->
    <van-action-sheet
      v-model:show="showActionMenu"
      :actions="actionSheetActions"
      @select="onActionSelect"
      @cancel="closeActionMenu"
      close-on-click-action
      cancel-text="取消"
    />

    <!-- 标记实现弹窗 -->
    <Teleport to="body">
      <div v-if="showFulfillDialog" class="dialog-overlay" @click.self="showFulfillDialog = false">
        <div class="dialog-box fulfill-dialog">
          <div class="fulfill-emoji">🎉</div>
          <h3>愿望要实现了哦～</h3>
          <p class="fulfill-label">实现的人是 ___</p>
          <van-field v-model="fulfillName" placeholder="输入姓名" maxlength="20" class="fulfill-input" />
          <div class="fulfill-emoji-row">
            <span v-for="emoji in ['💖','💕','💝','💘','💗']" :key="emoji" class="fulfill-emoji-item" :class="{ selected: fulfillEmoji === emoji }" @click="fulfillEmoji = emoji">{{ emoji }}</span>
          </div>
          <div class="dialog-actions">
            <van-button type="default" @click="showFulfillDialog = false">取消</van-button>
            <van-button type="primary" @click="confirmFulfill">确认 ✨</van-button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { showToast, showConfirmDialog } from 'vant'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore.js'
import { getTodaysMessage, formatMessageText } from '../composables/useMessages.js'
import { getTodayStr, getLoveDays } from '../composables/useStreak.js'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'

const router = useRouter()
const { state, updateWish, deleteWish, loveAnniversary } = useDataStore()

const activeFilter = ref('all')
const showAllMessages = ref(false)
const showActionMenu = ref(false)
const selectedWish = ref(null)
const bubbleAreaRef = ref(null)

// 标记实现弹窗
const showFulfillDialog = ref(false)
const fulfillName = ref('')
const fulfillEmoji = ref('💖')

// 长按进度
const longPressProgress = ref(0)
let longPressTimer = null
let isLongPress = false

// 所有留言（用于弹窗）
const allMessages = computed(() => {
  return state.messages && state.messages.length > 0
    ? [...state.messages].reverse()
    : []
})

// 最新一条留言
const latestMessage = computed(() => {
  if (!state.messages || !state.messages.length) return null
  const today = getTodayStr()
  const hour = new Date().getHours()
  const loveDays = getLoveDays(loveAnniversary.value)
  const result = getTodaysMessage(state.messages, today, hour)
  if (!result) return null
  return {
    ...result,
    text: formatMessageText(result.text, loveDays)
  }
})

// 筛选后的愿望
const filteredWishes = computed(() => {
  let list = [...state.wishes]
  switch (activeFilter.value) {
    case 'wish':
      list = list.filter(w => w.type === 'wish' && !w.fulfilled)
      break
    case 'vent':
      list = list.filter(w => w.type === 'vent')
      break
    case 'fulfilled':
      list = list.filter(w => w.fulfilled)
      break
  }
  return list
})

// 操作菜单选项
const actionSheetActions = computed(() => {
  const actions = []
  if (selectedWish.value && !selectedWish.value.fulfilled) {
    actions.push({ name: '✅ 标记已实现', value: 'fulfill' })
  }
  actions.push({ name: '🗑️ 删除', value: 'delete', color: '#D63B5F' })
  return actions
})

function onActionSelect(action) {
  if (action.value === 'fulfill') {
    markAsFulfilled()
  } else if (action.value === 'delete') {
    confirmDelete()
  }
}

function typeLabel(type) {
  const labels = {
    morning: '🌅 早安',
    evening: '🌙 晚安',
    random: '🎲 随机',
    special: '🎉 特殊日'
  }
  return labels[type] || type
}

// 跳转新增许愿/吐槽表单
function goToNewWishForm() {
  router.push('/wishlist/new')
}


function onBubbleTouchEnd(event, wish) {
  if (longPressTimer) {
    clearInterval(longPressTimer)
    longPressTimer = null
  }
  if (!isLongPress) {
    longPressProgress.value = 0
  }
}

function onBubbleClick(wish) {
  if (isLongPress) {
    isLongPress = false
    return
  }
  // 点击可直接查看详情（暂时不实现复杂功能）
}

function onBubbleTouchStart(event, wish) {
  isLongPress = false
  selectedWish.value = wish
  longPressProgress.value = 0
  if (longPressTimer) clearInterval(longPressTimer)
  let progress = 0
  longPressTimer = setInterval(() => {
    progress += 10
    longPressProgress.value = progress
    if (progress >= 100) {
      clearInterval(longPressTimer)
      longPressTimer = null
      isLongPress = true
      longPressProgress.value = 0
      showActionMenu.value = true
    }
  }, 50)
}

function closeActionMenu() {
  selectedWish.value = null
}
// 标记已实现
function markAsFulfilled() {
  if (!selectedWish.value) return
  fulfillName.value = ''
  fulfillEmoji.value = '💖'
  showFulfillDialog.value = true
}

function confirmFulfill() {
  if (!selectedWish.value) return
  const name = fulfillName.value.trim() || '男朋友'
  updateWish(selectedWish.value.id, {
    fulfilled: true,
    fulfilledBy: name,
    fulfilledEmoji: fulfillEmoji.value
  })
  hapticFeedback(null, HAPTIC_PATTERNS.ACHIEVEMENT)
  showToast({ message: '🎉 愿望已标记为实现！', type: 'success' })
  showFulfillDialog.value = false
  closeActionMenu()
}

function confirmDelete() {
  if (!selectedWish.value) return
  showConfirmDialog({
    title: '确定删除？',
    message: '确定删除这条内容吗？'
  }).then(() => {
    deleteWish(selectedWish.value.id)
    hapticFeedback(null, HAPTIC_PATTERNS.DELETE)
    showToast({ message: '已删除' })
  }).catch(() => {})
  closeActionMenu()
}
</script>

<style scoped>
.wish-page {
  padding-bottom: calc(var(--space-3xl) + var(--safe-bottom));
}

/* 留言预览 */
.msg-preview-card {
  cursor: pointer;
  border: 1px solid rgba(232, 117, 138, 0.1);
  background: linear-gradient(135deg, var(--bg-card), var(--warm-pink));
  transition: transform var(--transition-fast);
}

.msg-preview-card:active {
  transform: scale(0.98);
}

.msg-preview {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.msg-avatar {
  font-size: 28px;
  flex-shrink: 0;
}

.msg-content {
  flex: 1;
}

.msg-label {
  font-size: var(--font-caption);
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 2px;
}

.msg-text {
  font-size: var(--font-body);
  color: var(--text);
  line-height: 1.6;
}

.msg-meta {
  font-size: var(--font-caption);
  color: var(--text-secondary);
  margin-top: var(--space-xs);
}

/* 输入区域 */
.input-card {
  padding-bottom: var(--space-md);
}

van-field ::placeholder {
  opacity: 0.3;
}

.wish-input {
  min-height: 72px;
}

.input-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-sm);
}

.char-count {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.input-buttons {
  display: flex;
  gap: var(--space-sm);
}

.vent-btn {
  border-color: var(--coral);
  color: var(--coral);
}

.vent-btn:active {
  background: var(--coral);
  color: white;
}

/* 筛选栏 - Vant Tabs Card 风格 */
.filter-tabs {
  margin-bottom: var(--space-lg);
}

/* 将 Card 类型 tabs 覆盖为圆角胶囊 */
.filter-tabs {
  --van-tabs-card-height: 36px;
}

.filter-tabs :deep(.van-tabs__nav--card) {
  border: none;
  gap: var(--space-sm);
  padding: 2px;
}

.filter-tabs :deep(.van-tab--card) {
  border-radius: var(--radius-round);
  border: 1.5px solid var(--border);
  font-size: var(--font-body-small);
  font-weight: 500;
  color: var(--text-secondary);
  background: var(--cream);
  padding: 0 var(--space-md);
  transition: all var(--transition-fast);
}

.filter-tabs :deep(.van-tab--card.van-tab--active) {
  background: var(--primary) !important;
  color: white !important;
  border-color: var(--primary) !important;
}

.filter-tabs :deep(.van-tabs__wrap) {
  overflow: visible;
}

/* 气泡展示区 */
.bubble-area {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: var(--space-lg);
}

.wish-bubble {
  position: relative;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
  animation: bubbleIn 0.3s ease;
  user-select: none;
  -webkit-user-select: none;
}

.wish-bubble:active {
  transform: scale(0.98);
}

/* 愿望气泡 */
.wish-bubble.wish {
  background: linear-gradient(135deg, #F3E8FF, #EDE9FE);
  border: 1px solid rgba(124, 58, 237, 0.12);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.06);
}

.wish-bubble.wish .bubble-text {
  color: #7C3AED;
}

/* 吐槽气泡 */
.wish-bubble.vent {
  background: linear-gradient(135deg, #FFE5D9, #FFF0F3);
  border: 1px solid rgba(214, 59, 95, 0.12);
  box-shadow: 0 2px 8px rgba(214, 59, 95, 0.06);
}

.wish-bubble.vent .bubble-text {
  color: #D63B5F;
}

/* 已实现气泡 */
.wish-bubble.fulfilled {
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7) !important;
  border: 1px solid rgba(251, 191, 36, 0.25) !important;
  box-shadow: 0 2px 8px rgba(251, 191, 36, 0.08) !important;
}

.wish-bubble.fulfilled .bubble-text {
  color: #F57F17 !important;
  text-decoration: line-through;
  opacity: 0.7;
}

/* === 深色模式气泡适配 === */
html[data-theme="dark"] .wish-bubble.wish {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.18), rgba(124, 58, 237, 0.10));
  border: 1px solid rgba(167, 139, 250, 0.25);
  box-shadow: none;
}

html[data-theme="dark"] .wish-bubble.wish .bubble-text {
  color: #C4B5FD;
}

html[data-theme="dark"] .wish-bubble.vent {
  background: linear-gradient(135deg, rgba(214, 59, 95, 0.18), rgba(214, 59, 95, 0.10));
  border: 1px solid rgba(251, 113, 133, 0.25);
  box-shadow: none;
}

html[data-theme="dark"] .wish-bubble.vent .bubble-text {
  color: #FDA4AF;
}

html[data-theme="dark"] .wish-bubble.fulfilled {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.16), rgba(251, 191, 36, 0.08)) !important;
  border: 1px solid rgba(251, 191, 36, 0.25) !important;
  box-shadow: none !important;
}

html[data-theme="dark"] .wish-bubble.fulfilled .bubble-text {
  color: #FCD34D !important;
}

.bubble-deco {
  font-size: 14px;
  margin-bottom: var(--space-xs);
  opacity: 0.6;
}

.bubble-text {
  font-size: var(--font-body);
  line-height: 1.6;
  font-weight: 500;
}

.bubble-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: var(--space-sm);
  font-size: var(--font-caption);
  color: var(--text-secondary);
  opacity: 0.6;
}

.bubble-fulfilled-by {
  color: var(--gold);
  font-weight: 500;
}

@keyframes bubbleIn {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 留言详情弹窗 */
.messages-dialog {
  max-width: 340px;
  width: 90%;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  margin-bottom: var(--space-lg);
  text-align: left;
}

.empty-msg {
  text-align: center;
  color: var(--text-secondary);
  padding: var(--space-lg);
}

.message-item {
  padding: var(--space-md);
  border-bottom: 1px solid var(--border);
}

.message-item:last-child {
  border-bottom: none;
}

.msg-type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-badge);
  font-weight: 500;
  margin-bottom: var(--space-xs);
}

.msg-type-tag.morning {
  background: #E3F2FD;
  color: #1565C0;
}

.msg-type-tag.evening {
  background: #F3E5F5;
  color: #7B1FA2;
}

.msg-type-tag.random {
  background: #FFF3E0;
  color: #E65100;
}

.msg-type-tag.special {
  background: #FFEBEE;
  color: #C62828;
}

/* === 深色模式标签适配 === */
html[data-theme="dark"] .msg-type-tag.morning {
  background: rgba(21, 101, 192, 0.25);
  color: #90CAF9;
}

html[data-theme="dark"] .msg-type-tag.evening {
  background: rgba(123, 31, 162, 0.25);
  color: #CE93D8;
}

html[data-theme="dark"] .msg-type-tag.random {
  background: rgba(230, 81, 0, 0.25);
  color: #FFCC80;
}

html[data-theme="dark"] .msg-type-tag.special {
  background: rgba(198, 40, 40, 0.25);
  color: #EF9A9A;
}

.message-text {
  font-size: var(--font-body);
  color: var(--text);
  line-height: 1.5;
  margin-bottom: 2px;
}

.message-author {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

/* 长按进度环 */
.bubble-progress-ring {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: conic-gradient(var(--primary) calc(var(--progress, 0) * 360deg), transparent 0);
  z-index: 10;
  pointer-events: none;
}
.bubble-progress-ring::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--white);
}

/* 标记实现弹窗 */
.fulfill-dialog {
  text-align: center;
}
.fulfill-emoji {
  font-size: 48px;
  margin-bottom: var(--space-sm);
  animation: bounceIn 0.4s ease;
}
.fulfill-label {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}
.fulfill-input {
  margin-bottom: var(--space-md);
}
.fulfill-emoji-row {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}
.fulfill-emoji-item {
  font-size: 28px;
  cursor: pointer;
  transition: transform var(--transition-fast);
  opacity: 0.5;
}
.fulfill-emoji-item.selected {
  transform: scale(1.3);
  opacity: 1;
}
.dialog-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

/* 移动端适配 */
@media (min-width: 768px) {
  .wish-page {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>
