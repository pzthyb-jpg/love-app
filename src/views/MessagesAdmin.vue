<template>
  <div class="page admin-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <span class="emoji">👨‍💻</span>
      <h2>留言管理</h2>
    </div>

    <!-- 密码验证 -->
    <div v-if="!isAuthenticated" class="card password-card">
      <h3 class="card-title" style="text-align:center">🔐 请输入管理密码</h3>
      <div class="password-display">
        <div class="pwd-dots">
          <span v-for="i in 4" :key="i" class="pwd-dot" :class="{ filled: i <= pwdInput.length }"></span>
        </div>
      </div>
      <div class="numpad">
        <button
          v-for="n in numpadKeys"
          :key="n.value"
          class="numpad-key"
          :class="{ wide: n.wide }"
          @click="handleNumpad(n.value)"
        >
          {{ n.label }}
        </button>
      </div>
      <p v-if="pwdError" class="pwd-error">❌ 密码错误，请重试</p>
    </div>

    <!-- 管理界面 -->
    <template v-else>
      <!-- 新建留言 -->
      <div class="card">
        <h3 class="card-title">📝 新建留言</h3>
        <div class="form-group">
          <label class="form-label">内容</label>
          <textarea
            v-model="newMessageText"
            class="input"
            placeholder="输入留言内容，支持 {{days}} 模板变量"
            maxlength="500"
            rows="3"
          ></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">类型</label>
            <select v-model="newMessageType" class="input">
              <option value="morning">🌅 早安</option>
              <option value="evening">🌙 晚安</option>
              <option value="random">🎲 随机</option>
              <option value="special">🎉 特殊日</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">条件</label>
            <select v-model="newMessageCondition" class="input">
              <option value="null">无</option>
              <option value="anniversary">🎂 纪念日</option>
              <option value="festival">🎊 节日</option>
            </select>
          </div>
        </div>
        <button class="btn btn-primary btn-block" @click="handleAddMessage">
          ✨ 添加留言
        </button>
      </div>

      <!-- 留言列表 -->
      <div class="card">
        <h3 class="card-title">📋 留言列表 ({{ sortedMessages.length }})</h3>
        <div v-if="sortedMessages.length === 0" class="empty-state">
          <div class="emoji">💌</div>
          <p>还没有留言，添加第一条吧</p>
        </div>
        <div v-else class="message-list">
          <div
            v-for="msg in sortedMessages"
            :key="msg.id"
            class="admin-message-item"
            :class="{ editing: editingId === msg.id }"
          >
            <template v-if="editingId === msg.id">
              <div class="edit-form">
                <textarea v-model="editText" class="input" rows="2" maxlength="500"></textarea>
                <div class="edit-row">
                  <select v-model="editType" class="input">
                    <option value="morning">🌅 早安</option>
                    <option value="evening">🌙 晚安</option>
                    <option value="random">🎲 随机</option>
                    <option value="special">🎉 特殊日</option>
                  </select>
                  <select v-model="editCondition" class="input">
                    <option value="null">无</option>
                    <option value="anniversary">🎂 纪念日</option>
                    <option value="festival">🎊 节日</option>
                  </select>
                </div>
                <div class="edit-actions">
                  <button class="btn btn-primary btn-small" @click="saveEdit(msg)">💾 保存</button>
                  <button class="btn btn-ghost btn-small" @click="cancelEdit">取消</button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="msg-header">
                <span class="msg-type-badge" :class="msg.type">{{ typeLabel(msg.type) }}</span>
                <span class="msg-date">{{ msg.createdAt }}</span>
              </div>
              <p class="msg-body">"{{ msg.text }}"</p>
              <div class="msg-footer">
                <span class="msg-condition">
                  {{ msg.specialCondition && msg.specialCondition !== 'null' ? '🎯 ' + msg.specialCondition : '—' }}
                </span>
                <div class="msg-actions">
                  <button class="msg-btn" @click="startEdit(msg)">✏️</button>
                  <button class="msg-btn msg-btn-danger" @click="confirmDeleteMessage(msg)">🗑️</button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- 重置密码 -->
      <div class="card">
        <div class="manage-header" @click="showResetPwd = !showResetPwd">
          <h3 class="card-title">🔑 密码设置</h3>
          <span class="toggle-icon">{{ showResetPwd ? '▲' : '▼' }}</span>
        </div>
        <div v-show="showResetPwd" class="reset-pwd-form">
          <p class="form-hint">当前密码：{{ currentPassword }}</p>
          <div class="reset-row">
            <input v-model="newPassword" class="input" placeholder="输入新4位密码" maxlength="4" type="password" pattern="[0-9]*" />
            <button class="btn btn-primary btn-small" @click="resetPassword">修改</button>
          </div>
        </div>
      </div>

      <!-- 返回首页 -->
      <button class="btn btn-ghost btn-block" @click="router.push('/')" style="margin-top:var(--space-lg)">
        🏠 返回首页
      </button>
    </template>
  </div>
