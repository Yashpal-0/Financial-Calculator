export function initApp() {
  // Theme persistence
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.dataset.theme = saved;

  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = current;
      localStorage.setItem('theme', current);
    });
  }

  // Service worker with auto-update
  if ('serviceWorker' in navigator) {
    // Ensure correct path/scope on subpages and GitHub Pages (served under /REPO_NAME/)
    const currentPath = location.pathname;
    const basePath = currentPath.includes('/pages/')
      ? currentPath.split('/pages/')[0] + '/'
      : (currentPath.endsWith('/') ? currentPath : currentPath.replace(/[^/]+$/, ''));
    const swUrl = basePath + 'service-worker.js';
    navigator.serviceWorker.register(swUrl, { scope: basePath }).then(registration => {
      // Check for updates every time the page loads
      registration.update();
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available, show update notification
            showUpdateNotification();
          }
        });
      });
    }).catch(() => {});
    
    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
        showUpdateNotification();
      }
    });
  }

  // Install prompt
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'inline-flex';
  });
  const installBtn = document.getElementById('installBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      installBtn.style.display = 'none';
    });
  }
}

function showUpdateNotification() {
  // Create update notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--accent-gradient);
    color: white;
    padding: 16px 20px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    z-index: 1000;
    max-width: 300px;
    font-weight: 600;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; gap: 12px;">
      <span>🔄</span>
      <div>
        <div style="font-size: 14px; margin-bottom: 4px;">Update Available!</div>
        <div style="font-size: 12px; opacity: 0.9;">New features and improvements are ready.</div>
      </div>
      <button id="updateBtn" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        margin-left: auto;
      ">Update Now</button>
    </div>
  `;
  
  // Add animation keyframes
  if (!document.getElementById('update-styles')) {
    const style = document.createElement('style');
    style.id = 'update-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Handle update button click
  notification.querySelector('#updateBtn').addEventListener('click', () => {
    window.location.reload();
  });
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 10000);
}


