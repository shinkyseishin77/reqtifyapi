/**
 * Request Builder Module - URL bar, params, headers, auth, body
 */
const RequestBuilder = (() => {
  let reqEditor = null;

  function initEditor() {
    const textarea = document.getElementById('req-body-editor');
    if (textarea && !reqEditor) {
      reqEditor = CodeMirror.fromTextArea(textarea, {
        mode: 'application/json',
        theme: 'darcula',
        lineNumbers: true,
        tabSize: 2,
        lineWrapping: true,
        autoCloseBrackets: true,
        matchBrackets: true,
      });
      reqEditor.on('change', () => Tabs.markUnsaved());
    }
  }

  function getEditor() {
    return reqEditor;
  }

  function clear() {
    document.getElementById('req-method').value = 'GET';
    document.getElementById('req-url').value = '';
    renderKVTable('params-table-body', []);
    renderKVTable('headers-table-body', []);
    document.getElementById('auth-type-select').value = 'none';
    updateAuthFields('none');
    if (reqEditor) reqEditor.setValue('');
  }

  function loadFromTab(tab) {
    document.getElementById('req-method').value = tab.method;
    document.getElementById('req-url').value = tab.url;

    // Update method color
    updateMethodColor();

    // Params
    renderKVTable('params-table-body', tab.params.length ? tab.params : [{ key: '', value: '', enabled: true }]);

    // Headers
    renderKVTable('headers-table-body', tab.headers.length ? tab.headers : [{ key: '', value: '', enabled: true }]);

    // Auth
    document.getElementById('auth-type-select').value = tab.authType;
    updateAuthFields(tab.authType);
    if (tab.authType === 'bearer') {
      document.getElementById('auth-bearer-token').value = tab.authToken || '';
    } else if (tab.authType === 'basic') {
      document.getElementById('auth-basic-user').value = tab.authUsername || '';
      document.getElementById('auth-basic-pass').value = tab.authPassword || '';
    }

    // Body
    if (reqEditor) {
      reqEditor.setValue(tab.body || '');
      setTimeout(() => reqEditor.refresh(), 10);
    }

    // Set active config tab 
    switchConfigTab('params');
  }

  function saveToTab(tab) {
    tab.method = document.getElementById('req-method').value;
    tab.url = document.getElementById('req-url').value;
    tab.params = collectKVTable('params-table-body');
    tab.headers = collectKVTable('headers-table-body');
    tab.authType = document.getElementById('auth-type-select').value;
    if (tab.authType === 'bearer') {
      tab.authToken = document.getElementById('auth-bearer-token').value;
    } else if (tab.authType === 'basic') {
      tab.authUsername = document.getElementById('auth-basic-user').value;
      tab.authPassword = document.getElementById('auth-basic-pass').value;
    }
    tab.body = reqEditor ? reqEditor.getValue() : '';
  }

  function renderKVTable(tbodyId, items) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;

    if (!items || items.length === 0) {
      items = [{ key: '', value: '', enabled: true }];
    }

    tbody.innerHTML = items.map((item, i) => `
      <tr>
        <td class="kv-table__check"><input type="checkbox" ${item.enabled !== false ? 'checked' : ''} onchange="Tabs.markUnsaved()"></td>
        <td><input type="text" placeholder="Key" value="${escapeHtml(item.key || '')}" onchange="Tabs.markUnsaved()"></td>
        <td><input type="text" placeholder="Value" value="${escapeHtml(item.value || '')}" onchange="Tabs.markUnsaved()"></td>
        <td class="kv-table__action"><button class="kv-remove-btn" onclick="this.closest('tr').remove(); Tabs.markUnsaved();">×</button></td>
      </tr>
    `).join('');
  }

  function addKVRow(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="kv-table__check"><input type="checkbox" checked></td>
      <td><input type="text" placeholder="Key" onchange="Tabs.markUnsaved()"></td>
      <td><input type="text" placeholder="Value" onchange="Tabs.markUnsaved()"></td>
      <td class="kv-table__action"><button class="kv-remove-btn" onclick="this.closest('tr').remove(); Tabs.markUnsaved();">×</button></td>
    `;
    tbody.appendChild(row);
  }

  function collectKVTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return [];
    const rows = [];
    tbody.querySelectorAll('tr').forEach(tr => {
      const inputs = tr.querySelectorAll('input');
      if (inputs.length >= 3) {
        rows.push({
          enabled: inputs[0].checked,
          key: inputs[1].value.trim(),
          value: inputs[2].value.trim(),
        });
      }
    });
    return rows;
  }

  function updateAuthFields(type) {
    document.getElementById('auth-bearer-fields').classList.toggle('hidden', type !== 'bearer');
    document.getElementById('auth-basic-fields').classList.toggle('hidden', type !== 'basic');
  }

  function updateMethodColor() {
    const select = document.getElementById('req-method');
    const method = select.value.toLowerCase();
    select.style.color = `var(--method-${method})`;
  }

  function switchConfigTab(tabName) {
    document.querySelectorAll('.config-tab').forEach(t => {
      t.classList.toggle('config-tab--active', t.dataset.tab === tabName);
    });
    document.querySelectorAll('.config-panel').forEach(p => {
      p.classList.toggle('config-panel--active', p.id === `config-${tabName}`);
    });
    if (tabName === 'body' && reqEditor) {
      setTimeout(() => reqEditor.refresh(), 10);
    }
  }

  async function sendRequest() {
    const btn = document.getElementById('btn-send');
    const method = document.getElementById('req-method').value;
    let url = document.getElementById('req-url').value.trim();

    if (!url) {
      Toast.show('Please enter a URL', 'error');
      return;
    }

    // Apply environment variables
    url = Environments.replaceVariables(url);

    // Collect headers
    const headersArr = collectKVTable('headers-table-body').filter(h => h.enabled && h.key);
    const headers = {};
    headersArr.forEach(h => {
      headers[Environments.replaceVariables(h.key)] = Environments.replaceVariables(h.value);
    });

    // Collect params and add to URL
    const paramsArr = collectKVTable('params-table-body').filter(p => p.enabled && p.key);
    if (paramsArr.length > 0) {
      const urlObj = new URLSearchParams();
      paramsArr.forEach(p => urlObj.append(
        Environments.replaceVariables(p.key),
        Environments.replaceVariables(p.value)
      ));
      url += (url.includes('?') ? '&' : '?') + urlObj.toString();
    }

    // Auth
    let auth = null;
    const authType = document.getElementById('auth-type-select').value;
    if (authType === 'bearer') {
      auth = { type: 'bearer', token: Environments.replaceVariables(document.getElementById('auth-bearer-token').value) };
    } else if (authType === 'basic') {
      auth = {
        type: 'basic',
        username: document.getElementById('auth-basic-user').value,
        password: document.getElementById('auth-basic-pass').value
      };
    }

    // Body
    let body = null;
    if (method !== 'GET' && method !== 'HEAD') {
      const raw = reqEditor ? reqEditor.getValue() : '';
      if (raw) {
        body = Environments.replaceVariables(raw);
        try {
          body = JSON.parse(body);
          if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
        } catch(e) {
          if (!headers['Content-Type']) headers['Content-Type'] = 'text/plain';
        }
      }
    }

    // Send
    btn.disabled = true;
    btn.textContent = 'Sending...';
    ResponseViewer.showLoading();

    try {
      const result = await API.proxy.send({
        method, url, headers, body, auth,
        workspaceId: Workspace.getActiveId()
      });

      const responseData = {
        status: result.status,
        statusText: result.statusText || '',
        time: result.time,
        size: result.size,
        data: result.data,
        headers: result.headers || {},
      };

      Tabs.setResponse(responseData);
      ResponseViewer.display(responseData);
      // Refresh history in sidebar
      History.load(Workspace.getActiveId());
    } catch (err) {
      ResponseViewer.displayError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Send';
    }
  }

  async function saveRequest() {
    const tab = Tabs.getActiveTab();
    if (!tab) return;

    // Save current state to tab
    saveToTab(tab);

    if (tab.savedRequestId) {
      // Update existing
      try {
        await API.requests.update(tab.savedRequestId, {
          name: tab.name,
          method: tab.method,
          url: tab.url,
          query: JSON.stringify(tab.params),
          headers: JSON.stringify(tab.headers),
          body: tab.body,
          bodyType: tab.bodyType || 'raw',
          auth: JSON.stringify({ type: tab.authType, token: tab.authToken, username: tab.authUsername, password: tab.authPassword }),
        });
        Tabs.markSaved(tab.savedRequestId, tab.collectionId);
        Collections.load(Workspace.getActiveId());
        Toast.show('Request saved', 'success');
      } catch (err) {
        Toast.show(err.message, 'error');
      }
    } else {
      // Show save modal to pick collection
      showSaveModal();
    }
  }

  function showSaveModal() {
    const tab = Tabs.getActiveTab();
    const modal = document.getElementById('save-request-modal');
    document.getElementById('save-req-name').value = tab?.name || 'Untitled Request';
    document.getElementById('save-req-mode').value = 'save-current';

    // Populate collection select
    const select = document.getElementById('save-req-collection-select');
    const cols = Collections.getCollections();
    select.innerHTML = cols.map(c =>
      `<option value="${c.id}">${escapeHtml(c.name)}</option>`
    ).join('');

    if (tab?.collectionId) {
      select.value = tab.collectionId;
    }

    modal.classList.remove('modal-overlay--hidden');
  }

  async function confirmSaveRequest() {
    const tab = Tabs.getActiveTab();
    if (!tab) return;

    saveToTab(tab);

    const name = document.getElementById('save-req-name').value.trim() || 'Untitled Request';
    const collectionId = parseInt(document.getElementById('save-req-collection-select').value || document.getElementById('save-req-collection-id').value);
    const mode = document.getElementById('save-req-mode').value;

    if (!collectionId) {
      Toast.show('Please select a collection', 'error');
      return;
    }

    try {
      const data = {
        name,
        method: mode === 'new-blank' ? 'GET' : tab.method,
        url: mode === 'new-blank' ? '' : tab.url,
        query: mode === 'new-blank' ? '[]' : JSON.stringify(tab.params),
        headers: mode === 'new-blank' ? '[]' : JSON.stringify(tab.headers),
        body: mode === 'new-blank' ? '' : tab.body,
        bodyType: tab.bodyType || 'raw',
        auth: JSON.stringify({ type: tab.authType, token: tab.authToken, username: tab.authUsername, password: tab.authPassword }),
        collectionId,
      };

      const saved = await API.requests.create(data);
      tab.name = name;
      Tabs.markSaved(saved.id, collectionId);
      Tabs.updateActiveTabName(name, tab.method);
      Collections.load(Workspace.getActiveId());
      document.getElementById('save-request-modal').classList.add('modal-overlay--hidden');
      Toast.show('Request saved', 'success');
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }

  return {
    initEditor, getEditor, clear, loadFromTab, saveToTab,
    renderKVTable, addKVRow, collectKVTable,
    updateAuthFields, updateMethodColor, switchConfigTab,
    sendRequest, saveRequest, showSaveModal, confirmSaveRequest
  };
})();

window.RequestBuilder = RequestBuilder;
