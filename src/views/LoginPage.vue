<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="login-logo">💕</div>
        <h1 class="login-title">小皮爱情助手</h1>
        <p class="login-subtitle">记录我们的每一个甜蜜时刻</p>
      </div>

      <div class="login-tabs">
        <button :class="tabClass(LOGIN)" @click="setTab(LOGIN)">登录</button>
        <button :class="tabClass(REGISTER)" @click="setTab(REGISTER)">注册</button>
      </div>

      <div v-if="tab === LOGIN" class="login-form">
        <van-field v-model="loginForm.username" placeholder="用户名" maxlength="20" left-icon="user-o" />
        <van-field v-model="loginForm.password" placeholder="密码" type="password" maxlength="32" left-icon="lock" style="margin-top: 12px" />
        <van-button type="primary" block :loading="loginLoading" style="margin-top: 20px" @click="handleLogin">立即登录</van-button>
      </div>

      <div v-else class="login-form">
        <van-field v-model="registerForm.username" placeholder="用户名 (3-20位)" maxlength="20" left-icon="user-o" />
        <van-field v-model="registerForm.password" placeholder="密码 (6位以上)" type="password" left-icon="lock" style="margin-top: 12px" />
        <van-field v-model="registerForm.displayName" placeholder="昵称 (可选)" maxlength="20" left-icon="smile-o" style="margin-top: 12px" />
        <van-button type="primary" block :loading="registerLoading" style="margin-top: 20px" @click="handleRegister">注册账号</van-button>
      </div>

      <p class="login-tip">{{ tipText }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { useRouter } from "vue-router"
import { showToast } from "vant"
import { useAuth } from "../composables/useDatabase.js"

const LOGIN = "login"
const REGISTER = "register"

const router = useRouter()
const { register, login } = useAuth()

const tab = ref(LOGIN)

function setTab(t) {
  tab.value = t
}

function tabClass(t) {
  return ["login-tab", { active: tab.value === t }]
}

const tipText = computed(() => tab.value === LOGIN ? "还没有账号？点击上方「注册」" : "已有账号？点击上方「登录」")

const loginLoading = ref(false)
const registerLoading = ref(false)
const loginForm = ref({ username: "", password: "" })
const registerForm = ref({ username: "", password: "", displayName: "" })

async function handleLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    showToast({ message: "请填写用户名和密码", type: "fail" })
    return
  }
  loginLoading.value = true
  try {
    const result = await login(loginForm.value.username, loginForm.value.password)
    if (result.error) {
      showToast({ message: result.error.message || "登录失败", type: "fail" })
    } else {
      showToast({ message: "登录成功 💕", type: "success" })
      loginForm.value = { username: "", password: "" }
      router.push("/")
    }
  } catch (e) {
    showToast({ message: e.message || "登录失败", type: "fail" })
  }
  loginLoading.value = false
}

// 注册/登录网络异常时显示友好提示
async function handleRegister() {
  registerLoading.value = true
  try {
    const result = await register(registerForm.value.username, registerForm.value.password, registerForm.value.displayName)
    if (result.error) {
      showToast({ message: result.error.message || '注册失败，请稍后重试', type: 'fail' })
    } else {
      showToast({ message: '注册成功！已自动登录 💕', type: 'success' })
      registerForm.value = { username: '', password: '', displayName: '' }
      router.push('/')
    }
  } catch (e) {
    showToast({ message: '网络异常，请检查网络后重试', type: 'fail' })
  }
  registerLoading.value = false
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-grouped);
  padding: 24px;
}

[data-theme='dark'] .login-page {
  background: var(--bg-grouped);
}

.login-container {
  width: 100%;
  max-width: 360px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  padding: 36px 24px;
  box-shadow: var(--shadow-md);
}

.login-header {
  text-align: center;
  margin-bottom: 28px;
}

.login-logo {
  font-size: 48px;
  margin-bottom: 12px;
}

.login-title {
  font-size: var(--font-h2);
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.5px;
}

.login-subtitle {
  font-size: var(--font-body-small);
  color: var(--text-secondary);
  margin-top: 6px;
}

/* iOS 风格分段控件 */
.login-tabs {
  display: flex;
  background: var(--bg-grouped);
  border-radius: var(--radius-md);
  padding: 3px;
  margin-bottom: 24px;
}

.login-tab {
  flex: 1;
  padding: 9px;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: var(--font-body-small);
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.login-tab.active {
  background: var(--bg-card);
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.login-form {
  margin-top: 8px;
}

van-field ::placeholder {
  opacity: 0.3;
}

.login-tip {
  text-align: center;
  font-size: var(--font-caption);
  color: var(--text-tertiary);
  margin-top: 20px;
}
</style>
