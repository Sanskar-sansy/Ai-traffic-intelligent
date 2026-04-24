import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

// ── Traffic Prediction ────────────────────────────────────────────────────────
export const predictTraffic = (data) => api.post('/predict-traffic', data)

// ── Forecast ──────────────────────────────────────────────────────────────────
export const getForecast = (hours = 6) => api.get(`/forecast?hours=${hours}`)

// ── Road Safety ───────────────────────────────────────────────────────────────
export const getRoadSafety = (data) => api.post('/road-safety', data)

// ── Video ─────────────────────────────────────────────────────────────────────
export const uploadVideo = (formData, onProgress) =>
  api.post('/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded / e.total) * 100)),
    timeout: 120000,
  })

export const getDemoAnalysis = () => api.get('/demo-analysis')

export const detectAccident = (params) =>
  api.get('/detect-accident', { params })

// ── Alerts ────────────────────────────────────────────────────────────────────
export const getAlerts = (unreadOnly = false) =>
  api.get(`/alerts?unread_only=${unreadOnly}`)

export const markAlertRead = (id) => api.patch(`/alerts/${id}/read`)
export const clearAlerts   = ()   => api.delete('/alerts/clear')
