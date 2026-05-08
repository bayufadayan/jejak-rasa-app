import { createIcons, icons } from 'lucide';
import * as API from '../../data/api.js';
import Map from '../../utils/map.js';
import HomePresenter from './home-presenter.js';

export default class HomePage {
  #presenter = null;
  #map = null;
  #locationStories = [];

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
                <a href="#/add-story" class="home__add-btn">
                  <i data-lucide="plus" aria-hidden="true"></i>
                  <span>Tambah Cerita Baru</span>
                </a>
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
      model: API,
    });

    await this.#presenter.getStories();
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
    const loadMoreBtn = document.getElementById('home-load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.innerHTML = '<i class="fas fa-spinner loader-button" style="animation: spin 1s linear infinite;"></i> Memuat...';
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

    // Initialize map
    await this.#setupMap();

    // Render Story Grid
    const container = document.getElementById('home-stories-container');
    if (!container) return;

    if (stories.length) {
      container.innerHTML = `
        <div class="home__story-grid">
          ${stories.map((story) => this.#buildStoryCard(story)).join('')}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="home__story-empty">
          <p class="home__story-empty-title">Belum ada story untuk ditampilkan</p>
          <p class="home__story-empty-text">Coba muat ulang atau buat cerita baru terlebih dahulu.</p>
        </div>
      `;
    }

    const loadMoreContainer = document.getElementById('home-load-more-container');
    if (loadMoreContainer) {
      if (hasMoreStories && stories.length) {
        loadMoreContainer.innerHTML = `
          <button id="home-load-more-btn" class="main__btn" style="width: auto; padding: 0.75rem 2rem;">Muat Lebih Banyak</button>
        `;
        document.getElementById('home-load-more-btn').addEventListener('click', () => {
          this.#presenter.getStories(true);
        });
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

    try {
      this.#map = await Map.build('#home-map', {
        zoom: 5,
        center: [-2.5, 117.5],
        scrollWheelZoom: true,
        zoomControl: true,
      });

      this.#map.invalidateSize();

      const coordinates = this.#locationStories
        .map((story) => this.#toCoordinate(story))
        .filter(Boolean);

      this.#locationStories.forEach((story) => {
        const coordinate = this.#toCoordinate(story);
        if (!coordinate) return;

        const popupContent = this.#buildMarkerPopup(story);
        this.#map.addMarker(coordinate, {}, {
          content: popupContent,
          options: {
            maxWidth: 280,
            closeButton: true,
            autoPan: true,
          },
        });
      });

      if (coordinates.length === 1) {
        this.#map.flyTo(coordinates[0], 8);
      } else if (coordinates.length > 1) {
        this.#map.fitBounds(coordinates);
      }
    } catch (error) {
      console.error('HomePage map error:', error);
      mapSurface.innerHTML = '';
    }
  }

  #buildStoryCard(story) {
    const title = this.#escapeHtml(story.name || 'Tanpa nama');
    const description = this.#escapeHtml(this.#truncate(story.description || 'Tidak ada deskripsi', 120));
    const imageUrl = this.#escapeAttribute(story.photoUrl || '');
    const createdAt = this.#formatDate(story.createdAt);
    const locationText = this.#formatStoryLocation(story);

    return /* html */ `
      <a class="home__story-card" href="#/story/${story.id}" aria-label="Buka detail cerita ${title}">
        <figure class="home__story-figure">
          <img class="home__story-image" src="${imageUrl}" alt="Foto story ${title}" />
        </figure>

        <div class="home__story-content">
          <div class="home__story-topline">
            <span class="home__story-location">${locationText}</span>
            <span class="home__story-time">${createdAt}</span>
          </div>

          <h3 class="home__story-title">${title}</h3>
          <p class="home__story-excerpt">${description}</p>
          <span class="home__story-link">Lihat detail</span>
        </div>
      </a>
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
}
