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
      <van-button type="primary" round @click="showAddDialog">+ 添加纪念日</van-button>
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
            <van-button size="small" class="btn-edit" @click.stop="showEditDialog(item)">编辑</van-button>
            <van-button size="small" class="btn-delete" @click.stop="confirmDelete(item)">删除</van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB 添加按钮 -->
    <van-button class="fab-add" type="primary" round icon="plus" @click="showAddDialog" />

    <!-- 添加/编辑弹窗 -->
    <van-dialog
      v-model:show="dialogVisible"
      :title="isEdit ? '✏️ 编辑纪念日' : '💕 添加纪念日'"
      show-cancel-button
      confirm-button-text="保存"
      cancel-button-text="取消"
      @confirm="onSave"
      @cancel="dialogVisible = false"
    >
      <div class="form-content">
        <!-- 名称 -->
        <div class="form-group">
          <label>名称 <span class="required">*</span></label>
          <van-field
            v-model="form.name"
            placeholder="如：恋爱纪念日"
            maxlength="20"
            :error="formError"
            :error-message="formError"
            @input="formError = ''"
          />
        </div>

        <!-- 类型 -->
        <div class="form-group">
          <label>类型 <span class="required">*</span></label>
          <div class="type-options">
            <button
              v-for="(config, key) in TYPES_CONFIG"
              :key="key"
              :class="['type-btn', { active: form.type === key }]"
              @click="form.type = key; form.emoji = config.emoji"
            >
              {{ config.emoji }} {{ config.label }}
            </button>
          </div>
        </div>

        <!-- 日期 -->
        <div class="form-group">
          <label>日期 <span class="required">*</span></label>
          <van-field
            :model-value="form.date"
            readonly
            placeholder="选择日期"
            right-icon="arrow"
            @click="showDatePicker = true"
          />
        </div>

        <!-- 备注 -->
        <div class="form-group">
          <label>备注</label>
          <van-field
            v-model="form.remark"
            type="textarea"
            placeholder="optional — 备注信息"
            rows="2"
            maxlength="100"
          />
        </div>

        <!-- 提前提醒 -->
        <div class="form-group">
          <label>提前提醒</label>
          <div class="remind-checks">
            <label v-for="d in [1, 3, 7, 30]" :key="d" class="check-item">
              <van-checkbox :model-value="form.remindDays.includes(d)" @update:model-value="toggleRemind(d)">
                {{ d }} 天前
              </van-checkbox>
            </label>
          </div>
        </div>
      </div>
    </van-dialog>
    <!-- 日期选择器 -->
    <van-popup v-model:show="showDatePicker" position="bottom" round>
      <van-date-picker
        :model-value="selectedDate"
        title="选择日期"
        :min-date="minDate"
        :max-date="maxDate"
        @confirm="onDateConfirm"
        @cancel="showDatePicker = false"
      />
    </van-popup>

    <!-- 删除确认 -->
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
import { ref, reactive, watch, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { useDataStore } from '../stores/dataStore.js'
import { useAnniversary } from '../composables/useAnniversary.js'

const store = useDataStore()
const {
  sortedList,
  addAnniversary,
  updateAnniversary,
  deleteAnniversary,
  formatReminder,
  getTypeConfig,
  getDaysText,
  getDaysSinceText,
  isToday,
  checkAnniversaryNotifications,
  TYPES_CONFIG
} = useAnniversary()

const state = store.state

// 弹窗状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref(null)
const formError = ref('')

// 日期选择器
const showDatePicker = ref(false)
const minDate = new Date(1990, 0, 1)
const maxDate = new Date(2050, 11, 31)
const selectedDate = ref([])

// 删除确认
const deleteDialogVisible = ref(false)
const deleteTarget = ref(null)

// 展开状态
const expandedId = ref(null)

// 表单数据
const form = reactive({
  name: '',
  date: '',
  type: 'anniversary',
  emoji: '💕',
  remark: '',
  remindDays: [1, 3, 7]
})

// 初始化表单
function resetForm() {
  form.name = ''
  form.date = ''
  form.type = 'anniversary'
  form.emoji = '💕'
  form.remark = ''
  form.remindDays = [1, 3, 7]
  formError.value = ''
}

// 显示添加弹窗
function showAddDialog() {
  resetForm()
  isEdit.value = false
  editingId.value = null
  dialogVisible.value = true
}

// 显示编辑弹窗
function showEditDialog(item) {
  resetForm()
  isEdit.value = true
  editingId.value = item.id
  form.name = item.name
  form.date = item.date
  form.type = item.type
  form.emoji = item.emoji
  form.remark = item.remark || ''
  form.remindDays = [...(item.remindDays || [3])]
  dialogVisible.value = true
}

// 保存
function onSave() {
  if (!form.name.trim()) {
    formError.value = '请输入名称'
    return
  }
  if (!form.date) {
    showToast({ message: '请选择日期', type: 'fail' })
    return
  }

  if (isEdit.value) {
    updateAnniversary(editingId.value, {
      name: form.name.trim(),
      date: form.date,
      type: form.type,
      emoji: form.emoji,
      remark: form.remark.trim(),
      remindDays: form.remindDays
    })
    showToast({ message: '已更新', type: 'success' })
  } else {
    addAnniversary({
      name: form.name.trim(),
      date: form.date,
      type: form.type,
      emoji: form.emoji,
      remark: form.remark.trim(),
      remindDays: form.remindDays
    })
    showToast({ message: `已添加 ${form.emoji}`, type: 'success' })
  }
  dialogVisible.value = false
}

// 删除确认
function confirmDelete(item) {
  deleteTarget.value = item
  deleteDialogVisible.value = true
}

// 执行删除
function doDelete() {
  if (deleteTarget.value) {
    deleteAnniversary(deleteTarget.value.id)
    showToast({ message: '已删除', type: 'success' })
    if (expandedId.value === deleteTarget.value.id) {
      expandedId.value = null
    }
  }
  deleteDialogVisible.value = false
  deleteTarget.value = null
}

// 展开/收起
function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

// 日期确认
function onDateConfirm({ selectedValues }) {
  const [year, month, day] = selectedValues
  const y = typeof year === 'number' ? year : parseInt(year)
  const m = typeof month === 'number' ? month : parseInt(month)
  const d = typeof day === 'number' ? day : parseInt(day)
  form.date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  showDatePicker.value = false
}

// 切换提醒天数
function toggleRemind(day) {
  const idx = form.remindDays.indexOf(day)
  if (idx >= 0) {
    form.remindDays.splice(idx, 1)
  } else {
    form.remindDays.push(day)
    form.remindDays.sort((a, b) => a - b)
  }
}

// 格式化日期显示
function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// 类型配置（模板中使用）

// 监听类型变化，自动更新 emoji
watch(() => form.type, (newType) => {
  const config = TYPES_CONFIG[newType]
  if (config) {
    form.emoji = config.emoji
    // 更新默认提醒天数
    form.remindDays = [...config.defaults]
  }
})

// 初始化检查推送
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
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
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
  box-shadow: var(--anniv-today-shadow);
  background: var(--anniv-gold-bg);
  border-left: none;
  border: 2px solid var(--anniv-gold);
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

/* FAB */
.fab-add {
  position: fixed;
  bottom: calc(var(--tabbar-height) + var(--space-xl));
  right: calc(50% - 190px);
  width: 52px;
  height: 52px;
  z-index: 99;
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
