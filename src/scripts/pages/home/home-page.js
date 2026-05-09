import { createIcons, icons } from 'lucide';
import '../../components/my-toast.js';
import Map from '../../utils/map.js';
import HomePresenter from './home-presenter.js';
import StoryRepository from '../../data/story-repository.js';

export default class HomePage {
  #presenter = null;
  #map = null;
  #locationStories = [];
  #markers = {};
  #observer = null;
  #mapSearchDebounce = null;

  async render() {
    return /* html */ `
      <section class="home container">
        <div class="home__shell">
          <section class="home__map-panel" aria-label="Peta Jejak Rasa">
            <div class="home__header-top">
              <div>
                <div class="home__eyebrow">Jejak Rasa</div>
                <h1 class="home__title">Peta Cerita yang Pernah Dibagikan</h1>
              </div>
              <a class="home__add-btn" href="#/add-story" aria-label="Tambah cerita baru">
                <i data-lucide="plus" aria-hidden="true"></i>
                <span>Tambah cerita</span>
              </a>
            </div>
            <p class="home__description">Lihat cerita yang punya lokasi langsung di peta. Marker akan menyesuaikan titik cerita sehingga tiap jejak lebih mudah dibaca.</p>

            <div class="home__map-card">
              <div class="home__map-status">
                <span class="home__map-status-label">Status Peta</span>
                <span class="home__map-status-value" id="home-map-status">Loading...</span>
              </div>
              <div class="add-story__map-toolbar" style="padding: 1rem 1.2rem 0; position: relative; z-index: 400;">
                <div class="add-story__map-search">
                  <label for="home-map-search-input" class="add-story__map-search-label">Filter lokasi cerita</label>
                  <input id="home-map-search-input" type="search" class="add-story__map-search-input" placeholder="Contoh: Jakarta, Bandung..." autocomplete="off" />
                  <ul id="home-map-search-results" class="add-story__map-search-results" hidden></ul>
                </div>
              </div>
              <div class="home__map-surface" id="home-map"></div>
              <div class="home__map-meta" id="home-map-meta">
                <div>
                  <p class="home__meta-label">Total Story</p>
                  <strong class="home__meta-value" id="meta-total">0 cerita</strong>
                </div>
                <div>
                  <p class="home__meta-label">Marker Aktif</p>
                  <strong class="home__meta-value" id="meta-active">0 titik</strong>
                </div>
              </div>
            </div>
          </section>

          <section class="home__stories-section" aria-label="Daftar story pengguna">
            <div class="home__section-head">
              <div>
                <p class="home__eyebrow">Story Terkini</p>
                <h2 class="home__section-title">Cerita yang Pernah Dibuat</h2>
              </div>
              <div class="home__section-actions">
                <label for="home-search-input" class="sr-only">Cari cerita</label>
                <input id="home-search-input" type="search" placeholder="Cari nama/deskripsi story..." class="add-story__map-search-input" style="min-width: 240px;" />

                <label for="home-sort-select" class="sr-only">Urutkan cerita</label>
                <select id="home-sort-select" class="add-story__map-search-input" style="min-width: 150px;">
                  <option value="newest">Terbaru</option>
                  <option value="oldest">Terlama</option>
                </select>

                <label for="home-filter-select" class="sr-only">Filter cerita</label>
                <select id="home-filter-select" class="add-story__map-search-input" style="min-width: 170px;">
                  <option value="all">Semua</option>
                  <option value="with-location">Dengan Lokasi</option>
                  <option value="without-location">Tanpa Lokasi</option>
                  <option value="pending">Pending Sync</option>
                </select>
              </div>
            </div>

            <div id="home-stories-container"></div>
            
            <div id="home-load-more-container" style="text-align: center; margin-top: 2rem;"></div>
          </section>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const navbar = document.getElementsByClassName('main__navbar')[0];
    if (navbar) {
      navbar.classList.remove('hide-me');
    }

    window.scrollTo(0, 0);
    createIcons({ icons });

    this.#presenter = new HomePresenter({
      view: this,
      model: StoryRepository,
    });

    await this.#presenter.getStories();
    this.#setupListInteractivityControls();
  }

  showLoading() {
    const container = document.getElementById('home-stories-container');
    if (container) {
      container.innerHTML = `
        <div class="home__story-empty" style="text-align: center; padding: 3rem;">
          <p>Loading stories...</p>
        </div>
      `;
    }
    const loadMoreContainer = document.getElementById('home-load-more-container');
    if (loadMoreContainer) {
      loadMoreContainer.innerHTML = '';
    }
  }

  showLoadMoreLoading() {
    const loadMoreContainer = document.getElementById('home-load-more-container');
    if (loadMoreContainer) {
      loadMoreContainer.innerHTML = '<div style="padding: 2rem; text-align: center;"><i class="fas fa-spinner loader-button" style="animation: spin 1s linear infinite; font-size: 2rem; color: var(--color-primary);"></i><p style="margin-top: 1rem;">Memuat lebih banyak cerita...</p></div>';
    }
  }

  hideLoading() {
    // Optional, because populateStories will override the content.
  }

  async populateStories(stories, locationStories, hasMoreStories) {
    this.#locationStories = locationStories;
    
    // Update Map Status and Meta
    const statusEl = document.getElementById('home-map-status');
    const totalEl = document.getElementById('meta-total');
    const activeEl = document.getElementById('meta-active');

    if (statusEl) {
      statusEl.textContent = locationStories.length
        ? `${locationStories.length} marker aktif`
        : 'Belum ada marker, peta tetap tampil.';
    }
    if (totalEl) totalEl.textContent = `${stories.length} cerita`;
    if (activeEl) activeEl.textContent = `${locationStories.length} titik`;

    // Initialize map and render current markers.
    await this.#setupMap();
    this.#renderMapMarkers();

    // Render Story Grid
    const container = document.getElementById('home-stories-container');
    if (!container) return;

    if (stories.length) {
      container.innerHTML = `
        <div class="home__story-grid">
          ${stories.map((story) => this.#buildStoryCard(story)).join('')}
        </div>
      `;
      createIcons({ icons });
      
      // Setup Interactivity: Sync list to map
      stories.forEach((story) => {
        const cardEl = document.getElementById(`story-card-${story.id}`);
        if (cardEl && this.#markers[story.id]) {
          cardEl.addEventListener('mouseenter', () => {
            this.#markers[story.id].openPopup();
            const coords = this.#toCoordinate(story);
            if (coords) {
              this.#map.flyTo(coords, 8);
            }
          });
        }
      });
    } else {
      container.innerHTML = `
        <div class="home__story-empty">
          <p class="home__story-empty-title">Belum ada story untuk ditampilkan</p>
          <p class="home__story-empty-text">Coba muat ulang atau buat cerita baru terlebih dahulu.</p>
        </div>
      `;
    }

    createIcons({ icons });

    const loadMoreContainer = document.getElementById('home-load-more-container');
    if (loadMoreContainer) {
      if (hasMoreStories && stories.length) {
        loadMoreContainer.innerHTML = `
          <div id="infinite-scroll-trigger" style="height: 20px; width: 100%;"></div>
          <button
            id="load-more-btn"
            class="home__load-more-btn"
            type="button"
            aria-label="Muat lebih banyak cerita"
          >
            Muat Lebih Banyak
          </button>
        `;
        
        // Keyboard-accessible Load More button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
          loadMoreBtn.addEventListener('click', () => {
            this.#presenter.getStories(true);
          });
        }
        
        // Setup Intersection Observer for Infinite Scroll
        if (this.#observer) {
          this.#observer.disconnect();
        }
        
        const trigger = document.getElementById('infinite-scroll-trigger');
        this.#observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            this.#observer.disconnect();
            this.#presenter.getStories(true);
          }
        }, { rootMargin: '100px' });
        
        this.#observer.observe(trigger);
        
      } else if (!hasMoreStories && stories.length) {
        loadMoreContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #666;">
            <p>Semua cerita telah dimuat.</p>
          </div>
        `;
      } else {
        loadMoreContainer.innerHTML = '';
      }
    }
  }

