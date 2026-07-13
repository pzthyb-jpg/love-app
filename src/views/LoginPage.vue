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

async function handleRegister() {
  if (!registerForm.value.username || !registerForm.value.password) {
    showToast({ message: "请填写用户名和密码", type: "fail" })
    return
  }
  if (registerForm.value.username.length < 3) {
    showToast({ message: "用户名至少 3 个字符", type: "fail" })
    return
  }
  if (registerForm.value.password.length < 6) {
    showToast({ message: "密码至少 6 位", type: "fail" })
    return
  }
  registerLoading.value = true
  try {
    const result = await register(registerForm.value.username, registerForm.value.password, registerForm.value.displayName)
    if (result.error) {
      showToast({ message: result.error.message || "注册失败", type: "fail" })
    } else {
      showToast({ message: "注册成功！已自动登录 💕", type: "success" })
      registerForm.value = { username: "", password: "", displayName: "" }
      router.push("/")
    }
  } catch (e) {
    showToast({ message: e.message || "注册失败", type: "fail" })
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
  background: linear-gradient(135deg, #fef2f4 0%, #fde2e8 100%);
  padding: 24px;
}

[data-theme='dark'] .login-page {
  background: linear-gradient(135deg, #1a1a1a 0%, #2d1e20 100%);
}

.login-container {
  width: 100%;
  max-width: 360px;
  background: var(--white);
  border-radius: 20px;
  padding: 32px 24px;
  box-shadow: 0 8px 30px rgba(232, 117, 138, 0.15);
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
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.login-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.login-tabs {
  display: flex;
  background: var(--bg);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 20px;
}

.login-tab {
  flex: 1;
  padding: 10px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.login-tab.active {
  background: var(--white);
  color: var(--primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.login-form {
  margin-top: 8px;
}

.login-tip {
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary);
  margin-top: 16px;
}
</style>
