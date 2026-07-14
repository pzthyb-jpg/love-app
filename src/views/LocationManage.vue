<template>
  <div class="page settings-page">
    <div class="page-header">
      <span class="back-btn" @click="router.back()">‹</span>
      <span class="emoji">📍</span>
      <h2>共享位置管理</h2>
    </div>

    <!-- 位置精度 -->
    <div class="card settings-card">
      <div class="card-title">位置精度</div>
      <div class="radio-group">
        <label class="radio-item" :class="{ active: locationPrecision === 'precise' }" @click="locationPrecision = 'precise'">
          <span class="radio-dot"></span>
          <div class="radio-info">
            <div class="radio-label">精确</div>
            <div class="radio-desc">GPS 定位，精度最高</div>
          </div>
        </label>
        <label class="radio-item" :class="{ active: locationPrecision === 'approximate' }" @click="locationPrecision = 'approximate'">
          <span class="radio-dot"></span>
          <div class="radio-info">
            <div class="radio-label">大致</div>
            <div class="radio-desc">约 1km 范围</div>
          </div>
        </label>
        <label class="radio-item" :class="{ active: locationPrecision === 'off' }" @click="locationPrecision = 'off'">
          <span class="radio-dot"></span>
          <div class="radio-info">
            <div class="radio-label">关闭</div>
            <div class="radio-desc">不共享位置</div>
          </div>
        </label>
      </div>
    </div>

    <!-- 智能关闭 -->
    <div class="card settings-card">
      <div class="setting-item">
        <div class="setting-info">
          <div class="setting-icon">🤖</div>
          <div class="setting-text">
            <div class="setting-label">智能关闭</div>
            <div class="setting-desc">双方长时间不再共享时自动关闭连接</div>
          </div>
        </div>
        <div class="setting-action">
          <van-switch :model-value="autoCloseEnabled" size="24px" @update:model-value="toggleAutoClose" />
        </div>
      </div>
    </div>

    <!-- 共享管理 -->
    <div class="card settings-card">
      <div class="section-header">
        <div class="section-title">共享管理</div>
        <button v-if="activeShares.length > 0" class="close-all-btn" @click="confirmCloseAll">关闭全部</button>
      </div>
      <div v-if="activeShares.length === 0" class="manage-empty">
        暂无共享中的关系
      </div>
      <div v-else class="manage-list">
        <div v-for="share in activeShares" :key="share.id" class="manage-item">
          <div class="manage-avatar">👤</div>
          <div class="manage-info">
            <div class="manage-name">{{ getPartnerName(share) }}</div>
            <div class="manage-time">{{ formatTime(share.created_at) }}开始共享</div>
          </div>
          <button class="manage-close-btn" @click="onCloseShare(share)">关闭</button>
        </div>
      </div>
    </div>

    <!-- 黑名单 -->
    <div class="card settings-card">
      <div class="section-header">
        <div class="section-title">黑名单</div>
      </div>
      <div v-if="blacklist.length === 0" class="manage-empty">
        黑名单为空
      </div>
      <div v-else class="manage-list">
        <div v-for="item in blacklist" :key="item.id" class="manage-item">
          <div class="manage-avatar">👤</div>
          <div class="manage-info">
            <div class="manage-name">{{ item.partner_name || '未知用户' }}</div>
            <div class="manage-time">{{ formatTime(item.created_at) }}拉黑</div>
          </div>
          <button class="manage-unblock-btn" @click="onUnblock(item)">解除</button>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="card settings-card">
      <div class="setting-item" @click="exportLocationData">
        <div class="setting-info">
          <div class="setting-icon">📤</div>
          <div class="setting-text">
            <div class="setting-label">导出位置数据</div>
            <div class="setting-desc">将所有位置记录导出为 JSON</div>
          </div>
        </div>
        <div class="setting-arrow">›</div>
      </div>
      <div class="setting-divider"></div>
      <div class="setting-item setting-item-danger" @click="confirmClearLocationData">
        <div class="setting-info">
          <div class="setting-icon">🗑️</div>
          <div class="setting-text">
            <div class="setting-label">删除全部位置数据</div>
            <div class="setting-desc">清空本地位置缓存和服务器记录</div>
          </div>
        </div>
        <div class="setting-arrow">›</div>
      </div>
    </div>

    <!-- 确认关闭弹窗 -->
    <Teleport to="body">
      <div v-if="showConfirmClose" class="dialog-overlay" @click.self="showConfirmClose = false">
        <div class="dialog-box">
          <h3>关闭位置共享</h3>
          <p class="dialog-desc">确定要关闭与 <strong>{{ closingShare ? getPartnerName(closingShare) : '' }}</strong> 的位置共享？</p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showConfirmClose = false">取消</button>
            <button class="btn btn-danger" @click="confirmCloseShare">确认关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 关闭全部确认 -->
    <Teleport to="body">
      <div v-if="showConfirmCloseAll" class="dialog-overlay" @click.self="showConfirmCloseAll = false">
        <div class="dialog-box">
          <h3>关闭全部共享</h3>
          <p class="dialog-desc">确定关闭所有位置共享？此操作不可撤销。</p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showConfirmCloseAll = false">取消</button>
            <button class="btn btn-danger" @click="confirmCloseAllShares">全部关闭</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认 -->
    <Teleport to="body">
      <div v-if="showConfirmDelete" class="dialog-overlay" @click.self="showConfirmDelete = false">
        <div class="dialog-box">
          <h3>删除全部位置数据</h3>
          <p class="dialog-desc">此操作将删除所有本地缓存的位置记录，服务器记录保留。</p>
          <div class="dialog-actions">
            <button class="btn btn-secondary" @click="showConfirmDelete = false">取消</button>
            <button class="btn btn-danger" @click="confirmDeleteAll">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { useLocationShare } from '../composables/useLocationShare.js'