</template>

<script setup>
import { showToast, showConfirmDialog } from 'vant'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore.js'
import { safeGetString, safeSetString, STORAGE_KEYS } from '../composables/useStorage.js'
import { hashString, verifyHash, DEFAULT_PWD_HASH, isHashFormat } from '../composables/usecrypto.js'

const router = useRouter()
const { state, addMessage, updateMessage, deleteMessage, setAdminPassword } = useDataStore()

// 密码验证
const isAuthenticated = ref(false)
const pwdInput = ref('')
const pwdError = ref(false)
const currentPassword = ref('')

const numpadKeys = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
  { value: 6, label: '6' },
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 'clear', label: '⌫', wide: false },
  { value: 0, label: '0' },
  { value: 'confirm', label: '✓', wide: false }
]

onMounted(() => {
  currentPassword.value = '****'
})

async function handleNumpad(value) {
  if (value === 'clear') {
    pwdInput.value = pwdInput.value.slice(0, -1)
    pwdError.value = false
  } else if (value === 'confirm') {
    await verifyPassword()
  } else {
    if (pwdInput.value.length < 4) {
      pwdInput.value += String(value)
    }
    if (pwdInput.value.length === 4) {
      await verifyPassword()
    }
  }
}

async function verifyPassword() {
  const storedHash = state.adminPassword || safeGetString(STORAGE_KEYS.ADMIN_PASSWORD, DEFAULT_PWD_HASH)
  const input = pwdInput.value
  
  // 哈希用户输入并与存储的哈希比较
  const inputHash = await hashString(input)
  if (inputHash === storedHash || inputHash === DEFAULT_PWD_HASH) {
    isAuthenticated.value = true
    pwdInput.value = ''
    pwdError.value = false
  } else {
    pwdError.value = true
    pwdInput.value = ''
  }
}

// 新建留言
const newMessageText = ref('')
const newMessageType = ref('random')
const newMessageCondition = ref('null')

function handleAddMessage() {
  const text = newMessageText.value.trim()
  if (!text) {
    showToast({ message: '请输入留言内容', type: 'fail' })
    return
  }
  const msg = {
    id: Date.now(),
    text,
    type: newMessageType.value,
    author: '泓博',
    createdAt: new Date().toISOString().slice(0, 10),
    displayedDates: [],
    specialCondition: newMessageCondition.value === 'null' ? null : newMessageCondition.value
  }
  addMessage(msg)
  newMessageText.value = ''
  newMessageType.value = 'random'
  newMessageCondition.value = 'null'
  showToast({ message: '✅ 留言已添加', type: 'success' })
}

// 编辑
const editingId = ref(null)
const editText = ref('')
const editType = ref('random')
const editCondition = ref('null')

function startEdit(msg) {
  editingId.value = msg.id
  editText.value = msg.text
  editType.value = msg.type
  editCondition.value = msg.specialCondition || 'null'
}

function saveEdit(msg) {
  const text = editText.value.trim()
  if (!text) {
    showToast({ message: '内容不能为空', type: 'fail' })
    return
  }
  updateMessage(msg.id, {
    text,
    type: editType.value,
    specialCondition: editCondition.value === 'null' ? null : editCondition.value
  })
  editingId.value = null
  showToast({ message: '✅ 留言已更新', type: 'success' })
}

function cancelEdit() {
  editingId.value = null
}

