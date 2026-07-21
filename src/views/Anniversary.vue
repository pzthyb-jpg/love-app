<template>
  <div class="page anniversary-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="emoji">🎂</span>
      <h2>纪念日</h2>
    </div>

    <!-- 空态 -->
    <div v-if="!state.anniversaries.length" class="empty-state">
      <span class="icon">🎂</span>
      <p>还没有纪念日<br/>点击下方按钮添加第一个吧</p>
      <van-button type="primary" round @click="router.push('/anniversary/new')">+ 添加纪念日</van-button>
    </div>

    <!-- 纪念日列表 -->
    <div v-else class="anniv-list">
      <div
        v-for="item in sortedList"
        :key="item.id"
        :class="['anniv-card', item.type, { today: isToday(item.date), expanded: expandedId === item.id }]"
        @click="toggleExpand(item.id)"
      >
        <div class="card-top">
          <div class="card-info">
            <div class="card-name">
              <span>{{ item.emoji }}</span>
              <span>{{ item.name }}</span>
            </div>
            <div class="card-date">{{ item.date }}</div>
            <div class="card-days">
              {{ getDaysSinceText(item) }}
              <span class="days-badge" :style="{ color: getTypeConfig(item.type).color }">
                {{ getDaysText(item) }}
              </span>
            </div>
          </div>
          <div class="expand-icon">{{ expandedId === item.id ? '▲' : '▼' }}</div>
        </div>

        <!-- 展开详情 -->
        <div v-if="expandedId === item.id" class="card-detail">
          <div class="detail-row" v-if="item.remark">
            <span class="detail-label">备注：</span>
            <span>{{ item.remark }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提醒：</span>
            <span>{{ formatReminder(item.remindDays) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">创建于：</span>
            <span>{{ formatDate(item.createdAt) }}</span>
          </div>
          <div class="card-actions">
            <van-button size="small" class="btn-edit" @click.stop="router.push(`/anniversary/${item.id}`)">编辑</van-button>
            <van-button size="small" class="btn-delete" @click.stop="confirmDelete(item)">删除</van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB 添加按钮 -->
    <van-button class="fab-add" type="primary" round icon="plus" @click="router.push('/anniversary/new')" />

    <!-- 删除确认弹窗（轻交互保留弹窗） -->
    <van-dialog
      v-model:show="deleteDialogVisible"
      title="⚠️"
      show-cancel-button
      confirm-button-text="确认删除"
      cancel-button-text="取消"
      @confirm="doDelete"
      @cancel="deleteDialogVisible = false"
    >
      <div class="delete-content">
        <p>确定要删除【{{ deleteTarget?.name }}】吗？</p>
        <p class="warning">删除后无法恢复</p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { useDataStore } from '../stores/dataStore.js'
import { useAnniversary } from '../composables/useAnniversary.js'

const router = useRouter()
const store = useDataStore()
const {
  sortedList,
  deleteAnniversary,
  formatReminder,
  getTypeConfig,
  getDaysText,
  getDaysSinceText,
  isToday,
  checkAnniversaryNotifications,
} = useAnniversary()

const state = store.state

// 删除确认
const deleteDialogVisible = ref(false)
const deleteTarget = ref(null)

// 展开状态
const expandedId = ref(null)

// 删除确认
function confirmDelete(item) {
  deleteTarget.value = item
  deleteDialogVisible.value = true
}

// 执行删除
function doDelete() {
  deleteAnniversary(deleteTarget.value.id)
  showToast({ message: '已删除', type: 'success' })
  deleteDialogVisible.value = false
  deleteTarget.value = null
}

// 展开/收起
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
  } catch {
    return ''
  }
}

onMounted(() => {
  checkAnniversaryNotifications()
})
</script>

<style scoped>
.anniversary-page {
  padding-bottom: calc(var(--tabbar-height) + var(--space-3xl));
}

/* 空态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-lg);
  color: var(--text-secondary);
}

.empty-state .icon {
  font-size: 64px;
  margin-bottom: var(--space-lg);
  opacity: 0.6;
  animation: bounceIn 0.5s ease;
}

.empty-state p {
  font-size: 16px;
  text-align: center;
  line-height: 1.6;
  margin-bottom: var(--space-xl);
}

/* 纪念日列表 */
.anniv-list {
  margin-top: var(--space-md);
}

/* 纪念日卡片 */
.anniv-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-bottom: var(--space-md);
  border-left: 4px solid var(--anniv-color-anniversary);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
  overflow: hidden;
  animation: cardFadeIn 0.4s ease both;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anniv-card:active {
  transform: scale(0.98);
}

.anniv-card.birthday {
  border-left-color: var(--anniv-color-birthday);
}

.anniv-card.holiday {
  border-left-color: var(--anniv-color-holiday);
}

.anniv-card.custom {
  border-left-color: var(--anniv-color-custom);
}

.anniv-card.today {
  box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2);
  background: linear-gradient(135deg, #FFFBEB, #FEF3C7);
  border-left: none;
  border: 2px solid var(--anniv-gold);
}

html[data-theme="dark"] .anniv-card.today {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(251, 191, 36, 0.06));
  box-shadow: none;
}

/* 卡片顶部 */
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-info {
  flex: 1;
}

.card-name {
  font-size: 17px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.card-date {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.card-days {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-top: 6px;
}

.days-badge {
  font-weight: 700;
  margin-left: 8px;
  font-size: 16px;
}

.expand-icon {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 4px;
  transition: transform 0.3s ease;
}

.anniv-card.expanded .expand-icon {
  transform: rotate(0deg);
}

/* 展开详情 */
.card-detail {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--border-light);
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.detail-row {
  margin-bottom: 4px;
}

.detail-label {
  font-weight: 600;
  color: var(--text);
}

.card-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  justify-content: flex-end;
}

.btn-edit {
  background: var(--bg);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-delete {
  background: #FFF0F0;
  color: #E8758A;
  border: 1px solid #FFD0D0;
}

html[data-theme="dark"] .btn-delete {
  background: rgba(232, 117, 138, 0.15);
  border-color: rgba(232, 117, 138, 0.3);
}

/* FAB */
.fab-add {
  position: fixed;
  bottom: calc(var(--tabbar-height) + var(--space-xl));
  right: calc(50% - 190px);
  width: 52px;
  height: 52px;
  z-index: 99;
  box-shadow: 0 4px 16px rgba(232, 117, 138, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.fab-add:active {
  transform: scale(0.9);
  box-shadow: 0 2px 8px rgba(232, 117, 138, 0.3);
}

/* 表单 */
.form-content {
  padding: var(--space-lg) 0;
}

.form-group {
  margin-bottom: var(--space-lg);
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.required {
  color: var(--primary);
}

/* 类型选项 */
.type-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1.5px solid var(--border);
  background: var(--bg);
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
  font-family: inherit;
}

.type-btn.active {
  border-color: var(--primary);
  background: rgba(232, 117, 138, 0.08);
  color: var(--primary);
}

/* 提醒多选 */
.remind-checks {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.check-item {
  font-size: 14px;
}

/* 删除确认 */
.delete-content {
  text-align: center;
  padding: var(--space-lg) 0;
}

.delete-content p {
  font-size: 15px;
  margin-bottom: var(--space-sm);
}

.warning {
  font-size: 13px;
  color: #E8758A;
}
</style>
