/**
 * App.js - Main Application Controller
 * Initializes all modules, global utilities, keyboard shortcuts, toasts
 */

// ── Utility Functions ──
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ── Toast System ──
const Toast = (() => {
  function show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `<span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast--leaving');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  return { show };
})();
window.Toast = Toast;

// ── Context Menu ──
function showContextMenu(x, y, items) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.id = 'active-context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  items.forEach(item => {
    if (item.divider) {
      menu.innerHTML += '<div class="context-menu__divider"></div>';
    } else {
      const btn = document.createElement('button');
      btn.className = `context-menu__item ${item.danger ? 'context-menu__item--danger' : ''}`;
      btn.textContent = item.label;
      btn.onclick = () => { closeContextMenu(); item.action(); };
      menu.appendChild(btn);
    }
  });

  document.body.appendChild(menu);

  // Adjust position if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';

  setTimeout(() => {
    document.addEventListener('click', closeContextMenu, { once: true });
    document.addEventListener('contextmenu', closeContextMenu, { once: true });
  }, 10);
}

function closeContextMenu() {
  const menu = document.getElementById('active-context-menu');
  if (menu) menu.remove();
}

window.showContextMenu = showContextMenu;
window.closeContextMenu = closeContextMenu;

// ── Sidebar Tab Switching ──
function switchSidebarTab(tabName) {
  document.querySelectorAll('.sidebar__tab').forEach(t => {
    t.classList.toggle('sidebar__tab--active', t.dataset.tab === tabName);
  });
  document.querySelectorAll('.sidebar__panel').forEach(p => {
    p.classList.toggle('sidebar__panel--active', p.dataset.panel === tabName);
  });
}
window.switchSidebarTab = switchSidebarTab;

// ── Splitter (Resizable Panels) ──
function initSplitter() {
  const splitter = document.getElementById('pane-splitter');
  const requestPane = document.getElementById('request-builder-area');
  const responsePane = document.getElementById('response-pane');
  if (!splitter || !requestPane || !responsePane) return;

  let isDragging = false;
  let startY, startRequestHeight;

  splitter.addEventListener('mousedown', (e) => {
    isDragging = true;
    startY = e.clientY;
    startRequestHeight = requestPane.offsetHeight;
    splitter.classList.add('splitter--active');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const delta = e.clientY - startY;
    const newHeight = Math.max(120, Math.min(startRequestHeight + delta, window.innerHeight - 250));
    requestPane.style.flex = 'none';
    requestPane.style.height = newHeight + 'px';
    responsePane.style.flex = '1';

    // Refresh editors
    const reqEd = RequestBuilder.getEditor();
    const resEd = ResponseViewer.getEditor();
    if (reqEd) reqEd.refresh();
    if (resEd) resEd.refresh();
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      splitter.classList.remove('splitter--active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  });
}

// ── Keyboard Shortcuts ──
function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter = Send
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      RequestBuilder.sendRequest();
    }
    // Ctrl+S = Save
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      RequestBuilder.saveRequest();
    }
    // Ctrl+N = New Tab
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      Tabs.newTab();
    }
    // Ctrl+W = Close Tab
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      const tab = Tabs.getActiveTab();
      if (tab) Tabs.closeTab(tab.id);
    }
    // Escape = Close modals / context menu
    if (e.key === 'Escape') {
      closeContextMenu();
      document.querySelectorAll('.modal-overlay:not(.modal-overlay--hidden)').forEach(m => {
        if (m.id !== 'auth-modal') m.classList.add('modal-overlay--hidden');
      });
    }
  });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  // Init editors
  RequestBuilder.initEditor();
  ResponseViewer.initEditor();

  // Init splitter
  initSplitter();

  // Init keyboard shortcuts
  initKeyboardShortcuts();

  // Init tab bar
  Tabs.renderTabBar();

  // Init auth
  Auth.init();
});
