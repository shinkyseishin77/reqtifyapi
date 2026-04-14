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

// ── Custom Confirm Dialog ──
const ConfirmDialog = (() => {
  let onConfirmCallback = null;

  function show(title, message, confirmBtnText, onConfirm) {
    document.getElementById('confirm-modal-title').textContent = title;
    document.getElementById('confirm-modal-message').textContent = message;
    
    const btn = document.getElementById('confirm-modal-btn');
    btn.textContent = confirmBtnText;

    onConfirmCallback = onConfirm;
    
    // Clear old click listener and add new one
    btn.onclick = () => {
      document.getElementById('confirm-modal').classList.add('modal-overlay--hidden');
      if (typeof onConfirmCallback === 'function') {
        onConfirmCallback();
      }
    };

    document.getElementById('confirm-modal').classList.remove('modal-overlay--hidden');
  }

  function cancel() {
    document.getElementById('confirm-modal').classList.add('modal-overlay--hidden');
    onConfirmCallback = null;
  }

  return { show, cancel };
})();
window.ConfirmDialog = ConfirmDialog;

// ── Context Menu ──
let _ctxDismissHandler = null;

function showContextMenu(x, y, items) {
  closeContextMenu();
  const menu = document.createElement('div');
  menu.className = 'context-menu';
  menu.id = 'active-context-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  items.forEach(item => {
    if (item.divider) {
      const div = document.createElement('div');
      div.className = 'context-menu__divider';
      menu.appendChild(div);
    } else {
      const btn = document.createElement('button');
      btn.className = `context-menu__item ${item.danger ? 'context-menu__item--danger' : ''}`;
      btn.textContent = item.label;
      btn.addEventListener('mousedown', (e) => {
        // Prevent the dismiss handler from firing
        e.stopPropagation();
      });
      btn.addEventListener('touchstart', (e) => {
        // Prevent on mobile devices as well
        e.stopPropagation();
      }, { passive: true });
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        // Remove dismiss handler first, then close menu, then run action
        if (_ctxDismissHandler) {
          document.removeEventListener('mousedown', _ctxDismissHandler);
          _ctxDismissHandler = null;
        }
        closeContextMenu();
        // Call action directly - don't defer with setTimeout!
        item.action();
      });
      menu.appendChild(btn);
    }
  });

  document.body.appendChild(menu);

  // Adjust position if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
  if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';

  // Dismiss menu when clicking anywhere outside
  _ctxDismissHandler = (e) => {
    const activeMenu = document.getElementById('active-context-menu');
    if (!activeMenu || !activeMenu.contains(e.target)) {
      closeContextMenu();
    }
  };
  setTimeout(() => {
    document.addEventListener('mousedown', _ctxDismissHandler);
    document.addEventListener('touchstart', _ctxDismissHandler, { passive: true });
  }, 50);
}

function closeContextMenu() {
  if (_ctxDismissHandler) {
    document.removeEventListener('mousedown', _ctxDismissHandler);
    document.removeEventListener('touchstart', _ctxDismissHandler);
    _ctxDismissHandler = null;
  }
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

  function startDrag(clientY, e) {
    isDragging = true;
    startY = clientY;
    startRequestHeight = requestPane.offsetHeight;
    splitter.classList.add('splitter--active');
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    if (e) e.preventDefault();
  }

  function doDrag(clientY) {
    if (!isDragging) return;
    const delta = clientY - startY;
    const newHeight = Math.max(120, Math.min(startRequestHeight + delta, window.innerHeight - 250));
    requestPane.style.flex = 'none';
    requestPane.style.height = newHeight + 'px';
    responsePane.style.flex = '1';

    // Refresh editors
    const reqEd = RequestBuilder.getEditor();
    const resEd = ResponseViewer.getEditor();
    if (reqEd) reqEd.refresh();
    if (resEd) resEd.refresh();
  }

  function endDrag() {
    if (isDragging) {
      isDragging = false;
      splitter.classList.remove('splitter--active');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    }
  }

  // Mouse events
  splitter.addEventListener('mousedown', (e) => startDrag(e.clientY, e));
  document.addEventListener('mousemove', (e) => doDrag(e.clientY));
  document.addEventListener('mouseup', endDrag);

  // Touch events (mobile/tablet support)
  splitter.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientY, e);
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (isDragging && e.touches.length === 1) doDrag(e.touches[0].clientY);
  }, { passive: true });
  document.addEventListener('touchend', endDrag);
  document.addEventListener('touchcancel', endDrag);

  // Clean up stuck drag state if mouse leaves the window
  window.addEventListener('blur', endDrag);
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

  // Detect Postman format version
  function detectFormat(data) {
    if (data.info && data.item) {
      const schema = data.info.schema || '';
      if (schema.includes('v2.1')) return { version: 'v2.1', name: data.info.name, items: data.item, desc: data.info.description };
      if (schema.includes('v2.0')) return { version: 'v2.0', name: data.info.name, items: data.item, desc: data.info.description };
      return { version: 'v2.x', name: data.info.name, items: data.item, desc: data.info.description };
    }
    if (data.requests && Array.isArray(data.requests)) {
      return { version: 'v1.0', name: data.name || 'Legacy Collection', items: data.requests.map(r => ({ name: r.name, request: r })), desc: data.description };
    }
    if (data.collection && data.collection.item) {
      return { version: 'v2.x', name: data.collection.info?.name || 'Collection', items: data.collection.item, desc: data.collection.info?.description };
    }
    return null;
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
        const fmt = detectFormat(data);

        if (!fmt) {
          Toast.show('Unrecognized Postman format. Expected v1.0, v2.0, or v2.1.', 'error');
          return;
        }

        const preview = document.getElementById('import-preview');
        const reqCount = countRequests(fmt.items);
        const folderCount = countFolders(fmt.items);
        const desc = typeof fmt.desc === 'string' ? fmt.desc.substring(0, 120) : '';

        preview.innerHTML = `
          <div class="import-preview__card">
            <div class="import-preview__title">📦 ${escapeHtml(fmt.name)}</div>
            <div class="import-preview__meta">
              <span class="import-preview__badge">${fmt.version}</span>
              ${desc ? `<div style="margin-top:4px;">${escapeHtml(desc)}</div>` : ''}
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
