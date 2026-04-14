/**
 * Environments Module - Environment variable management
 */
const Environments = (() => {
  let environments = [];
  let activeEnvId = null;
  let activeVariables = {};

  async function load(workspaceId) {
    try {
      environments = await API.environments.listByWorkspace(workspaceId);
      const savedId = localStorage.getItem('pm_env');
      if (savedId && environments.find(e => e.id === parseInt(savedId))) {
        activeEnvId = parseInt(savedId);
        parseActiveVariables();
      } else {
        activeEnvId = null;
        activeVariables = {};
      }
      renderSelector();
      renderList();
    } catch (err) {
      console.error('Failed to load environments:', err);
    }
  }

  function parseActiveVariables() {
    activeVariables = {};
    const env = environments.find(e => e.id === activeEnvId);
    if (env && env.variables) {
      try {
        const vars = JSON.parse(env.variables);
        if (Array.isArray(vars)) {
          vars.forEach(v => {
            if (v.key) activeVariables[v.key] = v.value || '';
          });
        } else if (typeof vars === 'object') {
          activeVariables = vars;
        }
      } catch(e) {}
    }
  }

  function renderSelector() {
    const el = document.getElementById('env-selector-text');
    if (!el) return;
    
    const activeEnv = environments.find(e => e.id === activeEnvId);
    if (activeEnv) {
      el.textContent = activeEnv.name;
      el.classList.add('topbar__env-active');
    } else {
      el.textContent = 'No Environment';
      el.classList.remove('topbar__env-active');
    }
  }

  function toggleDropdown() {
    const dropdown = document.getElementById('env-dropdown');
    if (dropdown.classList.contains('hidden')) {
      renderEnvDropdown();
      dropdown.classList.remove('hidden');
      setTimeout(() => {
        document.addEventListener('click', () => dropdown.classList.add('hidden'), { once: true });
      }, 10);
    } else {
      dropdown.classList.add('hidden');
    }
  }

  function renderEnvDropdown() {
    const dropdown = document.getElementById('env-dropdown');
    dropdown.innerHTML = `
      <div class="dropdown__header">Environments</div>
      <button class="dropdown__item ${!activeEnvId ? 'dropdown__item--active' : ''}" 
              onclick="Environments.select(null); event.stopPropagation();">
        🚫 No Environment
      </button>
      ${environments.map(env => `
        <button class="dropdown__item ${env.id === activeEnvId ? 'dropdown__item--active' : ''}" 
                onclick="Environments.select(${env.id}); event.stopPropagation();">
          🌐 ${escapeHtml(env.name)}
        </button>
      `).join('')}
      <div class="dropdown__divider"></div>
      <button class="dropdown__item" onclick="Environments.showCreateModal(); event.stopPropagation();">
        ＋ New Environment
      </button>
      <button class="dropdown__item" onclick="Environments.showManagePanel(); event.stopPropagation();">
        ⚙️ Manage Environments
      </button>
    `;
  }

  function select(envId) {
    activeEnvId = envId;
    if (envId) {
      localStorage.setItem('pm_env', envId);
    } else {
      localStorage.removeItem('pm_env');
    }
    parseActiveVariables();
    renderSelector();
    document.getElementById('env-dropdown').classList.add('hidden');
    Toast.show(envId ? 'Environment activated' : 'Environment cleared', 'info');
  }

  function replaceVariables(text) {
    if (!text || typeof text !== 'string') return text;
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return activeVariables[key] !== undefined ? activeVariables[key] : match;
    });
  }

  function renderList() {
    const listEl = document.getElementById('env-list');
    if (!listEl) return;

    if (environments.length === 0) {
      listEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">🌐</div>
          <div class="empty-state__text">No environments</div>
          <button class="btn btn--primary btn--sm" onclick="Environments.showCreateModal()">Create Environment</button>
        </div>
      `;
      return;
    }

    listEl.innerHTML = environments.map(env => `
      <div class="history-item" onclick="Environments.showEditModal(${env.id})">
        <span style="font-size: 14px;">${env.id === activeEnvId ? '🟢' : '⚪'}</span>
        <span class="history-item__url">${escapeHtml(env.name)}</span>
        <button class="kv-remove-btn" onclick="event.stopPropagation(); Environments.remove(${env.id})">×</button>
      </div>
    `).join('');
  }

  function showCreateModal() {
    document.getElementById('env-dropdown')?.classList.add('hidden');
    const modal = document.getElementById('env-modal');
    document.getElementById('env-modal-title').textContent = 'New Environment';
    document.getElementById('env-edit-id').value = '';
    document.getElementById('env-edit-name').value = '';
    renderEnvVarsEditor([{ key: '', value: '' }]);
    modal.classList.remove('modal-overlay--hidden');
  }

  async function showEditModal(envId) {
    try {
      const env = await API.environments.getById(envId);
      const modal = document.getElementById('env-modal');
      document.getElementById('env-modal-title').textContent = 'Edit Environment';
      document.getElementById('env-edit-id').value = envId;
      document.getElementById('env-edit-name').value = env.name;

      let vars = [];
      try { vars = JSON.parse(env.variables); } catch(e) {}
      if (!Array.isArray(vars)) {
        vars = Object.entries(vars).map(([key, value]) => ({ key, value }));
      }
      if (vars.length === 0) vars = [{ key: '', value: '' }];

      renderEnvVarsEditor(vars);
      modal.classList.remove('modal-overlay--hidden');
    } catch (err) {
      Toast.show('Failed to load environment', 'error');
    }
  }

  function renderEnvVarsEditor(vars) {
    const tbody = document.getElementById('env-vars-body');
    if (!tbody) return;
    tbody.innerHTML = vars.map(v => `
      <tr>
        <td><input type="text" placeholder="VARIABLE_NAME" value="${escapeHtml(v.key || '')}"></td>
        <td><input type="text" placeholder="value" value="${escapeHtml(v.value || '')}"></td>
        <td class="kv-table__action"><button class="kv-remove-btn" onclick="this.closest('tr').remove()">×</button></td>
      </tr>
    `).join('');
  }

  function addEnvVar() {
    const tbody = document.getElementById('env-vars-body');
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><input type="text" placeholder="VARIABLE_NAME"></td>
      <td><input type="text" placeholder="value"></td>
      <td class="kv-table__action"><button class="kv-remove-btn" onclick="this.closest('tr').remove()">×</button></td>
    `;
    tbody.appendChild(row);
  }

  async function saveEnvironment() {
    const envId = document.getElementById('env-edit-id').value;
    const name = document.getElementById('env-edit-name').value.trim();
    if (!name) return;

    // Collect variables
    const tbody = document.getElementById('env-vars-body');
    const vars = [];
    tbody.querySelectorAll('tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length >= 2 && inputs[0].value.trim()) {
        vars.push({ key: inputs[0].value.trim(), value: inputs[1].value.trim() });
      }
    });

    try {
      if (envId) {
        await API.environments.update(parseInt(envId), { name, variables: JSON.stringify(vars) });
      } else {
        await API.environments.create({
          name,
          variables: JSON.stringify(vars),
          workspaceId: Workspace.getActiveId()
        });
      }
      await load(Workspace.getActiveId());
      document.getElementById('env-modal').classList.add('modal-overlay--hidden');
      Toast.show('Environment saved', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  async function remove(envId) {
    if (!confirm('Delete this environment?')) return;
    try {
      await API.environments.delete(envId);
      if (activeEnvId === envId) {
        activeEnvId = null;
        activeVariables = {};
        localStorage.removeItem('pm_env');
      }
      await load(Workspace.getActiveId());
      Toast.show('Environment deleted', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  function showManagePanel() {
    document.getElementById('env-dropdown')?.classList.add('hidden');
    // Switch sidebar to environments tab
    switchSidebarTab('environments');
  }

  return {
    load, select, replaceVariables, toggleDropdown,
    showCreateModal, showEditModal, saveEnvironment, remove,
    addEnvVar, showManagePanel, renderList
  };
})();

window.Environments = Environments;
