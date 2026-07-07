import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './assets/styles/main.css'
import 'vant/lib/index.css'

// 初始化主题（加载持久化偏好 + 应用 CSS 变量）
import { useTheme } from './composables/useTheme.js'
useTheme()

const app = createApp(App)
app.use(router)
app.mount('#app')
