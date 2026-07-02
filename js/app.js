/**
 * 💕 小皮爱情助手 — 主应用
 * 路由、Tab 切换、全局状态
 */

(function() {
  'use strict';

  const App = {
    currentTab: 'photo',

    init() {
      this.bindNavigation();
      this.switchTab('photo');
      this.setupResultOverlay();

      // 检查中午提醒
      setTimeout(() => {
        PhotoModule.checkLunchReminder();
      }, 5000);

      console.log('💕 小皮爱情助手已启动！');
    },

    bindNavigation() {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          const tab = item.dataset.tab;
          if (tab) this.switchTab(tab);
        });
      });
    },

    switchTab(tab) {
      this.currentTab = tab;

      // 更新导航激活状态
      document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
      });

      // 隐藏所有页面
      document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
      });

      // 显示目标页面
      const targetPage = document.getElementById(`page-${tab}`);
      if (targetPage) {
        targetPage.classList.add('active');
      }

      // 渲染对应模块
      switch(tab) {
        case 'photo':
          PhotoModule.renderPage();
          // 重新绑定通知切换
          setTimeout(() => PhotoModule.setupNotification(), 100);
          break;
        case 'lunch':
          LunchModule.renderPage();
          break;
        case 'wish':
          WishModule.renderPage();
          break;
      }
    },

    setupResultOverlay() {
      const overlay = document.getElementById('result-overlay');
      if (overlay) {
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay) {
            overlay.classList.remove('show');
          }
        });
      }
    }
  };

  // 页面 DOM 就绪后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  // 暴露到全局
  window.App = App;
})();