// 27c.site 静态版 - 公共模块（导航、Toast、页面初始化）

// ── Toast 通知 ──
function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── 导航栏渲染 ──
function renderNav() {
  const lang = getLang();
  const navUser = document.getElementById('nav-user');
  const navAuth = document.getElementById('nav-auth');

  onAuthChange(user => {
    if (user) {
      const username = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
      navUser.innerHTML = `
        <a href="/dashboard.html">${t('nav_admin')}</a>
        <span class="nav-user">${username}</span>
        <a href="#" class="nav-btn-sm" onclick="handleLogout(event)">${t('nav_logout')}</a>
      `;
    } else {
      navUser.innerHTML = `
        <a href="/login.html" class="nav-btn-sm">${t('nav_login')}</a>
        <a href="/register.html" class="nav-btn">${t('nav_register')}</a>
      `;
    }
  });

  // 语言切换
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) {
    langBtn.textContent = t('lang_switch');
    langBtn.onclick = (e) => { e.preventDefault(); setLang(lang === 'zh' ? 'en' : 'zh'); };
  }

  // 移动端菜单
  const toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.onclick = () => document.querySelector('.nav-links').classList.toggle('open');
  }
}

async function handleLogout(e) {
  e.preventDefault();
  await signOut();
  window.location.href = '/';
}

// ── 页面公共初始化 ──
document.addEventListener('DOMContentLoaded', async () => {
  await getSession(); // 初始化 auth 状态
  renderNav();
});
