const URL = import.meta.env.VITE_JELLYFIN_URL;
const KEY = import.meta.env.VITE_JELLYFIN_KEY;
const USER_ID = import.meta.env.VITE_JELLYFIN_USER_ID;

const headers = {
  'Authorization': `MediaBrowser Token="${KEY}"`,
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
    console.error(`Jellyfin API Error (${endpoint}):`, error);
    return { error: true, message: error.message };
  }
}

export async function getSystemInfo() {
  return await apiFetch('/System/Info');
}

export async function getSessions() {
  return await apiFetch('/Sessions');
}

export async function getLibraries() {
  return await apiFetch('/Library/MediaFolders');
}

export async function getItems(query) {
  return await apiFetch(`/Items?searchTerm=${encodeURIComponent(query)}&Limit=20&UserId=${USER_ID}`);
}

export async function refreshLibraries() {
  return await apiFetch('/Library/Refresh', 'POST');
}