  populateError(message) {
    const container = document.getElementById('home-stories-container');
    if (container) {
      container.innerHTML = `
        <div class="home__story-empty">
          <p class="home__story-empty-title">Gagal memuat cerita</p>
          <p class="home__story-empty-text">${message}</p>
        </div>
      `;
    }

    const statusEl = document.getElementById('home-map-status');
    if (statusEl) {
      statusEl.textContent = 'Data cerita gagal dimuat, peta default tetap ditampilkan.';
    }
    
    this.#setupMap(); // Still setup map with empty coordinates
  }

  async #setupMap() {
    const mapSurface = document.getElementById('home-map');
    if (!mapSurface) return;
    if (this.#map) return;

    try {
      this.#map = await Map.build('#home-map', {
        zoom: 5,
        center: [-2.5, 117.5],
        scrollWheelZoom: true,
        zoomControl: true,
      });

      this.#map.invalidateSize();

      this.#setupMapToolbar();
    } catch (error) {
      console.error('HomePage map error:', error);
      mapSurface.innerHTML = '';
    }
  }

  #renderMapMarkers() {
    if (!this.#map) {
      return;
    }

    Object.values(this.#markers).forEach((marker) => marker.remove());
    this.#markers = {};

    const coordinates = this.#locationStories
      .map((story) => this.#toCoordinate(story))
      .filter(Boolean);

    this.#locationStories.forEach((story) => {
      const coordinate = this.#toCoordinate(story);
      if (!coordinate) return;

      const popupContent = this.#buildMarkerPopup(story);
      const marker = this.#map.addMarker(coordinate, {}, {
        content: popupContent,
        options: {
          maxWidth: 280,
          closeButton: true,
          autoPan: true,
        },
      });

      this.#markers[story.id] = marker;
    });

    if (coordinates.length === 1) {
      this.#map.flyTo(coordinates[0], 8);
    } else if (coordinates.length > 1) {
      this.#map.fitBounds(coordinates);
    }
  }

  #setupMapToolbar() {
    const searchInput = document.querySelector('#home-map-search-input');
    const searchResults = document.querySelector('#home-map-search-results');
    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', () => {
      clearTimeout(this.#mapSearchDebounce);
      this.#mapSearchDebounce = setTimeout(async () => {
        await this.#handleMapSearch(searchInput.value);
      }, 350);
    });

    searchResults.addEventListener('mousedown', (event) => {
      event.preventDefault();
      const clickedElement = event.target instanceof Element ? event.target : null;
      const resultButton = clickedElement?.closest('button[data-lat][data-lng]');

      if (!resultButton) return;

      const latitude = Number.parseFloat(resultButton.dataset.lat || '');
      const longitude = Number.parseFloat(resultButton.dataset.lng || '');

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) return;

      this.#map.flyTo([latitude, longitude], 12);
      searchInput.value = resultButton.dataset.label || resultButton.textContent.trim();
      this.#renderMapSearchResults([]);
      searchInput.focus();
    });

    // Keyboard navigation for search results
    searchInput.addEventListener('keydown', (event) => {
      const items = searchResults.querySelectorAll('button[data-lat]');
      if (!items.length) return;

      const current = searchResults.querySelector('button[data-lat]:focus');
      const idx = [...items].indexOf(current);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const next = items[idx + 1] ?? items[0];
        next.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prev = items[idx - 1] ?? items[items.length - 1];
        prev.focus();
      } else if (event.key === 'Escape') {
        this.#renderMapSearchResults([]);
        searchInput.blur();
      }
    });

    searchResults.addEventListener('keydown', (event) => {
      const items = searchResults.querySelectorAll('button[data-lat]');
      const current = document.activeElement;
      const idx = [...items].indexOf(current);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const next = items[idx + 1] ?? items[0];
        next.focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prev = idx <= 0 ? searchInput : items[idx - 1];
        prev.focus();
      } else if (event.key === 'Escape') {
        this.#renderMapSearchResults([]);
        searchInput.focus();
      } else if (event.key === 'Enter' && current?.dataset?.lat) {
        event.preventDefault();
        const latitude = Number.parseFloat(current.dataset.lat);
        const longitude = Number.parseFloat(current.dataset.lng);
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          this.#map.flyTo([latitude, longitude], 12);
          searchInput.value = current.dataset.label || current.textContent.trim();
          this.#renderMapSearchResults([]);
          searchInput.focus();
        }
      }
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => this.#renderMapSearchResults([]), 120);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim()) this.#handleMapSearch(searchInput.value);
    });

    searchInput.addEventListener('search', () => this.#renderMapSearchResults([]));
  }

  async #handleMapSearch(query) {
    if (!this.#map) return;
    if (!query.trim()) {
      this.#renderMapSearchResults([]);
      return;
    }

    try {
      const results = await this.#map.searchPlaces(query);
      this.#renderMapSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error('#handleMapSearch error:', error);
      this.#renderMapSearchResults([]);
    }
  }

  #renderMapSearchResults(results) {
    const searchResults = document.querySelector('#home-map-search-results');
    if (!searchResults) return;

    if (!results.length) {
      searchResults.hidden = true;
      searchResults.innerHTML = '';
      return;
    }

    searchResults.innerHTML = results
      .map((result) => {
        const latitude = Number.parseFloat(result?.y ?? result?.lat ?? result?.latitude ?? result?.raw?.lat ?? '');
        const longitude = Number.parseFloat(result?.x ?? result?.lng ?? result?.lon ?? result?.longitude ?? result?.raw?.lon ?? '');

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) return '';

        const label = result.label || 'Lokasi tanpa nama';
        const safeLabel = this.#escapeHtml(label);
        return `
          <li>
            <button
              type="button"
              class="add-story__map-search-result-btn"
              data-lat="${latitude}"
              data-lng="${longitude}"
              data-label="${label.replace(/"/g, '&quot;')}"
            >
              ${safeLabel}
            </button>
          </li>
        `;
      })
      .join('');

    searchResults.hidden = false;
  }

  #buildStoryCard(story) {
    const title = this.#escapeHtml(story.name || 'Tanpa nama');
    const description = this.#escapeHtml(this.#truncate(story.description || 'Tidak ada deskripsi', 120));
    const imageUrl = this.#escapeAttribute(story.photoUrl || '');
    const createdAt = this.#formatDate(story.createdAt);
    const locationText = this.#formatStoryLocation(story);
    const isSaved = Boolean(story.isSaved);
    const syncBadge = story.isPending ? '<span class="home__story-location" style="background:#ffe7b8;">Pending Sync</span>' : '';
    const detailAction = story.isPending
      ? '<span class="home__story-link" aria-disabled="true">Menunggu sinkronisasi</span>'
      : `<a class="home__story-link" href="#/story/${story.id}">Lihat detail</a>`;
    const saveLabel = isSaved ? 'Hapus dari tersimpan' : 'Simpan cerita';
    const saveButtonClass = isSaved ? 'home__story-save-btn is-saved' : 'home__story-save-btn';
    const saveButtonPressed = isSaved ? 'true' : 'false';

    return /* html */ `
      <article id="story-card-${story.id}" class="home__story-card" aria-label="Kartu cerita ${title}">
        <figure class="home__story-figure">
          <img class="home__story-image" src="${imageUrl}" alt="Foto story ${title}" />
        </figure>

        <div class="home__story-content">
          <div class="home__story-topline">
            <span class="home__story-location">${locationText}</span>
            <span class="home__story-time">${createdAt}</span>
          </div>
          ${syncBadge}

          <h2 class="home__story-title">${title}</h2>
          <p class="home__story-excerpt">${description}</p>
          <div class="home__story-actions">
            <button
              type="button"
              class="${saveButtonClass}"
              data-toggle-save-story-id="${story.id}"
              aria-pressed="${saveButtonPressed}"
              aria-label="${saveLabel}"
              title="${saveLabel}"
            >
              <i data-lucide="bookmark" aria-hidden="true"></i>
              <span class="sr-only">${saveLabel}</span>
            </button>
            ${detailAction}
            <button type="button" class="main__btn" data-delete-story-id="${story.id}" style="padding: 0.4em 0.8em; font-size: 0.9em; margin-top: 0;">Hapus Lokal</button>
          </div>
        </div>
      </article>
    `;
  }

  #buildMarkerPopup(story) {
    const title = this.#escapeHtml(story.name || 'Tanpa nama');
    const description = this.#escapeHtml(this.#truncate(story.description || 'Tidak ada deskripsi', 110));
    const locationText = this.#escapeHtml(this.#formatStoryLocation(story));
    const createdAt = this.#escapeHtml(this.#formatDate(story.createdAt));

    return `
      <div class="home__map-popup">
        <p class="home__map-popup-label">${locationText}</p>
        <h3 class="home__map-popup-title">${title}</h3>
        <p class="home__map-popup-description">${description}</p>
        <p class="home__map-popup-time">${createdAt}</p>
        <a class="home__map-popup-link" href="#/story/${story.id}">Lihat detail</a>
      </div>
    `;
  }

  #formatStoryLocation(story) {
    if (!this.#toCoordinate(story)) {
      return 'Tanpa lokasi';
    }

    const latitude = Number.parseFloat(story.lat).toFixed(3);
    const longitude = Number.parseFloat(story.lon).toFixed(3);
    return `${latitude}, ${longitude}`;
  }

  #toCoordinate(story) {
    const latitude = Number.parseFloat(story?.lat);
    const longitude = Number.parseFloat(story?.lon);
    
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    ) {
      return [latitude, longitude];
    }
    return null;
  }

  #formatDate(dateValue) {
    if (!dateValue) {
      return 'Baru saja';
    }

    const date = new Date(dateValue);
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  #truncate(text, limit) {
    if (text.length <= limit) {
      return text;
    }

    return `${text.slice(0, limit).trim()}...`;
  }

  #escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  #escapeAttribute(text) {
    return this.#escapeHtml(text).replaceAll('`', '&#96;');
  }

  #setupListInteractivityControls() {
    const searchInput = document.getElementById('home-search-input');
    const sortSelect = document.getElementById('home-sort-select');
    const filterSelect = document.getElementById('home-filter-select');
    const storiesContainer = document.getElementById('home-stories-container');

    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        this.#presenter.setSearchQuery(event.target.value);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (event) => {
        this.#presenter.setSortBy(event.target.value);
      });
    }

    if (filterSelect) {
      filterSelect.addEventListener('change', (event) => {
        this.#presenter.setFilterBy(event.target.value);
      });
    }

    if (storiesContainer) {
      storiesContainer.addEventListener('click', (event) => {
        const targetElement = event.target instanceof Element ? event.target : null;
        const saveButton = targetElement?.closest('[data-toggle-save-story-id]');
        if (saveButton) {
          const storyId = saveButton.getAttribute('data-toggle-save-story-id');
          if (storyId) {
            this.#presenter.toggleSavedStory(storyId);
          }
          return;
        }

        const deleteButton = targetElement?.closest('[data-delete-story-id]');
        if (!deleteButton) {
          return;
        }

        const storyId = deleteButton.getAttribute('data-delete-story-id');
        if (!storyId) {
          return;
        }

        this.#presenter.removeStory(storyId);
      });
    }
  }

  showToast(type, message) {
    const toast = document.createElement('my-toast');
    toast.setAttribute('type', type);
    toast.setAttribute('message', message);

    document.body.appendChild(toast);

    const toastContainer = toast.querySelector('.toast__container');
    if (toastContainer) {
      toastContainer.classList.remove('slide-out');
    }

    setTimeout(() => {
      if (toastContainer) {
        toastContainer.classList.add('slide-out');
        toastContainer.onanimationend = () => toast.remove();
      } else {
        toast.remove();
      }
    }, 2400);
  }
}
