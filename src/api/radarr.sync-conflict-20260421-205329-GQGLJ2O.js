const URL = import.meta.env.VITE_RADARR_URL;
const KEY = import.meta.env.VITE_RADARR_KEY;

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
    console.error(`Radarr API Error (${endpoint}):`, error);
    return { error: true, message: error.message };
  }
}

export async function getSystemStatus() {
  return await apiFetch('/api/v3/system/status');
}

export async function getMovies() {
  return await apiFetch('/api/v3/movie');
}

export async function getQueue() {
  return await apiFetch('/api/v3/queue?pageSize=50');
}

export async function getQueueStatus() {
  return await apiFetch('/api/v3/queue/status');
}

export async function getMissing() {
  return await apiFetch('/api/v3/wanted/missing?pageSize=10');
}

export async function getDiskspace() {
  return await apiFetch('/api/v3/diskspace');
}
