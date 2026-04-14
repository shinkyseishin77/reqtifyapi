/**
 * API Service Layer - Centralized API client
 * All HTTP calls go through here.
 */
const API = (() => {
  const BASE = '/api';

  function getToken() {
    return localStorage.getItem('pm_token');
  }

  function authHeaders() {
    const token = getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  async function request(method, path, data = null) {
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders()
      }
    };
    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    let url = BASE + path;
    if (data && method === 'GET') {
      const params = new URLSearchParams(data).toString();
      if (params) url += '?' + params;
    }

    const res = await fetch(url, config);
    const json = await res.json();

    if (res.status === 401) {
      localStorage.removeItem('pm_token');
      window.dispatchEvent(new Event('auth:required'));
      throw new Error('Session expired');
    }

    if (!res.ok) {
      throw new Error(json.message || `HTTP ${res.status}`);
    }

    return json.data;
  }

  return {
    auth: {
      login: (email, password) => request('POST', '/auth/login', { email, password }),
      register: (email, password, name) => request('POST', '/auth/register', { email, password, name }),
    },
    workspaces: {
      list: () => request('GET', '/workspaces'),
      create: (data) => request('POST', '/workspaces', data),
      getById: (id) => request('GET', `/workspaces/${id}`),
      update: (id, data) => request('PUT', `/workspaces/${id}`, data),
      delete: (id) => request('DELETE', `/workspaces/${id}`),
      addMember: (id, data) => request('POST', `/workspaces/${id}/members`, data),
    },
    collections: {
      listByWorkspace: (wsId) => request('GET', `/collections/workspace/${wsId}`),
      create: (data) => request('POST', '/collections', data),
      getById: (id) => request('GET', `/collections/${id}`),
      update: (id, data) => request('PUT', `/collections/${id}`, data),
      delete: (id) => request('DELETE', `/collections/${id}`),
    },
    requests: {
      create: (data) => request('POST', '/requests', data),
      getById: (id) => request('GET', `/requests/${id}`),
      update: (id, data) => request('PUT', `/requests/${id}`, data),
      delete: (id) => request('DELETE', `/requests/${id}`),
    },
    environments: {
      listByWorkspace: (wsId) => request('GET', `/environments/workspace/${wsId}`),
      create: (data) => request('POST', '/environments', data),
      getById: (id) => request('GET', `/environments/${id}`),
      update: (id, data) => request('PUT', `/environments/${id}`, data),
      delete: (id) => request('DELETE', `/environments/${id}`),
    },
    history: {
      list: (params) => request('GET', '/history' + (params ? '?' + new URLSearchParams(params).toString() : ''), null),
      delete: (id) => request('DELETE', `/history/${id}`),
      clear: (wsId) => request('DELETE', `/history/clear/${wsId}`),
    },
    proxy: {
      send: (config) => request('POST', '/proxy/send', config),
    }
  };
})();

// Make it globally available
window.API = API;