const router = useRouter()
const locationShare = useLocationShare()

// ========== 状态 ==========

const locationPrecision = ref('precise')
const autoCloseEnabled = ref(true)
const activeShares = ref([])
const blacklist = ref([])

const showConfirmClose = ref(false)
const showConfirmCloseAll = ref(false)
const showConfirmDelete = ref(false)
const closingShare = ref(null)

// ========== 方法 ==========

function getPartnerName(share) {
  if (share.partner_name) return share.partner_name
  if (share.sender_id === share.current_user_id) return '对方'
  return '对方'
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return ''
  }
}

function toggleAutoClose(val) {
  autoCloseEnabled.value = val
  showToast({ message: val ? '智能关闭已开启' : '智能关闭已关闭' })
}

function onCloseShare(share) {
  closingShare.value = share
  showConfirmClose.value = true
}

async function confirmCloseShare() {
  if (!closingShare.value) return
  const { error } = await locationShare.closeShare(closingShare.value.id, 'user_initiated')
  if (error) {
    showToast({ message: error.message, type: 'fail' })
  } else {
    showToast({ message: '已关闭共享' })
    activeShares.value = activeShares.value.filter(s => s.id !== closingShare.value.id)
  }
  showConfirmClose.value = false
  closingShare.value = null
}

function confirmCloseAll() {
  showConfirmCloseAll.value = true
}

async function confirmCloseAllShares() {
  for (const share of activeShares.value) {
    await locationShare.closeShare(share.id, 'user_initiated')
  }
  activeShares.value = []
  showConfirmCloseAll.value = false
  showToast({ message: '已关闭全部共享' })
}

async function onUnblock(item) {
  const { error } = await locationShare.unblockUser(item.blocked_user_id)
  if (error) {
    showToast({ message: error.message, type: 'fail' })
  } else {
    showToast({ message: '已解除拉黑' })
    blacklist.value = blacklist.value.filter(b => b.id !== item.id)
  }
}

function exportLocationData() {
  const data = {
    activeShares: activeShares.value,
    blacklist: blacklist.value,
    exportedAt: new Date().toISOString()
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `location-data-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  showToast({ message: '导出成功', type: 'success' })
}

function confirmClearLocationData() {
  showConfirmDelete.value = true
}

function confirmDeleteAll() {
  locationShare.clearCachedLocations()
  showToast({ message: '位置数据已清除' })
  showConfirmDelete.value = false
}

// ========== 加载数据 ==========

async function loadData() {
  const { data: shares } = await locationShare.getActiveShares()
  activeShares.value = shares || []

  const { data: blacklistData } = await locationShare.getBlacklist()
  blacklist.value = blacklistData || []
}

// ========== 生命周期 ==========

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.settings-page {
  padding: 20px 16px 80px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: var(--space-lg) 0;
}

.back-btn {
  font-size: 28px;
  color: var(--text);
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.page-header .emoji {
  font-size: 24px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0;
}

.card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

/* Radio group */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s;
}

.radio-item:active {
  background: var(--bg);
}

.radio-item.active {
  background: var(--warm-pink);
}

.radio-item.active .radio-dot {
  border-color: var(--primary);
  background: var(--primary);
  box-shadow: inset 0 0 0 3px var(--white);
}

.radio-dot {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
  transition: all 0.2s;
}

.radio-info {
  flex: 1;
}

.radio-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.radio-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

/* Section header */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.close-all-btn {
  border: none;
  background: none;
  font-size: 13px;
  color: var(--danger, #EF4444);
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
}

.manage-empty {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 16px 0;
}

/* Manage list */
.manage-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.manage-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: var(--bg);
  border-radius: var(--radius-md);
}

.manage-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.manage-info {
  flex: 1;
  min-width: 0;
}

.manage-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}

.manage-time {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.manage-close-btn {
  border: none;
  background: #FEE2E2;
  color: #DC2626;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.manage-unblock-btn {
  border: none;
  background: var(--bg);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

/* Setting item (reused from Settings.vue) */
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  cursor: pointer;
}

.setting-icon {
  font-size: 24px;
  width: 32px;
  text-align: center;
}

.setting-text {
  flex: 1;
}

.setting-label {
  font-size: 15px;
  font-weight: 500;
  color: var(--text);
}

.setting-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.setting-action {
  flex-shrink: 0;
}

.setting-arrow {
  font-size: 18px;
  color: var(--text-tertiary);
}

.setting-divider {
  height: 1px;
  background: var(--border);
  margin: 12px 0;
}

.setting-item-danger .setting-label {
  color: #EF4444;
}

/* Button */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--radius-md);
  padding: 10px 20px;
  transition: all 0.2s ease;
  flex: 1;
}

.btn:active {
  transform: scale(0.97);
}

.btn-secondary {
  background: var(--border-light);
  color: var(--text);
}

.btn-danger {
  background: #EF4444;
  color: var(--white);
}

/* Dialog */
.dialog-overlay {
  position: fixed;
  inset: 0;
  background: var(--bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 20px;
}

.dialog-box {
  background: var(--white);
  border-radius: var(--radius-lg);
  padding: 24px 20px;
  width: 100%;
  max-width: 320px;
  box-shadow: var(--shadow-lg);
}

.dialog-box h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 12px;
}

.dialog-desc {
  font-size: 14px;
  color: var(--text);
  margin: 0 0 8px;
}

.dialog-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
</style>
