const BASE_URL = import.meta.env.VITE_PROWLARR_URL;
const API_KEY = import.meta.env.VITE_PROWLARR_KEY;

const headers = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
  'X-Api-Key': API_KEY
};

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    if (!response.ok) throw new Error(`Prowlarr API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[PROWLARR] Error fetching ${endpoint}:`, error);
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
