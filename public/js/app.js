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

// ── Collection Search Filter ──
function filterCollections(query) {
  const items = document.querySelectorAll('#collection-list .tree-item');
  const q = query.toLowerCase().trim();
  items.forEach(item => {
    const name = item.querySelector('.tree-item__name');
    if (!name) return;
    const match = !q || name.textContent.toLowerCase().includes(q);
    item.style.display = match ? '' : 'none';
  });
}
window.filterCollections = filterCollections;

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
// ── Theme System ──
const Theme = (() => {
  const COOKIE_KEY = 'reqtify_theme';
  const themes = ['default', 'midnight', 'ocean'];

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
  }

  function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; expires=${d.toUTCString()}; path=/; SameSite=Lax`;
  }

  function init() {
    const saved = getCookie(COOKIE_KEY) || 'default';
    applyTheme(saved);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    setCookie(COOKIE_KEY, theme);
    document.querySelectorAll('.theme-option').forEach(btn => {
      btn.classList.toggle('theme-option--active', btn.dataset.theme === theme);
    });
  }

  function toggle() {
    const dropdown = document.getElementById('theme-dropdown');
    if (dropdown) {
      dropdown.classList.toggle('hidden');
      setTimeout(() => {
        document.addEventListener('click', () => dropdown.classList.add('hidden'), { once: true });
      }, 10);
    }
  }

  return { init, applyTheme, toggle };
})();
window.Theme = Theme;

// ── Import Postman Collection ──
const ImportPostman = (() => {
  function showModal() {
    document.getElementById('import-modal').classList.remove('modal-overlay--hidden');
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview').innerHTML = '';
    document.getElementById('import-preview').classList.add('hidden');
    document.getElementById('btn-import-confirm').disabled = true;
  }

  function hideModal() {
    document.getElementById('import-modal').classList.add('modal-overlay--hidden');
  }

  function handleFile(input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      Toast.show('Please select a JSON file', 'error');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.info || !data.item) {
          Toast.show('Invalid Postman Collection format', 'error');
          return;
        }

        const preview = document.getElementById('import-preview');
        const reqCount = countRequests(data.item);
        const folderCount = countFolders(data.item);

        preview.innerHTML = `
          <div class="import-preview__card">
            <div class="import-preview__title">📦 ${escapeHtml(data.info.name)}</div>
            <div class="import-preview__meta">
              ${data.info.description ? `<div>${escapeHtml(typeof data.info.description === 'string' ? data.info.description.substring(0, 100) : '')}</div>` : ''}
              <div style="margin-top:8px; display:flex; gap:16px;">
                <span>📂 ${folderCount} folders</span>
                <span>📄 ${reqCount} requests</span>
              </div>
            </div>
          </div>
        `;
        preview.classList.remove('hidden');
        document.getElementById('btn-import-confirm').disabled = false;
        preview.dataset.importData = e.target.result;
      } catch (err) {
        Toast.show('Failed to parse JSON: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }

  function countRequests(items) {
    let count = 0;
    for (const item of items) {
      if (item.item) count += countRequests(item.item);
      else if (item.request) count++;
    }
    return count;
  }

  function countFolders(items) {
    let count = 0;
    for (const item of items) {
      if (item.item) { count++; count += countFolders(item.item); }
    }
    return count;
  }

  async function confirmImport() {
    const preview = document.getElementById('import-preview');
    const rawData = preview.dataset.importData;
    if (!rawData) return;

    const btn = document.getElementById('btn-import-confirm');
    btn.disabled = true;
    btn.textContent = 'Importing...';

    try {
      const data = JSON.parse(rawData);
      const result = await API.collections.importPostman({
        workspaceId: Workspace.getActiveId(),
        data,
      });

      Toast.show(`Imported: ${result.importedRequests} requests, ${result.importedFolders} folders`, 'success');
      hideModal();
      Collections.load(Workspace.getActiveId());
    } catch (err) {
      Toast.show('Import failed: ' + err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Import';
    }
  }

  return { showModal, hideModal, handleFile, confirmImport };
})();
window.ImportPostman = ImportPostman;

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  RequestBuilder.initEditor();
  ResponseViewer.initEditor();
  initSplitter();
  initKeyboardShortcuts();
  Tabs.renderTabBar();
  Workspace.initAutocomplete();
  Auth.init();
});
