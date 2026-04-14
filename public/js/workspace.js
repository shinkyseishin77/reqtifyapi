/**
 * Workspace Module - Workspace selection, management, and member collaboration
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
    const user = Auth.getUser();

    dropdown.innerHTML = `
      <div class="dropdown__header">Workspaces</div>
      ${workspaces.map(ws => {
        // Find current user's role in this workspace
        const myMembership = ws.members?.find(m => m.user?.id === user?.id || m.userId === user?.id);
        const roleLabel = myMembership ? ` (${myMembership.role})` : '';
        return `
          <button class="dropdown__item ${ws.id === activeWorkspace?.id ? 'dropdown__item--active' : ''}" 
                  onclick="Workspace.select(${ws.id}); event.stopPropagation();">
            📁 ${escapeHtml(ws.name)}<span style="color:var(--text-muted); font-size:10px; margin-left:4px;">${roleLabel}</span>
          </button>
        `;
      }).join('')}
      <div class="dropdown__divider"></div>
      <button class="dropdown__item" onclick="Workspace.showCreateModal(); event.stopPropagation();">
        ＋ New Workspace
      </button>
      ${activeWorkspace ? `
        <button class="dropdown__item" onclick="Workspace.showMembersModal(); event.stopPropagation();">
          👥 Manage Members
        </button>
        <button class="dropdown__item" onclick="Workspace.showEditModal(); event.stopPropagation();">
          ✏️ Edit Workspace
        </button>
      ` : ''}
    `;
  }

  async function select(id) {
    // Reload workspace detail to get fresh member list
    try {
      const detail = await API.workspaces.getById(id);
      const idx = workspaces.findIndex(w => w.id === id);
      if (idx !== -1) workspaces[idx] = { ...workspaces[idx], ...detail };
      activeWorkspace = workspaces[idx] || detail;
    } catch (err) {
      activeWorkspace = workspaces.find(w => w.id === id);
    }

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

  // ── Create Workspace ──
  function showCreateModal() {
    closeDropdown();
    const modal = document.getElementById('workspace-modal');
    document.getElementById('workspace-modal-title').textContent = 'New Workspace';
    document.getElementById('ws-name').value = '';
    document.getElementById('ws-desc').value = '';
    document.getElementById('ws-edit-id').value = '';
    modal.classList.remove('modal-overlay--hidden');
  }

  // ── Edit Workspace ──
  function showEditModal() {
    closeDropdown();
    if (!activeWorkspace) return;
    const modal = document.getElementById('workspace-modal');
    document.getElementById('workspace-modal-title').textContent = 'Edit Workspace';
    document.getElementById('ws-name').value = activeWorkspace.name || '';
    document.getElementById('ws-desc').value = activeWorkspace.description || '';
    document.getElementById('ws-edit-id').value = activeWorkspace.id;
    modal.classList.remove('modal-overlay--hidden');
  }

  function hideCreateModal() {
    document.getElementById('workspace-modal').classList.add('modal-overlay--hidden');
  }

  async function saveWorkspace() {
    const name = document.getElementById('ws-name').value.trim();
    const description = document.getElementById('ws-desc').value.trim();
    const editId = document.getElementById('ws-edit-id').value;
    if (!name) return;

    try {
      if (editId) {
        // Update existing
        const updated = await API.workspaces.update(parseInt(editId), { name, description });
        const idx = workspaces.findIndex(w => w.id === parseInt(editId));
        if (idx !== -1) workspaces[idx] = { ...workspaces[idx], ...updated };
        if (activeWorkspace?.id === parseInt(editId)) {
          activeWorkspace = workspaces[idx];
        }
        renderSelector();
        hideCreateModal();
        Toast.show('Workspace updated', 'success');
      } else {
        // Create new
        const ws = await API.workspaces.create({ name, description });
        workspaces.push(ws);
        await select(ws.id);
        hideCreateModal();
        Toast.show('Workspace created', 'success');
      }
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  // ── Members Management ──
  function showMembersModal() {
    closeDropdown();
    if (!activeWorkspace) return;
    const modal = document.getElementById('members-modal');
    document.getElementById('members-ws-name').textContent = activeWorkspace.name;
    document.getElementById('invite-email').value = '';
    document.getElementById('invite-role').value = 'viewer';
    renderMembersList();
    modal.classList.remove('modal-overlay--hidden');
  }

  function hideMembersModal() {
    document.getElementById('members-modal').classList.add('modal-overlay--hidden');
  }

  function renderMembersList() {
    const tbody = document.getElementById('members-list');
    if (!tbody) return;

    const members = activeWorkspace?.members || [];
    const user = Auth.getUser();

    if (members.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; padding:16px; color:var(--text-muted);">No members loaded</td></tr>`;
      return;
    }

    tbody.innerHTML = members.map(m => {
      const memberUser = m.user || {};
      const isMe = memberUser.id === user?.id;
      const isOwner = m.role === 'owner';

      return `
        <tr>
          <td style="padding:8px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:28px; height:28px; border-radius:50%; background:linear-gradient(135deg, var(--accent-primary), var(--accent-secondary)); display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:600; color:white;">
                ${(memberUser.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div style="font-size:12px; font-weight:500;">${escapeHtml(memberUser.name || 'Unknown')} ${isMe ? '<span style="color:var(--accent-primary);">(You)</span>' : ''}</div>
                <div style="font-size:11px; color:var(--text-muted);">${escapeHtml(memberUser.email || '')}</div>
              </div>
            </div>
          </td>
          <td style="padding:8px;">
            ${isOwner ? `<span style="padding:2px 8px; background:rgba(124,92,252,0.15); color:var(--accent-primary); border-radius:4px; font-size:11px; font-weight:600;">Owner</span>` 
            : `<select class="form-input" style="padding:4px 8px; font-size:11px; width:auto;" 
                       onchange="Workspace.updateMemberRole(${memberUser.id}, this.value)" ${isMe ? 'disabled' : ''}>
                 <option value="editor" ${m.role === 'editor' ? 'selected' : ''}>Editor</option>
                 <option value="viewer" ${m.role === 'viewer' ? 'selected' : ''}>Viewer</option>
               </select>`}
          </td>
          <td style="padding:8px; text-align:center;">
            ${!isOwner && !isMe ? `<button class="btn btn--danger btn--sm" onclick="Workspace.removeMember(${memberUser.id})">Remove</button>` : ''}
          </td>
        </tr>
      `;
    }).join('');
  }

  // ── Email Autocomplete ──
  let searchTimeout = null;

  function initAutocomplete() {
    const input = document.getElementById('invite-email');
    if (!input) return;

    input.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const q = input.value.trim();
      if (q.length < 2) {
        hideAutocomplete();
        return;
      }
      searchTimeout = setTimeout(() => searchUsers(q), 300);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') hideAutocomplete();
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#invite-autocomplete') && e.target.id !== 'invite-email') {
        hideAutocomplete();
      }
    });
  }

  async function searchUsers(query) {
    try {
      const users = await API.auth.searchUsers(query);
      renderAutocomplete(users);
    } catch(e) {
      hideAutocomplete();
    }
  }

  function renderAutocomplete(users) {
    let container = document.getElementById('invite-autocomplete');
    if (!container) {
      container = document.createElement('div');
      container.id = 'invite-autocomplete';
      container.className = 'autocomplete-dropdown';
      const parent = document.getElementById('invite-email').parentElement;
      parent.style.position = 'relative';
      parent.appendChild(container);
    }

    if (!users || users.length === 0) {
      container.innerHTML = '<div class="autocomplete-dropdown__empty">No users found</div>';
      container.classList.remove('hidden');
      return;
    }

    container.innerHTML = users.map(u => `
      <button class="autocomplete-dropdown__item" onclick="Workspace.selectUser('${escapeHtml(u.email)}'); event.preventDefault();">
        <div class="autocomplete-dropdown__avatar">${(u.name || 'U')[0].toUpperCase()}</div>
        <div>
          <div class="autocomplete-dropdown__name">${escapeHtml(u.name)}</div>
          <div class="autocomplete-dropdown__email">${escapeHtml(u.email)}</div>
        </div>
      </button>
    `).join('');
    container.classList.remove('hidden');
  }

  function hideAutocomplete() {
    const container = document.getElementById('invite-autocomplete');
    if (container) container.classList.add('hidden');
  }

  function selectUser(email) {
    document.getElementById('invite-email').value = email;
    hideAutocomplete();
  }

  async function inviteMember() {
    const email = document.getElementById('invite-email').value.trim();
    const role = document.getElementById('invite-role').value;
    
    if (!email) {
      Toast.show('Please enter an email address', 'error');
      return;
    }

    try {
      await API.workspaces.addMember(activeWorkspace.id, { email, role });
      const detail = await API.workspaces.getById(activeWorkspace.id);
      const idx = workspaces.findIndex(w => w.id === activeWorkspace.id);
      if (idx !== -1) workspaces[idx] = { ...workspaces[idx], ...detail };
      activeWorkspace = workspaces[idx];

      document.getElementById('invite-email').value = '';
      hideAutocomplete();
      renderMembersList();
      Toast.show(`Invited ${email} as ${role}`, 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  async function updateMemberRole(userId, role) {
    try {
      await API.workspaces.updateMemberRole(activeWorkspace.id, { userId, role });
      // Update local data
      const member = activeWorkspace.members?.find(m => (m.user?.id || m.userId) === userId);
      if (member) member.role = role;
      Toast.show('Role updated', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
      renderMembersList(); // revert UI
    }
  }

  async function removeMember(userId) {
    if (!confirm('Remove this member from the workspace?')) return;
    try {
      await API.workspaces.removeMember(activeWorkspace.id, userId);
      // Remove from local data
      if (activeWorkspace.members) {
        activeWorkspace.members = activeWorkspace.members.filter(m => (m.user?.id || m.userId) !== userId);
      }
      renderMembersList();
      Toast.show('Member removed', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  async function deleteWorkspace() {
    if (!activeWorkspace) return;
    if (!confirm(`Delete workspace "${activeWorkspace.name}"? This will delete all collections, requests, and history.`)) return;
    try {
      await API.workspaces.delete(activeWorkspace.id);
      workspaces = workspaces.filter(w => w.id !== activeWorkspace.id);
      if (workspaces.length === 0) {
        const ws = await API.workspaces.create({ name: 'My Workspace', description: 'Default workspace' });
        workspaces = [ws];
      }
      await select(workspaces[0].id);
      hideMembersModal();
      Toast.show('Workspace deleted', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  function getActive() { return activeWorkspace; }
  function getActiveId() { return activeWorkspace?.id; }

  return {
    init, toggleDropdown, select,
    showCreateModal, showEditModal, hideCreateModal, saveWorkspace,
    showMembersModal, hideMembersModal, inviteMember, initAutocomplete, selectUser,
    updateMemberRole, removeMember, deleteWorkspace,
    getActive, getActiveId
  };
})();

window.Workspace = Workspace;
