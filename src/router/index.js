import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '首页', icon: '🏠', tab: 0 }
  },
  {
    path: '/photo',
    name: 'Photo',
    component: () => import('../views/Photo.vue'),
    meta: { title: '拍照', icon: '📸', tab: 1 }
  },
  {
    path: '/lunch',
    name: 'Lunch',
    component: () => import('../views/Lunch.vue'),
    meta: { title: '午餐', icon: '🍽️', tab: 2 }
  },
  {
    path: '/wish',
    name: 'Wish',
    component: () => import('../views/Wish.vue'),
    meta: { title: '愿望', icon: '✨', tab: 3 }
  },
  {
    path: '/messages-admin',
    name: 'MessagesAdmin',
    component: () => import('../views/MessagesAdmin.vue'),
    meta: { title: '留言管理', hidden: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '设置', icon: '⚙️', hidden: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
