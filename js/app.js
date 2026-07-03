/**
 * 💕 小皮爱情助手 — 主应用
 * 路由、Tab 切换（横向滑动）、全局状态
 */

(function() {
  'use strict';

  const App = {
    currentTab: 'home',
    isTransitioning: false,

    // Tab 顺序（用于滑动索引）
    TAB_ORDER: ['home', 'photo', 'lunch', 'wish'],

    init() {
      // 检测新用户
      this.checkNewUser();

      this.bindNavigation();
      this.switchTab('home');
      this.setupResultOverlay();
      this.setupPasswordOverlay();

      // 检查中午提醒
      setTimeout(() => {
        if (typeof PhotoModule !== 'undefined' && PhotoModule.checkLunchReminder) {
          PhotoModule.checkLunchReminder();
        }
      }, 5000);

      // 更新 subtitle
      this.updateSubtitle();

      console.log('💕 小皮爱情助手 v2.0 已启动！');
    },

    /** 检测新用户，弹出设置向导 */
    checkNewUser() {
      if (typeof AppStore === 'undefined') return;
      if (AppStore.isSetupComplete()) return;

      // 检查是否有纪念日设置
      const anniversary = AppStore.getAnniversary();
      if (!anniversary) {
        // 延迟弹出设置向导（页面先渲染）
        setTimeout(() => {
          this.showSetupWizard();
        }, 1000);
      }
    },

    /** 新用户设置向导 */
    showSetupWizard() {
      const overlay = document.getElementById('password-overlay');
      const content = document.getElementById('password-content');
      if (!overlay || !content) return;

      overlay.classList.add('show');

      content.innerHTML = `
        <div style="text-align:center;padding:10px 0;">
          <div style="font-size:48px;margin-bottom:12px;">💕</div>
          <div style="font-size:20px;font-weight:700;margin-bottom:4px;">欢迎来到小皮爱情助手</div>
          <div style="font-size:13px;color:var(--color-text-secondary);margin-bottom:20px;">先设置一下你们的纪念日吧~</div>

          <div class="input-group">
            <label>📅 在一起的纪念日</label>
            <input class="input" type="date" id="setup-anniversary" style="text-align:center;font-size:16px;">
          </div>

          <div class="input-group">
            <label>👩 她的昵称（如：宝、老婆）</label>
            <input class="input" id="setup-partner" placeholder="宝" style="text-align:center;">
          </div>

          <div class="input-group" style="margin-bottom:20px;">
            <label>👨 你的称呼（如：男朋友、老公）</label>
            <input class="input" id="setup-sender" placeholder="男朋友" style="text-align:center;">
          </div>

          <button class="btn btn-primary btn-block" id="btn-setup-complete" style="font-size:16px;">
            🎉 开始我们的爱情之旅！
          </button>
        </div>
      `;

      // 绑定确认按钮
      document.getElementById('btn-setup-complete').addEventListener('click', () => {
        const anniversary = document.getElementById('setup-anniversary').value;
        if (!anniversary) {
          AppUtils.showToast('请选择纪念日哦~', 'error');
          return;
        }

        AppStore.setAnniversary(anniversary);

        const partner = document.getElementById('setup-partner').value.trim();
        if (partner) localStorage.setItem(AppStore.KEYS.PARTNER_NAME, partner);

        const sender = document.getElementById('setup-sender').value.trim();
        if (sender) localStorage.setItem(AppStore.KEYS.SENDER_NAME, sender);

        AppStore.markSetupComplete();
        overlay.classList.remove('show');

        AppUtils.showToast('🎉 设置完成！爱情之旅开始啦~', 'success');

        // 刷新首页
        if (typeof HomeModule !== 'undefined') {
          HomeModule.renderPage();
        }
        this.updateSubtitle();
      });
    },

    /** 更新 subtitle 显示在一起天数 */
    updateSubtitle() {
      const subtitle = document.getElementById('app-subtitle');
      if (!subtitle) return;
      const days = AppStore ? AppStore.getDaysTogether() : 0;
      if (days > 0) {
        subtitle.textContent = `💕 在一起 ${days} 天啦~`;
      }
    },

    bindNavigation() {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        item.addEventListener('click', () => {
          const tab = item.dataset.tab;
          if (tab && tab !== this.currentTab && !this.isTransitioning) {
            AppUtils.hapticFeedback(10);
            this.switchTab(tab);
          }
        });
      });
    },

    switchTab(tab) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const prevTab = this.currentTab;
      this.currentTab = tab;

      // 更新导航激活状态（带弹跳动画）
      document.querySelectorAll('.nav-item').forEach(item => {
        const isActive = item.dataset.tab === tab;
        item.classList.toggle('active', isActive);
        // 触发弹跳
        if (isActive) {
          const icon = item.querySelector('.nav-icon');
          if (icon) {
            icon.style.transform = 'scale(1.3)';
            setTimeout(() => { icon.style.transform = ''; }, 300);
          }
        }
      });

      // 横向滑动切换
      const slider = document.getElementById('page-slider');
      if (slider) {
        const fromIndex = this.TAB_ORDER.indexOf(prevTab);
        const toIndex = this.TAB_ORDER.indexOf(tab);
        const direction = toIndex > fromIndex ? -1 : 1;

        const pages = slider.querySelectorAll('.page');
        pages.forEach(page => {
          const pageTab = page.id.replace('page-', '');
          if (pageTab === tab) {
            page.classList.add('active');
            page.style.transform = `translateX(${direction * 30}px)`;
            page.style.opacity = '0';
            requestAnimationFrame(() => {
              page.style.transform = 'translateX(0)';
              page.style.opacity = '1';
            });
          } else if (pageTab === prevTab) {
            page.style.transform = `translateX(${-direction * 50}px)`;
            page.style.opacity = '0';
            setTimeout(() => {
              page.classList.remove('active');
              page.style.transform = '';
              page.style.opacity = '';
            }, 300);
          } else {
            page.classList.remove('active');
          }
        });
      }

      // 渲染对应模块
      setTimeout(() => {
        switch(tab) {
          case 'home':
            if (typeof HomeModule !== 'undefined') HomeModule.renderPage();
            break;
          case 'photo':
            if (typeof PhotoModule !== 'undefined') {
              PhotoModule.renderPage();
              setTimeout(() => PhotoModule.setupNotification(), 100);
            }
            break;
          case 'lunch':
            if (typeof LunchModule !== 'undefined') LunchModule.renderPage();
            break;
          case 'wish':
            if (typeof WishModule !== 'undefined') WishModule.renderPage();
            break;
        }
        this.isTransitioning = false;
      }, 50);
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
    },

    /** 通用密码弹窗 / 遮罩层配置 */
    setupPasswordOverlay() {
      const overlay = document.getElementById('password-overlay');
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