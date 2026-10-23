// REST API 封装。base 走同源 /api/v1（dev 由 vite proxy 转发到 127.0.0.1:16801）

let authToken = ''

export function setAuthToken(token) {
  authToken = token || ''
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`
  const resp = await fetch(`/api/v1${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  })
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`
    try {
      const data = await resp.json()
      if (data && (data.error || data.message)) msg = data.error || data.message
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  if (resp.status === 204) return null
  return resp.json()
}

export const api = {
  health: () => request('GET', '/health'),
  resolve: (url, headers) => request('POST', '/resolve', { url, headers }),
  createTask: (payload) => request('POST', '/tasks', payload),
  getTasks: (status = 'all') => request('GET', `/tasks?status=${status}`),
  getTask: (engine, id) => request('GET', `/tasks/${engine}/${encodeURIComponent(id)}`),
  taskAction: (engine, id, action, deleteFiles = false) =>
    request('POST', `/tasks/${engine}/${encodeURIComponent(id)}/action`, { action, deleteFiles }),
  pauseAll: () => request('POST', '/tasks/pause-all'),
  resumeAll: () => request('POST', '/tasks/resume-all'),
  getStats: () => request('GET', '/stats'),
  getSettings: () => request('GET', '/settings'),
  saveSettings: (patch) => request('PUT', '/settings', patch),
  updateTrackers: () => request('POST', '/trackers/update'),
  regenerateSecret: () => request('POST', '/settings/regenerate-secret'),
  applySpeedProfile: (index) => request('POST', '/speed-profiles/apply', { index }),
  testWebhook: (url) => request('POST', '/hooks/test', { url }),
  reveal: (path) => request('POST', '/reveal', { path })
}
