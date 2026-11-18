const BASE_URL = '/api';

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const demoRole = localStorage.getItem('demoRole');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (demoRole) {
    headers['x-demo-role'] = demoRole;
    headers['x-demo-email'] = localStorage.getItem('demoEmail') || `${demoRole}@academy.dev`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg = data && data.message ? data.message : `API Error: ${response.status} ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data;
}

export const authApi = {
  login: (email, password) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (payload) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  addMember: (payload) => apiFetch('/auth/add-member', { method: 'POST', body: JSON.stringify(payload) }),
  removeMember: (id) => apiFetch(`/auth/team/${id}`, { method: 'DELETE' }),
  getMe: () => apiFetch('/auth/me'),
  getTeam: () => apiFetch('/auth/team'),
  createInvite: (payload) => apiFetch('/auth/invite', { method: 'POST', body: JSON.stringify(payload) }),
  getInvites: () => apiFetch('/auth/invites'),
  verifyInvite: (code) => apiFetch(`/auth/verify-invite/${code}`),
};

export const batchApi = {
  getAll: () => apiFetch('/batches'),
  getById: (id) => apiFetch(`/batches/${id}`),
  create: (data) => apiFetch('/batches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/batches/${id}`, { method: 'DELETE' }),
};

export const studentApi = {
  getByBatch: (batchId) => apiFetch(`/students?batchId=${batchId}`),
  create: (data) => apiFetch('/students', { method: 'POST', body: JSON.stringify(data) }),
  bulkCreate: (batchId, students) => apiFetch('/students/bulk', { method: 'POST', body: JSON.stringify({ batchId, students }) }),
  update: (id, data) => apiFetch(`/students/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/students/${id}`, { method: 'DELETE' }),
};

export const progressApi = {
  getLogs: (batchId, month) => {
    let url = `/progress?batchId=${batchId || 'all'}`;
    if (month) url += `&month=${month}`;
    return apiFetch(url);
  },
  createOrUpdate: (data) => apiFetch('/progress', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/progress/${id}`, { method: 'DELETE' }),
};

export const attendanceApi = {
  getByDate: (batchId, date) => apiFetch(`/attendance?batchId=${batchId}&date=${date}`),
  mark: (data) => apiFetch('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getSummary: (batchId, month) => {
    let url = `/attendance/summary?batchId=${batchId}`;
    if (month) url += `&month=${month}`;
    return apiFetch(url);
  },
};

export const eventApi = {
  getAll: (batchId, month) => {
    let url = `/events?batchId=${batchId || 'all'}`;
    if (month) url += `&month=${month}`;
    return apiFetch(url);
  },
  create: (data) => apiFetch('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiFetch(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiFetch(`/events/${id}`, { method: 'DELETE' }),
};

export const reportApi = {
  getMonthly: (batchId, month) => apiFetch(`/reports/monthly?batchId=${batchId}&month=${month}`),
  getMonthEndStatus: () => apiFetch('/reports/month-end-status'),
  getHealth: () => apiFetch('/health'),
};
