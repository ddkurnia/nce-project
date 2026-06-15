import { API_BASE_URL } from './config.js';

async function request(method, endpoint, data = null, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };

  // Get auth token
  try {
    const raw = localStorage.getItem('nce_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    }
  } catch {}

  const config = {
    method,
    headers,
    ...options,
  };

  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Terjadi kesalahan' }));
      throw new Error(error.message || `Error ${response.status}`);
    }

    if (response.status === 204) return null;
    return await response.json();
  } catch (err) {
    console.error(`API ${method} ${endpoint}:`, err.message);
    throw err;
  }
}

export async function get(endpoint, params = {}) {
  const query = new URLSearchParams(params).toString();
  const url = query ? `${endpoint}?${query}` : endpoint;
  return request('GET', url);
}

export async function post(endpoint, data) {
  return request('POST', endpoint, data);
}

export async function put(endpoint, data) {
  return request('PUT', endpoint, data);
}

export async function del(endpoint) {
  return request('DELETE', endpoint);
}

export async function upload(endpoint, formData) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {};

  try {
    const raw = localStorage.getItem('nce_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    }
  } catch {}

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Upload gagal' }));
    throw new Error(error.message || `Error ${response.status}`);
  }

  return await response.json();
}
