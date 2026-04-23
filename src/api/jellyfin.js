import { config } from './config.js';

const BASE_URL = config.JELLYFIN_URL ? config.JELLYFIN_URL.replace(/\/$/, '') : '';
const API_KEY = config.JELLYFIN_KEY;
const USER_ID = config.JELLYFIN_USER_ID;

const headers = {
  'Accept': 'application/json',
  'Authorization': `MediaBrowser Token="${API_KEY}"`
};

async function apiFetch(endpoint, options = {}) {
  if (!BASE_URL) {
    console.error(`[JELLYFIN] Config Error: JELLYFIN_URL is missing.`);
    return { error: true, message: "Jellyfin URL not configured" };
  }

  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers }
    });
    
    // Check if we got HTML instead of JSON (common when hitting Nginx fallbacks)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("text/html")) {
       throw new Error(`Expected JSON but received HTML. Check if JELLYFIN_URL is correct: ${BASE_URL}`);
    }

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

export function getStreamUrl(itemId, options = {}) {
  const mediaSourceId = options.mediaSourceId || itemId;
  let url = `${BASE_URL}/Videos/${itemId}/stream?static=true&api_key=${API_KEY}`;
  if (options.audioIndex !== undefined) url += `&AudioStreamIndex=${options.audioIndex}`;
  if (options.subtitleIndex !== undefined) url += `&SubtitleStreamIndex=${options.subtitleIndex}`;
  if (options.mediaSourceId) url += `&MediaSourceId=${options.mediaSourceId}`;
  return url;
}

export async function getPlaybackInfo(itemId) {
  return await apiFetch(`/Items/${itemId}/PlaybackInfo?UserId=${USER_ID || ''}`);
}

export function getSubtitleUrl(itemId, index, mediaSourceId) {
  const msId = mediaSourceId || itemId;
  return `${BASE_URL}/Videos/${itemId}/${index}/Subtitles/Stream.vtt?api_key=${API_KEY}&MediaSourceId=${msId}&copyTimestamps=true`;
}

export async function getItem(itemId) {
  // Enhanced fields for Jellyfin-style layout
  let url = `/Items/${itemId}?Fields=Overview,Genres,CommunityRating,RunTimeTicks,ProductionYear,People,Studios,Taglines,Tags,MediaSources,OfficialRating,MediaStreams`;
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
