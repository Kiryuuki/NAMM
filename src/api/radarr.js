import { config } from './config.js';

const BASE_URL = config.RADARR_URL;
const API_KEY = config.RADARR_KEY;

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
    if (!response.ok) throw new Error(`Radarr API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[RADARR] Error fetching ${endpoint}:`, error);
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
  // We only need totalRecords, so pageSize=1
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

export async function addMovie(tmdbResult) {
  try {
    // We need to fetch profiles and root folders if not provided
    const profiles = await getQualityProfiles();
    const roots = await getRootFolders();
    
    if (profiles.error || roots.error) throw new Error("Failed to fetch required Radarr config");

    const payload = {
      tmdbId: tmdbResult.id,
      title: tmdbResult.title,
      year: new Date(tmdbResult.release_date).getFullYear(),
      qualityProfileId: profiles[0].id,
      rootFolderPath: roots[0].path,
      monitored: true,
      addOptions: { searchForMovie: true }
    };

    return await apiFetch('/api/v3/movie', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    return { error: true, message: error.message };
  }
}

export async function deleteMovie(movieId, deleteFiles = true) {
  return await apiFetch(`/api/v3/movie/${movieId}?deleteFiles=${deleteFiles}`, {
    method: 'DELETE'
  });
}
