import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../composables/useDatabase.js'

const { isAuthenticated } = useAuth()

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
    path: '/anniversary',
    name: 'Anniversary',
    component: () => import('../views/Anniversary.vue'),
    meta: { title: '纪念', icon: '🎂', tab: 4 }
  },
  {
    path: '/anniversary/new',
    name: 'AnniversaryNew',
    component: () => import('../views/AnniversaryForm.vue'),
    meta: { title: '添加纪念日', hidden: true }
  },
  {
    path: '/anniversary/:id',
    name: 'AnniversaryEdit',
    component: () => import('../views/AnniversaryForm.vue'),
    meta: { title: '编辑纪念日', hidden: true }
  },
  {
    path: '/wishlist/new',
    name: 'WishNew',
    component: () => import('../views/WishForm.vue'),
    meta: { title: '新增许愿/吐槽', hidden: true }
  },
  {
    path: '/messages-admin',
    name: 'MessagesAdmin',
    component: () => import('../views/MessagesAdmin.vue'),
    meta: { title: '留言管理', hidden: true }
  },
  {
    path: '/messages-admin/new',
    name: 'MessageNew',
    component: () => import('../views/MessageForm.vue'),
    meta: { title: '添加留言', hidden: true }
  },
  {
    path: '/messages-admin/:id',
    name: 'MessageEdit',
    component: () => import('../views/MessageForm.vue'),
    meta: { title: '编辑留言', hidden: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/Settings.vue'),
    meta: { title: '设置', icon: '⚙️', hidden: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginPage.vue'),
    meta: { title: '登录', hidden: true }
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 路由守卫：未登录跳转登录页
router.beforeEach((to, from, next) => {
  const isAuth = isAuthenticated.value

  // 已登录访问登录页 → 跳回首页
  if (to.path === '/login' && isAuth) {
    return next('/')
  }

  // 未登录访问其他页面 → 跳转登录页
  if (to.path !== '/login' && !isAuth) {
    return next('/login')
  }

  next()
})

export default router
