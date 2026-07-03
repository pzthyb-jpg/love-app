<template>
  <div id="love-app-root">
    <router-view v-slot="{ Component }">
      <transition name="page-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
    <van-tabbar route>
      <van-tabbar-item to="/" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/photo" icon="photograph">拍照</van-tabbar-item>
      <van-tabbar-item to="/lunch" icon="bag-o">午餐</van-tabbar-item>
      <van-tabbar-item to="/wish" icon="star-o">愿望</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
</script>

<style>
#love-app-root {
  max-width: 100%;
  overflow-x: hidden;
}

/* 页面切换动画 */
.page-slide-enter-active,
.page-slide-leave-active {
  transition: all 0.25s ease;
}
.page-slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.page-slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
