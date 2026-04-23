#!/bin/sh

# Create the config.js file on startup from environment variables
# This allows NAMM to be portable across different servers without re-building the image

echo "Generating NAMM runtime configuration..."

cat <<EOF > /usr/share/nginx/html/config.js
window.NAMM_CONFIG = {
  VITE_JELLYFIN_URL: "${VITE_JELLYFIN_URL}",
  VITE_JELLYFIN_KEY: "${VITE_JELLYFIN_KEY}",
  VITE_JELLYFIN_USER_ID: "${VITE_JELLYFIN_USER_ID}",
  VITE_RADARR_URL: "${VITE_RADARR_URL}",
  VITE_RADARR_KEY: "${VITE_RADARR_KEY}",
  VITE_SONARR_URL: "${VITE_SONARR_URL}",
  VITE_SONARR_KEY: "${VITE_SONARR_KEY}",
  VITE_PROWLARR_URL: "${VITE_PROWLARR_URL}",
  VITE_PROWLARR_KEY: "${VITE_PROWLARR_KEY}",
  VITE_TMDB_KEY: "${VITE_TMDB_KEY}"
};
EOF

echo "Runtime configuration generated successfully."

# Hand off to Nginx
exec "$@"
