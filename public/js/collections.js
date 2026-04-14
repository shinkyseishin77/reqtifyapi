/**
 * Collections Module - Collection tree, CRUD, and request listing
 */
const Collections = (() => {
  let collections = [];
  let expandedFolders = new Set();

  async function load(workspaceId) {
    const listEl = document.getElementById('collection-list');
    listEl.innerHTML = '<div class="empty-state"><div class="loading-spinner"></div></div>';

    try {
      collections = await API.collections.listByWorkspace(workspaceId);
      render();
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state__text">Failed to load</div></div>`;
      console.error('Failed to load collections:', err);
    }
  }

  function render() {
    const listEl = document.getElementById('collection-list');

    if (collections.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">📂</div>
          <div class="empty-state__text">No collections yet</div>
          <button class="btn btn--primary btn--sm" onclick="Collections.showCreateModal()">Create Collection</button>
        </div>
      `;
      return;
    }

    // Build tree: top-level collections (parentId === null)
    const topLevel = collections.filter(c => !c.parentId);
    listEl.innerHTML = topLevel.map(c => renderCollectionNode(c)).join('');
  }

  function renderCollectionNode(col) {
    const children = collections.filter(c => c.parentId === col.id);
    const requests = col.requests || [];
    const hasChildren = children.length > 0 || requests.length > 0;
    const isExpanded = expandedFolders.has(col.id);

    return `
      <div class="tree-item" data-collection-id="${col.id}">
        <div class="tree-item__header" onclick="Collections.toggle(${col.id})" oncontextmenu="Collections.contextMenu(event, ${col.id})">
          <span class="tree-item__arrow ${isExpanded ? 'tree-item__arrow--expanded' : ''}" ${!hasChildren ? 'style="visibility:hidden"' : ''}>▶</span>
          <span class="tree-item__icon tree-item__icon--folder">📁</span>
          <span class="tree-item__name">${escapeHtml(col.name)}</span>
          <span class="tree-item__actions">
            <button class="tree-item__action-btn" onclick="event.stopPropagation(); Collections.showAddRequestModal(${col.id})" title="Add Request">＋</button>
            <button class="tree-item__action-btn" onclick="event.stopPropagation(); Collections.showContextActions(event, ${col.id})" title="More">⋯</button>
          </span>
        </div>
        ${hasChildren ? `
          <div class="tree-item__children" style="${isExpanded ? '' : 'display:none'}">
            ${children.map(c => renderCollectionNode(c)).join('')}
            ${requests.map(r => renderRequestNode(r)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderRequestNode(req) {
    const methodClass = `method-${(req.method || 'GET').toLowerCase()}`;
    return `
      <div class="tree-item">
        <div class="tree-item__header" onclick="Collections.openRequest(${req.id})" oncontextmenu="Collections.requestContextMenu(event, ${req.id})">
          <span class="tree-item__arrow" style="visibility:hidden">▶</span>
          <span class="tree-item__icon tree-item__icon--request ${methodClass}">${(req.method || 'GET').substring(0, 3)}</span>
          <span class="tree-item__name">${escapeHtml(req.name)}</span>
          <span class="tree-item__actions">
            <button class="tree-item__action-btn" onclick="event.stopPropagation(); Collections.deleteRequest(${req.id})" title="Delete">🗑</button>
          </span>
        </div>
      </div>
    `;
  }

  function toggle(colId) {
    if (expandedFolders.has(colId)) {
      expandedFolders.delete(colId);
    } else {
      expandedFolders.add(colId);
      // Load full collection with requests if not loaded
      loadCollectionDetail(colId);
    }
    render();
  }

  async function loadCollectionDetail(colId) {
    try {
      const detail = await API.collections.getById(colId);
      // Update collection in our list with requests
      const idx = collections.findIndex(c => c.id === colId);
      if (idx !== -1) {
        collections[idx] = { ...collections[idx], ...detail };
      }
      render();
    } catch (err) {
      console.error('Failed to load collection detail:', err);
    }
  }

  async function openRequest(requestId) {
    try {
      const req = await API.requests.getById(requestId);
      Tabs.openSavedRequest(req);
    } catch (err) {
      Toast.show('Failed to load request', 'error');
    }
  }

  function showCreateModal(parentId = null) {
    document.getElementById('collection-modal').classList.remove('modal-overlay--hidden');
    document.getElementById('collection-modal-title').textContent = parentId ? 'New Folder' : 'New Collection';
    document.getElementById('col-name').value = '';
    document.getElementById('col-parent-id').value = parentId || '';
  }

  function hideCreateModal() {
    document.getElementById('collection-modal').classList.add('modal-overlay--hidden');
  }

  async function saveCollection() {
    const name = document.getElementById('col-name').value.trim();
    const parentId = document.getElementById('col-parent-id').value;
    if (!name) return;

    try {
      const data = {
        name,
        workspaceId: Workspace.getActiveId(),
      };
      if (parentId) data.parentId = parseInt(parentId);

      await API.collections.create(data);
      await load(Workspace.getActiveId());
      hideCreateModal();
      Toast.show('Collection created', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  function showAddRequestModal(collectionId) {
    document.getElementById('save-request-modal').classList.remove('modal-overlay--hidden');
    document.getElementById('save-req-name').value = 'New Request';
    document.getElementById('save-req-collection-id').value = collectionId;
    document.getElementById('save-req-mode').value = 'new-blank';
  }

  function contextMenu(event, colId) {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, [
      { label: '＋ Add Request', action: () => showAddRequestModal(colId) },
      { label: '📂 Add Folder', action: () => showCreateModal(colId) },
      { label: '✏️ Rename', action: () => renameCollection(colId) },
      { divider: true },
      { label: '🗑 Delete', action: () => deleteCollection(colId), danger: true },
    ]);
  }

  function requestContextMenu(event, reqId) {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, [
      { label: '📋 Duplicate', action: () => duplicateRequest(reqId) },
      { divider: true },
      { label: '🗑 Delete', action: () => deleteRequest(reqId), danger: true },
    ]);
  }

  function showContextActions(event, colId) {
    contextMenu(event, colId);
  }

  async function renameCollection(colId) {
    const col = collections.find(c => c.id === colId);
    const newName = prompt('Rename collection:', col?.name || '');
    if (newName && newName.trim()) {
      try {
        await API.collections.update(colId, { name: newName.trim() });
        await load(Workspace.getActiveId());
        Toast.show('Collection renamed', 'success');
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    }
  }

  async function deleteCollection(colId) {
    if (!confirm('Delete this collection and all its requests?')) return;
    try {
      await API.collections.delete(colId);
      await load(Workspace.getActiveId());
      Toast.show('Collection deleted', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  async function deleteRequest(reqId) {
    if (!confirm('Delete this request?')) return;
    try {
      await API.requests.delete(reqId);
      await load(Workspace.getActiveId());
      Toast.show('Request deleted', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  async function duplicateRequest(reqId) {
    try {
      const req = await API.requests.getById(reqId);
      await API.requests.create({
        name: req.name + ' (Copy)',
        method: req.method,
        url: req.url,
        query: req.query,
        headers: req.headers,
        body: req.body,
        bodyType: req.bodyType,
        auth: req.auth,
        collectionId: req.collectionId,
      });
      await load(Workspace.getActiveId());
      Toast.show('Request duplicated', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  function getCollections() {
    return collections;
  }

  return {
    load, render, toggle, openRequest,
    showCreateModal, hideCreateModal, saveCollection,
    showAddRequestModal, contextMenu, requestContextMenu,
    showContextActions, deleteRequest, deleteCollection,
    getCollections
  };
})();

window.Collections = Collections;
