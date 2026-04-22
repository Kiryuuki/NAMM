const BASE_URL = import.meta.env.VITE_JELLYFIN_URL;
const API_KEY = import.meta.env.VITE_JELLYFIN_KEY;
const USER_ID = import.meta.env.VITE_JELLYFIN_USER_ID;

const headers = {
  'Accept': 'application/json',
  'Authorization': `MediaBrowser Token="${API_KEY}"`
};

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    if (!response.ok) throw new Error(`Jellyfin API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[JELLYFIN] Error fetching ${endpoint}:`, error);
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

export async function searchItems(query) {
  return await apiFetch(`/Items?searchTerm=${encodeURIComponent(query)}&Limit=10&Recursive=true`);
}

export async function getLibraryItems(parentId) {
  let url = `/Items?ParentId=${parentId}&Limit=60&SortBy=SortName&Fields=PrimaryImageAspectRatio,BasicSyncInfo,ProductionYear`;
  if (USER_ID) url += `&UserId=${USER_ID}`;
  return await apiFetch(url);
}

export async function refreshLibraries() {
  try {
    const response = await fetch(`${BASE_URL}/Library/Refresh`, {
      method: 'POST',
      headers
    });
    return response.ok ? { success: true } : { error: true };
  } catch (error) {
    return { error: true, message: error.message };
  }
}

export function getStreamUrl(itemId) {
  return `${BASE_URL}/Videos/${itemId}/stream?static=true&api_key=${API_KEY}`;
}

export async function getItem(itemId) {
  // Use /Items/{Id} instead of user-specific path to be more robust
  let url = `/Items/${itemId}?Fields=Overview,Genres,CommunityRating,RunTimeTicks,ProductionYear`;
  if (USER_ID) url += `&UserId=${USER_ID}`;
  return await apiFetch(url);
}

export async function getItems(params = '') {
  let url = `/Items?${params}`;
  if (USER_ID && !params.includes('UserId')) {
    url += `&UserId=${USER_ID}`;
  }
  return await apiFetch(url);
}

export async function getEpisodes(seriesId, seasonId = null) {
  let url = `/Shows/${seriesId}/Episodes?Fields=Overview,PrimaryImageAspectRatio`;
  if (USER_ID) url += `&UserId=${USER_ID}`;
  if (seasonId) url += `&SeasonId=${seasonId}`;
  return await apiFetch(url);
}

export async function getSeasons(seriesId) {
  let url = `/Shows/${seriesId}/Seasons?`;
  if (USER_ID) url += `&UserId=${USER_ID}`;
  return await apiFetch(url);
}
