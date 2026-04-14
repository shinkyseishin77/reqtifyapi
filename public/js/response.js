/**
 * Response Viewer Module - Display response data
 */
const ResponseViewer = (() => {
  let resEditor = null;

  function initEditor() {
    const textarea = document.getElementById('res-body-editor');
    if (textarea && !resEditor) {
      resEditor = CodeMirror.fromTextArea(textarea, {
        mode: 'application/json',
        theme: 'darcula',
        lineNumbers: true,
        readOnly: true,
        lineWrapping: true,
        tabSize: 2,
      });
    }
  }

  function getEditor() {
    return resEditor;
  }

  function showLoading() {
    document.getElementById('response-empty').classList.add('hidden');
    document.getElementById('response-content').classList.remove('hidden');
    document.getElementById('response-meta').classList.add('hidden');
    if (resEditor) {
      resEditor.setValue('Sending request...');
    }
  }

  function display(data) {
    document.getElementById('response-empty').classList.add('hidden');
    document.getElementById('response-content').classList.remove('hidden');
    document.getElementById('response-meta').classList.remove('hidden');

    // Status
    const statusEl = document.getElementById('res-status');
    const statusCode = data.status || 0;
    statusEl.textContent = `${statusCode} ${data.statusText || ''}`;
    statusEl.className = 'response-meta__status';
    if (statusCode >= 400) statusEl.classList.add('response-meta__status--error');
    else if (statusCode >= 300) statusEl.classList.add('response-meta__status--redirect');
    else statusEl.classList.add('response-meta__status--success');

    // Time
    document.getElementById('res-time').textContent = `${data.time || 0} ms`;

    // Size
    document.getElementById('res-size').textContent = formatBytes(data.size || 0);

    // Body
    let bodyText = data.data;
    if (typeof bodyText === 'object') {
      bodyText = JSON.stringify(bodyText, null, 2);
      if (resEditor) resEditor.setOption('mode', 'application/json');
    } else {
      if (resEditor) resEditor.setOption('mode', 'text/plain');
    }

    if (resEditor) {
      resEditor.setValue(bodyText || '');
      setTimeout(() => resEditor.refresh(), 10);
    }

    // Response headers
    renderResponseHeaders(data.headers || {});

    // Switch to body tab
    switchResponseTab('res-body');
  }

  function displayError(message) {
    document.getElementById('response-empty').classList.add('hidden');
    document.getElementById('response-content').classList.remove('hidden');
    document.getElementById('response-meta').classList.add('hidden');

    if (resEditor) {
      resEditor.setOption('mode', 'text/plain');
      resEditor.setValue('Error: ' + message);
    }
  }

  function clear() {
    document.getElementById('response-empty').classList.remove('hidden');
    document.getElementById('response-content').classList.add('hidden');
    document.getElementById('response-meta').classList.add('hidden');
    if (resEditor) resEditor.setValue('');
  }

  function renderResponseHeaders(headers) {
    const container = document.getElementById('res-headers-list');
    if (!container) return;

    if (!headers || Object.keys(headers).length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-state__text">No headers</div></div>';
      return;
    }

    const rows = Object.entries(headers).map(([key, value]) => `
      <tr>
        <td style="padding: 6px 8px; font-weight: 500; color: var(--text-primary);">${escapeHtml(key)}</td>
        <td style="padding: 6px 8px; color: var(--text-secondary); font-family: 'JetBrains Mono', monospace; font-size: 11px;">${escapeHtml(String(value))}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <table class="kv-table">
        <thead><tr><th>Key</th><th>Value</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  function switchResponseTab(tabName) {
    document.querySelectorAll('.response-tab').forEach(t => {
      t.classList.toggle('response-tab--active', t.dataset.tab === tabName);
    });
    document.getElementById('res-body-panel').classList.toggle('hidden', tabName !== 'res-body');
    document.getElementById('res-headers-panel').classList.toggle('hidden', tabName !== 'res-headers');

    if (tabName === 'res-body' && resEditor) {
      setTimeout(() => resEditor.refresh(), 10);
    }
  }

  function copyResponse() {
    if (resEditor) {
      navigator.clipboard.writeText(resEditor.getValue())
        .then(() => Toast.show('Copied to clipboard', 'success'))
        .catch(() => Toast.show('Failed to copy', 'error'));
    }
  }

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  return { initEditor, getEditor, showLoading, display, displayError, clear, switchResponseTab, copyResponse };
})();

window.ResponseViewer = ResponseViewer;
