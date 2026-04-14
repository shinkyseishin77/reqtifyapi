/**
 * Workspace Module - Workspace selection and management
 */
const Workspace = (() => {
  let workspaces = [];
  let activeWorkspace = null;
  let dropdownOpen = false;

  async function init() {
    try {
      workspaces = await API.workspaces.list();
      const savedId = localStorage.getItem('pm_workspace');

      if (workspaces.length === 0) {
        // Auto-create a default workspace
        const ws = await API.workspaces.create({ name: 'My Workspace', description: 'Default workspace' });
        workspaces = [ws];
      }

      if (savedId) {
        activeWorkspace = workspaces.find(w => w.id === parseInt(savedId)) || workspaces[0];
      } else {
        activeWorkspace = workspaces[0];
      }

      localStorage.setItem('pm_workspace', activeWorkspace.id);
      renderSelector();
      onWorkspaceChanged();
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      Toast.show('Failed to load workspaces', 'error');
    }
  }

  function renderSelector() {
    const nameEl = document.getElementById('workspace-name');
    if (nameEl && activeWorkspace) {
      nameEl.textContent = activeWorkspace.name;
    }
  }

  function toggleDropdown() {
    const dropdown = document.getElementById('workspace-dropdown');
    dropdownOpen = !dropdownOpen;
    if (dropdownOpen) {
      renderDropdown();
      dropdown.classList.remove('hidden');
      // Close on outside click
      setTimeout(() => {
        document.addEventListener('click', closeDropdown, { once: true });
      }, 10);
    } else {
      dropdown.classList.add('hidden');
    }
  }

  function closeDropdown(e) {
    const dropdown = document.getElementById('workspace-dropdown');
    dropdown.classList.add('hidden');
    dropdownOpen = false;
  }

  function renderDropdown() {
    const dropdown = document.getElementById('workspace-dropdown');
    dropdown.innerHTML = `
      <div class="dropdown__header">Workspaces</div>
      ${workspaces.map(ws => `
        <button class="dropdown__item ${ws.id === activeWorkspace?.id ? 'dropdown__item--active' : ''}" 
                onclick="Workspace.select(${ws.id}); event.stopPropagation();">
          📁 ${escapeHtml(ws.name)}
        </button>
      `).join('')}
      <div class="dropdown__divider"></div>
      <button class="dropdown__item" onclick="Workspace.showCreateModal(); event.stopPropagation();">
        ＋ New Workspace
      </button>
    `;
  }

  async function select(id) {
    activeWorkspace = workspaces.find(w => w.id === id);
    localStorage.setItem('pm_workspace', id);
    renderSelector();
    closeDropdown();
    onWorkspaceChanged();
  }

  function onWorkspaceChanged() {
    Collections.load(activeWorkspace.id);
    Environments.load(activeWorkspace.id);
    History.load(activeWorkspace.id);
  }

  function showCreateModal() {
    closeDropdown();
    const modal = document.getElementById('workspace-modal');
    document.getElementById('workspace-modal-title').textContent = 'New Workspace';
    document.getElementById('ws-name').value = '';
    document.getElementById('ws-desc').value = '';
    modal.classList.remove('modal-overlay--hidden');
  }

  function hideCreateModal() {
    document.getElementById('workspace-modal').classList.add('modal-overlay--hidden');
  }

  async function saveWorkspace() {
    const name = document.getElementById('ws-name').value.trim();
    const description = document.getElementById('ws-desc').value.trim();
    if (!name) return;

    try {
      const ws = await API.workspaces.create({ name, description });
      workspaces.push(ws);
      await select(ws.id);
      hideCreateModal();
      Toast.show('Workspace created', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  function getActive() {
    return activeWorkspace;
  }

  function getActiveId() {
    return activeWorkspace?.id;
  }

  return { init, toggleDropdown, select, showCreateModal, hideCreateModal, saveWorkspace, getActive, getActiveId };
})();

window.Workspace = Workspace;