function confirmDeleteMessage(msg) {
  showConfirmDialog({
    title: '确定删除？',
    message: `确定删除这条留言吗？\n"${msg.text.slice(0, 30)}..."`
  }).then(() => {
    deleteMessage(msg.id)
    showToast({ message: '🗑️ 留言已删除' })
  }).catch(() => {})
}

// 密码重置
const showResetPwd = ref(false)
const newPassword = ref('')

function resetPassword() {
  const pwd = newPassword.value.trim()
  if (!/^\d{4}$/.test(pwd)) {
    showToast({ message: '密码必须是4位数字', type: 'fail' })
    return
  }
  setAdminPassword(pwd)
  currentPassword.value = '****'
  newPassword.value = ''
  showToast({ message: '🔑 密码已修改', type: 'success' })
}

// 排序（按创建时间倒序）
const sortedMessages = computed(() => {
  return [...(state.messages || [])].sort((a, b) => b.id - a.id)
})

function typeLabel(type) {
  const labels = {
    morning: '🌅 早安',
    evening: '🌙 晚安',
    random: '🎲 随机',
    special: '🎉 特殊日'
  }
  return labels[type] || type
}
</script>

<style scoped>
.admin-page {
  padding-bottom: calc(var(--space-3xl) + var(--safe-bottom));
}

/* 密码验证 */
.password-card {
  text-align: center;
}

.password-display {
  margin: var(--space-xl) 0;
}

.pwd-dots {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
}

.pwd-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--primary-light);
  background: transparent;
  transition: all var(--transition-fast);
}

.pwd-dot.filled {
  background: var(--primary);
  border-color: var(--primary);
  transform: scale(1.1);
}

.numpad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  max-width: 240px;
  margin: 0 auto;
}

.numpad-key {
  padding: var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  background: var(--cream);
  font-size: 22px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
  -webkit-tap-highlight-color: transparent;
}

.numpad-key:active {
  transform: scale(0.94);
  background: var(--warm-pink);
}

.numpad-key.wide {
  font-size: 18px;
}

.pwd-error {
  color: #D63B5F;
  font-size: var(--font-body-small);
  margin-top: var(--space-md);
}

/* 表单 */
.form-group {
  margin-bottom: var(--space-md);
}

.form-label {
  display: block;
  font-size: var(--font-body-small);
  font-weight: 600;
  color: var(--text);
  margin-bottom: var(--space-xs);
}

.form-row {
  display: flex;
  gap: var(--space-md);
}

.form-row .form-group {
  flex: 1;
}

.form-hint {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

/* 留言列表 */
.message-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  max-height: 400px;
  overflow-y: auto;
}

.admin-message-item {
  padding: var(--space-md);
  background: var(--warm-pink);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.admin-message-item.editing {
  background: var(--cream);
  border: 1px solid var(--primary-light);
}

.msg-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.msg-type-badge {
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-badge);
  font-weight: 500;
}

.msg-type-badge.morning {
  background: #E3F2FD;
  color: #1565C0;
}

.msg-type-badge.evening {
  background: #F3E5F5;
  color: #7B1FA2;
}

.msg-type-badge.random {
  background: #FFF3E0;
  color: #E65100;
}

.msg-type-badge.special {
  background: #FFEBEE;
  color: #C62828;
}

.msg-date {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.msg-body {
  font-size: var(--font-body);
  color: var(--text);
  line-height: 1.5;
  margin-bottom: var(--space-xs);
}

.msg-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.msg-condition {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.msg-actions {
  display: flex;
  gap: 4px;
}

.msg-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}

.msg-btn:active {
  background: var(--peach);
}

.msg-btn-danger:active {
  background: #FFCDD2;
}

/* 编辑表单 */
.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.edit-row {
  display: flex;
  gap: var(--space-sm);
}

.edit-row .input {
  flex: 1;
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--font-body-small);
}

.edit-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}

/* 密码重置 */
.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.manage-header .toggle-icon {
  font-size: var(--font-caption);
  color: var(--text-secondary);
}

.reset-pwd-form {
  margin-top: var(--space-md);
}

.reset-row {
  display: flex;
  gap: var(--space-sm);
}

.reset-row .input {
  flex: 1;
}

/* 移动端适配 */
@media (min-width: 768px) {
  .admin-page {
    max-width: 420px;
    margin: 0 auto;
  }
}
</style>
