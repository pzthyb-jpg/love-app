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
      <div class="password-input-area">
        <van-field
          v-model="pwdInput"
          type="password"
          placeholder="输入管理密码（至少6位，需含字母+数字）"
          :error="pwdError"
          :error-message="pwdErrorMessage"
          size="large"
          style="font-size:16px"
        />
        <van-button type="primary" block @click="verifyPassword" style="margin-top:12px">
          🔓 登录
        </van-button>
      </div>
    </div>

    <!-- 管理界面 -->
    <template v-else>
      <!-- 新建留言（跳转新页面） -->
      <div class="card">
        <h3 class="card-title">📝 添加留言</h3>
        <p style="font-size:13px;color:var(--text-secondary);margin-bottom:12px">点击按钮跳转到新页面添加留言</p>
        <van-button type="primary" block round @click="router.push('/messages-admin/new')">
          ✨ 添加留言
        </van-button>
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
                <van-field v-model="editText" type="textarea" rows="2" maxlength="500" :autosize="{ maxHeight: 100 }" />
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
                  <van-button type="primary" size="small" @click="saveEdit(msg)">💾 保存</van-button>
                  <van-button plain size="small" @click="cancelEdit">取消</van-button>
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
                  <button class="msg-btn" @click="router.push(`/messages-admin/${msg.id}`)" aria-label="编辑">✏️</button>
                  <button class="msg-btn msg-btn-danger" @click="confirmDeleteMessage(msg)" aria-label="删除">🗑️</button>
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
          <div class="reset-row">
            <van-field
              v-model="newPassword"
              placeholder="新密码（至少6位，字母+数字）"
              type="password"
              style="flex:1"
            />
            <van-button type="primary" size="small" @click="resetPassword">修改</van-button>
          </div>
        </div>
      </div>

      <!-- 返回首页 -->
      <van-button plain block @click="router.push('/')" style="margin-top:var(--space-lg)">
        🏠 返回首页
      </van-button>
    </template>
  </div>
</template>

<script setup>
import { showToast, showConfirmDialog } from 'vant'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore.js'

const router = useRouter()
const { state, addMessage, updateMessage, deleteMessage, setAdminPassword, verifyAdminPassword } = useDataStore()

// 密码验证
const isAuthenticated = ref(false)
const pwdInput = ref('')
const pwdError = ref(false)
const pwdErrorMessage = ref('')
const currentPassword = ref('')

// 新留言/编辑留言已迁移到 MessageForm.vue

// 登录验证
async function verifyPassword() {
  if (!pwdInput.value.trim()) {
    pwdError.value = true
    pwdErrorMessage.value = '请输入密码'
    return
  }
  try {
    const ok = await verifyAdminPassword(pwdInput.value.trim())
    if (ok) {
      isAuthenticated.value = true
      pwdInput.value = ''
      pwdError.value = false
      pwdErrorMessage.value = ''
      currentPassword.value = '****'
    } else {
      pwdError.value = true
      pwdErrorMessage.value = '密码错误，请重试'
    }
  } catch (e) {
    pwdError.value = true
    pwdErrorMessage.value = '验证失败，环境不支持加密工具'
  }
}

function handleAddMessage() {
  // deprecated - moved to MessageForm.vue
}

// 编辑已迁移到 MessageForm.vue，列表不再内嵌编辑
const editingId = ref(null)
const editText = ref('')
const editType = ref('random')
const editCondition = ref('null')

function startEdit(msg) {
  // deprecated - 编辑已迁移到 MessageForm.vue
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

async function resetPassword() {
  const pwd = newPassword.value.trim()
  const validation = validatePassword(pwd)
  if (!validation.valid) {
    showToast({ message: validation.message, type: 'fail' })
    return
  }
  const ok = await setAdminPassword(pwd)
  if (ok) {
    currentPassword.value = '****'
    newPassword.value = ''
    showToast({ message: '🔑 密码已修改', type: 'success' })
  }
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return { valid: false, message: '密码至少需要 6 位' }
  }
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  if (!hasLetter || !hasDigit) {
    return { valid: false, message: '密码必须包含字母和数字' }
  }
  return { valid: true, message: '' }
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
  padding: var(--space-xl);
}

.password-input-area {
  margin: var(--space-lg) auto 0;
  max-width: 300px;
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

.manage-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
}

.toggle-icon {
  font-size: 14px;
  color: var(--text-secondary);
}

.reset-row {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}
</style>
