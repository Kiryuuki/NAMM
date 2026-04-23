/**
 * NAMM Configuration Handler
 * Priority: 
 * 1. window.NAMM_CONFIG (Injected at runtime via Docker/config.js)
 * 2. import.meta.env (Baked at build time via Vite)
 */

const getEnv = (key) => {
  if (window.NAMM_CONFIG && window.NAMM_CONFIG[key]) {
    return window.NAMM_CONFIG[key];
  }
  return import.meta.env[key];
};

export const config = {
  JELLYFIN_URL: getEnv('VITE_JELLYFIN_URL'),
  JELLYFIN_KEY: getEnv('VITE_JELLYFIN_KEY'),
  JELLYFIN_USER_ID: getEnv('VITE_JELLYFIN_USER_ID'),
  
  RADARR_URL: getEnv('VITE_RADARR_URL'),
  RADARR_KEY: getEnv('VITE_RADARR_KEY'),
  
  SONARR_URL: getEnv('VITE_SONARR_URL'),
  SONARR_KEY: getEnv('VITE_SONARR_KEY'),
  
  PROWLARR_URL: getEnv('VITE_PROWLARR_URL'),
  PROWLARR_KEY: getEnv('VITE_PROWLARR_KEY'),
  
  TMDB_KEY: getEnv('VITE_TMDB_KEY'),
};
