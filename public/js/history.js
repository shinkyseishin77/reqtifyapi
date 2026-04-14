/**
 * History Module - Request history
 */
const History = (() => {
  let historyItems = [];

  async function load(workspaceId) {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    listEl.innerHTML = '<div class="empty-state"><div class="loading-spinner"></div></div>';

    try {
      historyItems = await API.history.list({ workspaceId, limit: 50 });
      render();
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state__text">Failed to load history</div></div>`;
    }
  }

  function render() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    if (!historyItems || historyItems.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🕐</div>
          <div class="empty-state__text">No history yet</div>
          <div class="empty-state__sub">Send a request to see it here</div>
        </div>
      `;
      return;
    }

    // Group by date
    const groups = {};
    historyItems.forEach(item => {
      const date = new Date(item.createdAt).toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });

    let html = '';
    Object.entries(groups).forEach(([date, items]) => {
      html += `<div class="history-group__title">${date}</div>`;
      items.forEach(item => {
        const method = (item.method || 'GET').toUpperCase();
        const methodClass = `method-${method.toLowerCase()}`;
        const statusClass = item.status >= 400 ? 'color: var(--method-delete)' 
                          : item.status >= 300 ? 'color: var(--method-put)' 
                          : 'color: var(--status-success)';
        
        // Extract path from URL
        let displayUrl = item.url;
        try {
          const u = new URL(item.url);
          displayUrl = u.pathname + u.search;
        } catch(e) {}

        html += `
          <div class="history-item" onclick="History.restore(${item.id})">
            <span class="history-item__method ${methodClass}">${method}</span>
            <span class="history-item__url" title="${escapeHtml(item.url)}">${escapeHtml(displayUrl)}</span>
            ${item.status ? `<span class="history-item__status" style="${statusClass}">${item.status}</span>` : ''}
            <button class="kv-remove-btn" onclick="event.stopPropagation(); History.remove(${item.id})" title="Delete">×</button>
          </div>
        `;
      });
    });

    listEl.innerHTML = html;
  }

  function restore(historyId) {
    const item = historyItems.find(h => h.id === historyId);
    if (!item) return;

    Tabs.createTab({
      name: `${item.method} ${item.url}`.substring(0, 40),
      method: item.method || 'GET',
      url: item.url,
    });
  }

  async function remove(historyId) {
    try {
      await API.history.delete(historyId);
      historyItems = historyItems.filter(h => h.id !== historyId);
      render();
    } catch (err) {
      Toast.show('Failed to delete', 'error');
    }
  }

  async function clearAll() {
    const wsId = Workspace.getActiveId();
    if (!wsId || !confirm('Clear all history?')) return;
    try {
      await API.history.clear(wsId);
      historyItems = [];
      render();
      Toast.show('History cleared', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  return { load, render, restore, remove, clearAll };
})();

window.History = History;
