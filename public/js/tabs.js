/**
 * Tabs Module - Request tab management (browser-like tabs)
 */
const Tabs = (() => {
  let tabs = [];
  let activeTabId = null;
  let nextId = 1;

  function createTab(data = {}) {
    const tab = {
      id: nextId++,
      name: data.name || 'Untitled Request',
      method: data.method || 'GET',
      url: data.url || '',
      params: [],
      headers: [],
      authType: 'none',
      authToken: '',
      authUsername: '',
      authPassword: '',
      bodyType: 'raw',
      body: '',
      savedRequestId: data.savedRequestId || null,
      collectionId: data.collectionId || null,
      unsaved: !data.savedRequestId,
      // Response state
      response: null,
    };

    // Parse saved data
    if (data.query) {
      try { tab.params = JSON.parse(data.query); } catch(e) { tab.params = []; }
    }
    if (data.headers) {
      try { tab.headers = JSON.parse(data.headers); } catch(e) { tab.headers = []; }
    }
    if (data.auth) {
      try {
        const a = JSON.parse(data.auth);
        tab.authType = a.type || 'none';
        tab.authToken = a.token || '';
        tab.authUsername = a.username || '';
        tab.authPassword = a.password || '';
      } catch(e) {}
    }
    if (data.body) {
      tab.body = data.body;
    }
    if (data.bodyType) {
      tab.bodyType = data.bodyType;
    }

    tabs.push(tab);
    activateTab(tab.id);
    renderTabBar();
    return tab;
  }

  function openSavedRequest(req) {
    // Check if already open
    const existing = tabs.find(t => t.savedRequestId === req.id);
    if (existing) {
      activateTab(existing.id);
      return;
    }

    createTab({
      name: req.name,
      method: req.method,
      url: req.url,
      query: req.query,
      headers: req.headers,
      body: req.body,
      bodyType: req.bodyType,
      auth: req.auth,
      savedRequestId: req.id,
      collectionId: req.collectionId,
    });
  }

  function activateTab(tabId) {
    // Save current tab state before switching
    if (activeTabId) {
      saveCurrentTabState();
    }
    activeTabId = tabId;
    renderTabBar();
    restoreTabState();
  }

  function closeTab(tabId) {
    const idx = tabs.findIndex(t => t.id === tabId);
    if (idx === -1) return;

    tabs.splice(idx, 1);

    if (activeTabId === tabId) {
      if (tabs.length > 0) {
        const newIdx = Math.min(idx, tabs.length - 1);
        activeTabId = tabs[newIdx].id;
      } else {
        activeTabId = null;
      }
    }

    renderTabBar();
    if (activeTabId) {
      restoreTabState();
    } else {
      RequestBuilder.clear();
      ResponseViewer.clear();
      showWelcome(true);
    }
  }

  function renderTabBar() {
    const bar = document.getElementById('tab-bar');
    if (!bar) return;

    const tabsHtml = tabs.map(tab => {
      const methodClass = `method-${tab.method.toLowerCase()}`;
      const isActive = tab.id === activeTabId;
      return `
        <button class="tab-bar__item ${isActive ? 'tab-bar__item--active' : ''} ${tab.unsaved ? 'tab-bar__item--unsaved' : ''}"
                onclick="Tabs.activateTab(${tab.id})" 
                title="${escapeHtml(tab.name)}">
          <span class="tab-bar__method ${methodClass}">${tab.method}</span>
          <span class="tab-bar__name">${escapeHtml(tab.name)}</span>
          <button class="tab-bar__close" onclick="event.stopPropagation(); Tabs.closeTab(${tab.id})">×</button>
        </button>
      `;
    }).join('');

    bar.innerHTML = tabsHtml + `
      <button class="tab-bar__new" onclick="Tabs.newTab()" title="New Request (Ctrl+N)">＋</button>
    `;

    showWelcome(tabs.length === 0);
  }

  function showWelcome(show) {
    const welcome = document.getElementById('welcome-screen');
    const requestPane = document.getElementById('request-pane');
    if (welcome && requestPane) {
      welcome.classList.toggle('hidden', !show);
      requestPane.classList.toggle('hidden', show);
    }
  }

  function newTab() {
    createTab();
  }

  function getActiveTab() {
    return tabs.find(t => t.id === activeTabId) || null;
  }

  function saveCurrentTabState() {
    const tab = getActiveTab();
    if (!tab) return;
    RequestBuilder.saveToTab(tab);
  }

  function restoreTabState() {
    const tab = getActiveTab();
    if (!tab) return;
    showWelcome(false);
    RequestBuilder.loadFromTab(tab);
    if (tab.response) {
      ResponseViewer.display(tab.response);
    } else {
      ResponseViewer.clear();
    }
  }

  function markUnsaved() {
    const tab = getActiveTab();
    if (tab) {
      tab.unsaved = true;
      renderTabBar();
    }
  }

  function markSaved(requestId, collectionId) {
    const tab = getActiveTab();
    if (tab) {
      tab.unsaved = false;
      tab.savedRequestId = requestId;
      tab.collectionId = collectionId;
      renderTabBar();
    }
  }

  function updateActiveTabName(name, method) {
    const tab = getActiveTab();
    if (tab) {
      if (name) tab.name = name;
      if (method) tab.method = method;
      renderTabBar();
    }
  }

  function setResponse(responseData) {
    const tab = getActiveTab();
    if (tab) {
      tab.response = responseData;
    }
  }

  return {
    createTab, openSavedRequest, activateTab, closeTab,
    renderTabBar, newTab, getActiveTab, saveCurrentTabState,
    markUnsaved, markSaved, updateActiveTabName, setResponse
  };
})();

window.Tabs = Tabs;
