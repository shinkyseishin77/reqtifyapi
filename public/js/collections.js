/**
 * Collections Module - Collection tree, CRUD, rename, and request listing
 */
const Collections = (() => {
  let collections = [];
  let expandedFolders = new Set();

  async function load(workspaceId) {
    const listEl = document.getElementById('collection-list');
    if (!listEl) return;
    listEl.innerHTML = '<div class="empty-state"><div class="loading-spinner"></div></div>';

    try {
      collections = await API.collections.listByWorkspace(workspaceId);
      render();
    } catch (err) {
      listEl.innerHTML = `<div class="empty-state"><div class="empty-state__text">Failed to load collections</div></div>`;
      console.error('Failed to load collections:', err);
    }
  }

  function render() {
    const listEl = document.getElementById('collection-list');
    if (!listEl) return;

    if (!collections || collections.length === 0) {
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
            ${requests.map(r => renderRequestNode(r, col.id)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  function renderRequestNode(req, collectionId) {
    const method = (req.method || 'GET').toUpperCase();
    const methodClass = `method-${method.toLowerCase()}`;
    return `
      <div class="tree-item">
        <div class="tree-item__header" onclick="Collections.openRequest(${req.id})" oncontextmenu="Collections.requestContextMenu(event, ${req.id}, ${collectionId})">
          <span class="tree-item__arrow" style="visibility:hidden">▶</span>
          <span class="tree-item__icon tree-item__icon--request ${methodClass}">${method.substring(0, 3)}</span>
          <span class="tree-item__name">${escapeHtml(req.name)}</span>
          <span class="tree-item__actions">
            <button class="tree-item__action-btn" onclick="event.stopPropagation(); Collections.requestContextMenu(event, ${req.id}, ${collectionId})" title="More">⋯</button>
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
      loadCollectionDetail(colId);
    }
    render();
  }

  async function loadCollectionDetail(colId) {
    try {
      const detail = await API.collections.getById(colId);
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
      Toast.show('Failed to load request: ' + err.message, 'error');
    }
  }

  // ── Create Collection Modal ──
  function showCreateModal(parentId = null) {
    const modal = document.getElementById('collection-modal');
    const titleEl = document.getElementById('collection-modal-title');
    const nameEl = document.getElementById('col-name');
    const parentEl = document.getElementById('col-parent-id');
    const editIdEl = document.getElementById('col-edit-id');

    titleEl.textContent = parentId ? 'New Folder' : 'New Collection';
    nameEl.value = '';
    parentEl.value = parentId || '';
    editIdEl.value = '';
    modal.classList.remove('modal-overlay--hidden');

    // Focus the input
    setTimeout(() => nameEl.focus(), 100);
  }

  function hideCreateModal() {
    document.getElementById('collection-modal').classList.add('modal-overlay--hidden');
  }

  async function saveCollection() {
    const name = document.getElementById('col-name').value.trim();
    const parentId = document.getElementById('col-parent-id').value;
    const editId = document.getElementById('col-edit-id').value;
    if (!name) {
      Toast.show('Name is required', 'error');
      return;
    }

    try {
      if (editId) {
        // Rename / update existing
        await API.collections.update(parseInt(editId), { name });
        Toast.show('Collection renamed', 'success');
      } else {
        // Create new
        const data = {
          name,
          workspaceId: Workspace.getActiveId(),
        };
        if (parentId) data.parentId = parseInt(parentId);
        await API.collections.create(data);
        Toast.show('Collection created', 'success');
      }

      await load(Workspace.getActiveId());
      hideCreateModal();
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  // ── Rename Collection (uses the same modal) ──
  function showRenameModal(colId) {
    const col = collections.find(c => c.id === colId);
    if (!col) return;

    const modal = document.getElementById('collection-modal');
    const titleEl = document.getElementById('collection-modal-title');
    const nameEl = document.getElementById('col-name');
    const parentEl = document.getElementById('col-parent-id');
    const editIdEl = document.getElementById('col-edit-id');

    titleEl.textContent = 'Rename Collection';
    nameEl.value = col.name;
    parentEl.value = col.parentId || '';
    editIdEl.value = col.id;
    modal.classList.remove('modal-overlay--hidden');

    setTimeout(() => { nameEl.focus(); nameEl.select(); }, 100);
  }

  // ── Add Request from sidebar ──
  function showAddRequestModal(collectionId) {
    const modal = document.getElementById('save-request-modal');
    document.getElementById('save-req-name').value = 'New Request';
    document.getElementById('save-req-collection-id').value = collectionId;
    document.getElementById('save-req-mode').value = 'new-blank';

    // Set the collection select  
    const select = document.getElementById('save-req-collection-select');
    select.innerHTML = collections.map(c =>
      `<option value="${c.id}" ${c.id === collectionId ? 'selected' : ''}>${escapeHtml(c.name)}</option>`
    ).join('');
    select.value = collectionId;

    modal.classList.remove('modal-overlay--hidden');
  }

  // ── Context Menus ──
  function contextMenu(event, colId) {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, [
      { label: '＋ Add Request', action: () => showAddRequestModal(colId) },
      { label: '📂 Add Folder', action: () => showCreateModal(colId) },
      { divider: true },
      { label: '✏️ Rename', action: () => showRenameModal(colId) },
      { divider: true },
      { label: '🗑 Delete Collection', action: () => deleteCollection(colId), danger: true },
    ]);
  }

  function requestContextMenu(event, reqId, collectionId) {
    event.preventDefault();
    event.stopPropagation();
    showContextMenu(event.clientX, event.clientY, [
      { label: '📂 Open in Tab', action: () => openRequest(reqId) },
      { label: '✏️ Rename', action: () => renameRequest(reqId) },
      { label: '📋 Duplicate', action: () => duplicateRequest(reqId) },
      { divider: true },
      { label: '🗑 Delete', action: () => deleteRequest(reqId), danger: true },
    ]);
  }

  function showContextActions(event, colId) {
    contextMenu(event, colId);
  }

  // ── Rename Request (uses inline modal) ──
  async function renameRequest(reqId) {
    // Find request name from collections
    let currentName = 'Request';
    for (const col of collections) {
      const req = (col.requests || []).find(r => r.id === reqId);
      if (req) { currentName = req.name; break; }
    }

    // Reuse the rename modal
    const modal = document.getElementById('rename-modal');
    document.getElementById('rename-modal-title').textContent = 'Rename Request';
    document.getElementById('rename-input').value = currentName;
    document.getElementById('rename-target-id').value = reqId;
    document.getElementById('rename-target-type').value = 'request';
    modal.classList.remove('modal-overlay--hidden');
    setTimeout(() => {
      document.getElementById('rename-input').focus();
      document.getElementById('rename-input').select();
    }, 100);
  }

  async function confirmRename() {
    const name = document.getElementById('rename-input').value.trim();
    const targetId = parseInt(document.getElementById('rename-target-id').value);
    const targetType = document.getElementById('rename-target-type').value;

    if (!name) {
      Toast.show('Name is required', 'error');
      return;
    }

    try {
      if (targetType === 'request') {
        await API.requests.update(targetId, { name });
        Toast.show('Request renamed', 'success');
      }
      document.getElementById('rename-modal').classList.add('modal-overlay--hidden');
      await load(Workspace.getActiveId());
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  // ── Delete ──
  async function deleteCollection(colId) {
    const col = collections.find(c => c.id === colId);
    const name = col ? col.name : 'this collection';
    if (!confirm(`Delete "${name}" and all its requests?`)) return;
    try {
      await API.collections.delete(colId);
      expandedFolders.delete(colId);
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
    showRenameModal, showAddRequestModal,
    contextMenu, requestContextMenu, showContextActions,
    renameRequest, confirmRename,
    deleteRequest, deleteCollection, duplicateRequest,
    getCollections
  };
})();

window.Collections = Collections;
