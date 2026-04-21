import { searchTMDB, classifyAndAdd } from '../api/classifier.js';
import { showToast } from './Toast.js';
import { showAmbiguityModal } from './Modal.js';

let debounceTimer;
let selectedIndex = -1;
let currentResults = [];

export function initSearchBar() {
  const input = document.getElementById('universal-search');
  if (!input) return;

  // Create results dropdown if it doesn't exist
  let dropdown = document.getElementById('search-results');
  if (!dropdown) {
    dropdown = document.createElement('div');
    dropdown.id = 'search-results';
    dropdown.className = 'search-results-dropdown';
    input.parentElement.appendChild(dropdown);
  }

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);

    if (query.length < 2) {
      hideDropdown();
      return;
    }

    debounceTimer = setTimeout(() => performSearch(query), 400);
  });

  input.addEventListener('keydown', handleKeyNavigation);

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      hideDropdown();
    }
  });
}

async function performSearch(query) {
  const dropdown = document.getElementById('search-results');
  dropdown.innerHTML = '<div class="search-loading">SEARCHING TMDB...</div>';
  dropdown.style.display = 'block';

  const data = await searchTMDB(query);
  
  if (data.error) {
    dropdown.innerHTML = `<div class="search-error">DATA ERROR: ${data.message}</div>`;
    return;
  }

  currentResults = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv').slice(0, 8);
  renderResults(currentResults);
}

function renderResults(results) {
  const dropdown = document.getElementById('search-results');
  
  if (results.length === 0) {
    dropdown.innerHTML = '<div class="search-no-results">NO RESULTS FOUND_</div>';
    return;
  }

  dropdown.innerHTML = results.map((res, index) => {
    const title = res.title || res.name;
    const year = new Date(res.release_date || res.first_air_date).getFullYear() || 'N/A';
    const poster = res.poster_path ? `https://image.tmdb.org/t/p/w92${res.poster_path}` : '';
    const typeBadge = res.media_type.toUpperCase();

    return `
      <div class="search-result-item" data-index="${index}">
        <div class="res-poster" style="background-image: url('${poster}')"></div>
        <div class="res-info">
          <div class="res-title">${title}</div>
          <div class="res-meta">${year} • <span class="badge ${res.media_type}">${typeBadge}</span></div>
        </div>
      </div>
    `;
  }).join('');

  dropdown.querySelectorAll('.search-result-item').forEach(item => {
    item.addEventListener('click', () => handleSelect(results[item.dataset.index]));
  });

  selectedIndex = -1;
}

function handleKeyNavigation(e) {
  const items = document.querySelectorAll('.search-result-item');
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedIndex = (selectedIndex + 1) % items.length;
    updateSelection(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedIndex = (selectedIndex - 1 + items.length) % items.length;
    updateSelection(items);
  } else if (e.key === 'Enter' && selectedIndex >= 0) {
    e.preventDefault();
    handleSelect(currentResults[selectedIndex]);
  } else if (e.key === 'Escape') {
    hideDropdown();
  }
}

function updateSelection(items) {
  items.forEach((item, index) => {
    item.classList.toggle('selected', index === selectedIndex);
    if (index === selectedIndex) item.scrollIntoView({ block: 'nearest' });
  });
}

async function handleSelect(result) {
  hideDropdown();
  const input = document.getElementById('universal-search');
  input.value = '';

  const res = await classifyAndAdd(result);
  
  if (res.ambiguous) {
    showAmbiguityModal(result, (type) => {
      handleSelect({ ...result, media_type: type });
    });
    return;
  }

  if (res.error) {
    showToast(`FAILED TO QUEUE: ${res.message}`, 'error');
  } else {
    const service = result.media_type === 'movie' ? 'RADARR' : 'SONARR';
    showToast(`QUEUED: ${result.title || result.name} → ${service}`, 'success');
  }
}

function hideDropdown() {
  const dropdown = document.getElementById('search-results');
  if (dropdown) dropdown.style.display = 'none';
  selectedIndex = -1;
}
