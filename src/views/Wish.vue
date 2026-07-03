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

    <!-- 输入区域 -->
    <div class="card input-card">
      <van-field
        v-model="inputText"
        type="textarea"
        placeholder="写下你的愿望或吐槽吧..."
        maxlength="200"
        rows="3"
        :autosize="{ maxHeight: 120 }"
        show-word-limit
      />
      <div class="input-footer">
        <div class="input-buttons">
          <van-button type="default" size="small" @click="submitWish" :disabled="!inputText.trim()">
            ✨ 许愿
          </van-button>
          <van-button type="default" size="small" class="vent-btn" @click="submitVent" :disabled="!inputText.trim()">
            😤 吐槽
          </van-button>
        </div>
      </div>
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
        v-for="wish in filteredWishes"
        :key="wish.id"
        class="wish-bubble"
        :class="[
          wish.type === 'vent' ? 'vent' : 'wish',
          wish.fulfilled ? 'fulfilled' : ''
        ]"
        @touchstart.passive="onBubbleTouchStart($event, wish)"
        @touchend="onBubbleTouchEnd($event, wish)"
        @click="onBubbleClick(wish)"
      >
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

    <!-- 数据导出/导入 -->
    <div class="card data-actions-card">
      <div class="data-actions">
        <van-button plain size="small" @click="exportData">
          💾 导出备份
        </van-button>
        <van-button plain size="small" @click="triggerImport">
          📥 导入恢复
        </van-button>
        <input
          ref="importInputRef"
          type="file"
          accept=".json"
          style="display:none"
          @change="importData"
        />
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
  </div>
</template>

<script setup>
import { showToast, showConfirmDialog } from 'vant'
import { ref, computed } from 'vue'
import { useDataStore } from '../stores/dataStore.js'
import { getTodaysMessage, formatMessageText } from '../composables/useMessages.js'
import { getTodayStr, getLoveDays } from '../composables/useStreak.js'
import { hapticFeedback, HAPTIC_PATTERNS } from '../composables/useHaptics.js'
import { safeGetJSON, safeSetJSON, STORAGE_KEYS } from '../composables/useStorage.js'

const { state, addWish, updateWish, deleteWish } = useDataStore()

const inputText = ref('')
const activeFilter = ref('all')
const showAllMessages = ref(false)
const showActionMenu = ref(false)
const selectedWish = ref(null)
const importInputRef = ref(null)
const bubbleAreaRef = ref(null)

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
  const loveDays = getLoveDays(state.loveAnniversary)
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

function submitWish() {
  submitEntry('wish')
}

function submitVent() {
  submitEntry('vent')
}

function submitEntry(type) {
  const text = inputText.value.trim()
  if (!text) return

  const now = new Date()
  const wish = {
    id: Date.now() + Math.random(),
    text,
    type,
    time: now.toISOString(),
    timeStr: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
    dateStr: getTodayStr(),
    fulfilled: false,
    fulfilledBy: null
  }

  addWish(wish)
  inputText.value = ''
  hapticFeedback(null, HAPTIC_PATTERNS.SUBMIT)
  showToast({ message: type === 'wish' ? '✨ 愿望已许下！' : '😤 吐槽已记录！', type: 'success' })
}

// 长按检测
function onBubbleTouchStart(event, wish) {
  isLongPress = false
  longPressTimer = setTimeout(() => {
    isLongPress = true
    selectedWish.value = wish
    showActionMenu.value = true
    hapticFeedback(null, HAPTIC_PATTERNS.LIGHT)
  }, 500)
}

function onBubbleTouchEnd(event, wish) {
  clearTimeout(longPressTimer)
  // 如果已经触发了长按菜单，不再触点击
}

function onBubbleClick(wish) {
  if (isLongPress) {
    isLongPress = false
    return
  }
  // 点击可直接查看详情（暂时不实现复杂功能）
}

function closeActionMenu() {
  selectedWish.value = null
}

function markAsFulfilled() {
  if (!selectedWish.value) return
  const name = prompt('谁实现的？(可选)') || '男朋友'
  updateWish(selectedWish.value.id, {
    fulfilled: true,
    fulfilledBy: name
  })
  hapticFeedback(null, HAPTIC_PATTERNS.ACHIEVEMENT)
  showToast({ message: '🎉 愿望已标记为实现！', type: 'success' })
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

// 数据导出
function exportData() {
  const data = {
    version: '2.0',
    exportedAt: new Date().toISOString(),
    wishes: state.wishes
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `愿望池备份_${getTodayStr()}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast({ message: '💾 备份文件已下载', type: 'success' })
}

function triggerImport() {
  importInputRef.value?.click()
}

function importData(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result)
      if (!data.version || !data.wishes) {
        showToast({ message: '⚠️ 格式不正确，导入失败', type: 'fail' })
        return
      }
      // 合并导入
      const existingIds = new Set(state.wishes.map(w => w.id))
      const newWishes = data.wishes.filter(w => !existingIds.has(w.id))
      if (newWishes.length === 0) {
        showToast({ message: '没有新的内容可导入' })
        return
      }
      newWishes.forEach(w => addWish(w))
      showToast({ message: `📥 成功导入 ${newWishes.length} 条内容`, type: 'success' })
    } catch (err) {
      showToast({ message: '⚠️ 文件解析失败', type: 'fail' })
    }
  }
  reader.readAsText(file)
  // 重置 input 以便重复选择同一文件
  event.target.value = ''
}
</script>

<style scoped>
.wish-page {
  padding-bottom: calc(var(--space-3xl) + var(--safe-bottom));
}

/* 留言预览 */
.msg-preview-card {
  cursor: pointer;
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
  background: linear-gradient(135deg, #F3E8FF, #E8F0FE);
  border: 1px solid rgba(124, 58, 237, 0.15);
}

.wish-bubble.wish .bubble-text {
  color: #7C3AED;
}

/* 吐槽气泡 */
.wish-bubble.vent {
  background: linear-gradient(135deg, #FFE5D9, #FFF0F3);
  border: 1px solid rgba(214, 59, 95, 0.15);
}

.wish-bubble.vent .bubble-text {
  color: #D63B5F;
}

/* 已实现气泡 */
.wish-bubble.fulfilled {
  background: linear-gradient(135deg, #FFF8E1, #FFFDE7) !important;
  border: 1px solid rgba(255, 215, 0, 0.3) !important;
}

.wish-bubble.fulfilled .bubble-text {
  color: #F57F17 !important;
  text-decoration: line-through;
  opacity: 0.7;
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
    transform: translateY(12px) scale(0.96);
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

/* 数据操作 */
.data-actions-card {
  padding: var(--space-md) var(--space-xl);
}

.data-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-lg);
}

/* 移动端适配 */
@media (min-width: 768px) {
  .wish-page {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>
