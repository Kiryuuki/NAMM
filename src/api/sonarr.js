const BASE_URL = import.meta.env.VITE_SONARR_URL;
const API_KEY = import.meta.env.VITE_SONARR_KEY;

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
    if (!response.ok) throw new Error(`Sonarr API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[SONARR] Error fetching ${endpoint}:`, error);
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
  return await apiFetch('/api/v3/wanted/missing?pageSize=1');
}

export async function getDiskspace() {
  return await apiFetch('/api/v3/diskspace');
}

export async function getCalendar(start, end) {
  return await apiFetch(`/api/v3/calendar?start=${start}&end=${end}`);
}

export async function getQualityProfiles() {
  return await apiFetch('/api/v3/qualityprofile');
}

export async function getRootFolders() {
  return await apiFetch('/api/v3/rootfolder');
}

export async function addSeries(tmdbResult) {
  try {
    const profiles = await getQualityProfiles();
    const roots = await getRootFolders();
    
    if (profiles.error || roots.error) throw new Error("Failed to fetch required Sonarr config");

    // Note: Sonarr requires tvdbId. The classifier should ideally provide this.
    // If not, we'd need another TMDB call: /tv/{id}/external_ids
    if (!tmdbResult.tvdbId) {
       console.warn("[SONARR] Missing tvdbId, series might not be added correctly.");
    }

    const payload = {
      tvdbId: tmdbResult.tvdbId,
      title: tmdbResult.name || tmdbResult.title,
      qualityProfileId: profiles[0].id,
      rootFolderPath: roots[0].path,
      monitored: true,
      addOptions: { searchForMissingEpisodes: true }
    };

    return await apiFetch('/api/v3/series', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return { error: true, message: error.message };
  }
}

export async function deleteSeries(seriesId, deleteFiles = true) {
  return await apiFetch(`/api/v3/series/${seriesId}?deleteFiles=${deleteFiles}`, {
    method: 'DELETE'
  });
}
