const URL = import.meta.env.VITE_SONARR_URL;
const KEY = import.meta.env.VITE_SONARR_KEY;

const headers = {
  'X-Api-Key': KEY,
  'Content-Type': 'application/json'
};

async function apiFetch(endpoint, method = 'GET', body = null) {
  try {
    const response = await fetch(`${URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Sonarr API Error (${endpoint}):`, error);
    return { error: true, message: error.message };
  }
}

export async function getSystemStatus() {
  return await apiFetch('/api/v3/system/status');
}

export async function getSeries() {
  return await apiFetch('/api/v3/series');
}

export async function getQueue() {
  return await apiFetch('/api/v3/queue?pageSize=50');
}

export async function getMissing() {
  return await apiFetch('/api/v3/wanted/missing?pageSize=10');
}

export async function getCalendar(start, end) {
  return await apiFetch(`/api/v3/calendar?start=${start}&end=${end}`);
}

export async function getDiskspace() {
  return await apiFetch('/api/v3/diskspace');
}
