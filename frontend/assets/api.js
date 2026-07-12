/* Shared API helper for EcoSphere frontend (Admin / Department / Employee) */

const API_BASE = window.location.hostname && window.location.hostname !== ''
  ? `${window.location.protocol}//${window.location.hostname}:5000/api`
  : 'http://localhost:5000/api';

const UPLOAD_BASE = API_BASE.replace(/\/api$/, '');

function getToken() {
  return localStorage.getItem('ecosphere_token');
}
function setToken(t) {
  localStorage.setItem('ecosphere_token', t);
}
function clearToken() {
  localStorage.removeItem('ecosphere_token');
  localStorage.removeItem('ecosphere_profile');
}
function getProfile() {
  try { return JSON.parse(localStorage.getItem('ecosphere_profile') || 'null'); } catch { return null; }
}
function setProfile(p) {
  localStorage.setItem('ecosphere_profile', JSON.stringify(p));
}

/**
 * Core request helper.
 * @param {string} path - path after /api, e.g. '/admin/departments'
 * @param {object} opts - { method, body, isForm }
 */
async function apiRequest(path, opts = {}) {
  const { method = 'GET', body, isForm = false } = opts;
  const headers = {};
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let fetchBody;
  if (isForm) {
    fetchBody = body; // FormData - browser sets content-type
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, { method, headers, body: fetchBody });
  } catch (networkErr) {
    throw new Error('Cannot reach backend server. Is it running on port 5000?');
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
  }

  if (res.status === 401 || res.status === 403) {
    // token invalid/expired - force re-login on protected portals
    if (path !== '/department/auth/login' && path !== '/employee/auth/login') {
      clearToken();
      const err = new Error((data && data.error) || 'Session expired. Please log in again.');
      err.authError = true;
      throw err;
    }
  }

  if (!res.ok) {
    const message = (data && (data.error || data.message)) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

const api = {
  get: (path) => apiRequest(path, { method: 'GET' }),
  post: (path, body) => apiRequest(path, { method: 'POST', body }),
  put: (path, body) => apiRequest(path, { method: 'PUT', body }),
  patch: (path, body) => apiRequest(path, { method: 'PATCH', body }),
  del: (path) => apiRequest(path, { method: 'DELETE' }),
  postForm: (path, formData) => apiRequest(path, { method: 'POST', body: formData, isForm: true }),
};

function toast(message, type = '') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

function fmtDate(d) {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtNum(n, digits = 1) {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return Number(n).toFixed(digits);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function badgeForStatus(status) {
  const s = (status || '').toLowerCase();
  if (['approved', 'active', 'resolved', 'acknowledged', 'completed'].includes(s)) return 'green';
  if (['pending', 'draft', 'scheduled', 'under review', 'in progress'].includes(s)) return 'amber';
  if (['rejected', 'inactive', 'open', 'at risk'].includes(s)) return 'red';
  return 'grey';
}

function fileUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${UPLOAD_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}
