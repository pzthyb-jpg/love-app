import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js'
import './assets/styles/main.css'
import 'vant/lib/index.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
