const URL = import.meta.env.VITE_PROWLARR_URL;
const KEY = import.meta.env.VITE_PROWLARR_KEY;

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
    console.error(`Prowlarr API Error (${endpoint}):`, error);
    return { error: true, message: error.message };
  }
}

export async function getSystemStatus() {
  return await apiFetch('/api/v1/system/status');
}

export async function getIndexers() {
  return await apiFetch('/api/v1/indexer');
}

export async function getIndexerStats() {
  return await apiFetch('/api/v1/indexerstats');
}

export async function getHistory() {
  return await apiFetch('/api/v1/history?pageSize=20');
}
