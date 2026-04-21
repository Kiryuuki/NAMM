import * as radarr from './radarr.js';
import * as sonarr from './sonarr.js';

const TMDB_KEY = import.meta.env.VITE_TMDB_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';

async function tmdbFetch(endpoint) {
  try {
    const separator = endpoint.includes('?') ? '&' : '?';
    const response = await fetch(`${TMDB_BASE}${endpoint}${separator}api_key=${TMDB_KEY}`);
    if (!response.ok) throw new Error(`TMDB error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`[TMDB] Error:`, error);
    return { error: true, message: error.message };
  }
}

export async function searchTMDB(query) {
  return await tmdbFetch(`/search/multi?query=${encodeURIComponent(query)}`);
}

export async function getTVDBId(tmdbId) {
  const externalIds = await tmdbFetch(`/tv/${tmdbId}/external_ids`);
  return externalIds.tvdb_id;
}

export async function classifyAndAdd(tmdbResult) {
  if (tmdbResult.media_type === 'movie') {
    console.log(`[CLASSIFIER] Routing MOVIE "${tmdbResult.title}" to Radarr`);
    return await radarr.addMovie(tmdbResult);
  } else if (tmdbResult.media_type === 'tv') {
    console.log(`[CLASSIFIER] Routing TV SHOW "${tmdbResult.name}" to Sonarr`);
    
    // Sonarr needs TVDB ID
    const tvdbId = await getTVDBId(tmdbResult.id);
    return await sonarr.addSeries({ ...tmdbResult, tvdbId });
  } else {
    console.warn(`[CLASSIFIER] Ambiguous media type: ${tmdbResult.media_type}`);
    return { ambiguous: true, result: tmdbResult };
  }
}

export async function getTrendingMovies() {
  return await tmdbFetch('/trending/movie/week');
}

export async function getTrendingTV() {
  return await tmdbFetch('/trending/tv/week');
}
