/**
 * LeadLens API client — connects the React frontend to the FastAPI backend.
 * Base URL is picked from VITE_API_URL env var, defaulting to http://localhost:8000
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, options);
  if (!res.ok) {
    let errMsg = `API error ${res.status}`;
    try {
      const body = await res.json();
      errMsg = body.detail || body.message || errMsg;
    } catch (_) {}
    throw new Error(errMsg);
  }
  return res.json();
}

/** GET /api/health */
export function fetchHealth() {
  return request('/api/health');
}

/** GET /api/calls — returns list of all call records */
export function fetchCalls() {
  return request('/api/calls');
}

/** GET /api/calls/:id */
export function fetchCall(callId) {
  return request(`/api/calls/${callId}`);
}

/** POST /api/calls/:id/analyze — triggers transcription + Gemini + scoring */
export function analyzeCall(callId) {
  return request(`/api/calls/${callId}/analyze`, { method: 'POST' });
}

/** POST /api/calls/analyze-all */
export function analyzeAllCalls() {
  return request('/api/calls/analyze-all', { method: 'POST' });
}

/**
 * GET /api/calls/:id/report — returns PDF blob
 * Use this URL directly as an anchor href to trigger browser download.
 */
export function getReportDownloadUrl(callId) {
  return `${BASE_URL}/api/calls/${callId}/report`;
}

/** GET /api/calls/:id/audio — audio streaming URL for HTML5 <audio> */
export function getAudioStreamUrl(callId) {
  return `${BASE_URL}/api/calls/${callId}/audio`;
}
