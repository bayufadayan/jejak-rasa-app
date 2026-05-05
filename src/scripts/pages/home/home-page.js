import { createIcons, icons } from 'lucide';
import * as API from '../../data/api.js';
import Map from '../../utils/map.js';

export default class HomePage {
  #map = null;
  #stories = [];
  #locationStories = [];
  #loadError = null;

  async render() {
    this.#stories = [];
    this.#locationStories = [];
    this.#loadError = null;

    try {
      console.log('HomePage: fetching stories from API');

      const [storiesResponse, locationStoriesResponse] = await Promise.all([
        API.getStories({ page: 1, size: 12, location: 0 }),
        API.getStories({ page: 1, size: 50, location: 1 }),
      ]);

      console.log('HomePage: stories response', storiesResponse);
      console.log('HomePage: location stories response', locationStoriesResponse);

      if (!storiesResponse.ok) {
        throw new Error(storiesResponse.message || 'Gagal memuat daftar cerita');
      }

      if (!locationStoriesResponse.ok) {
        throw new Error(locationStoriesResponse.message || 'Gagal memuat cerita berlokasi');
      }

      this.#stories = storiesResponse.listStory || [];
      this.#locationStories = this.#stories.filter((story) => this.#hasValidCoordinate(story));

      console.log('HomePage: stories loaded', {
        totalStories: this.#stories.length,
        locationStories: this.#locationStories.length,
        locationStoriesResponseCount: (locationStoriesResponse.listStory || []).length,
      });
    } catch (error) {
      console.error('HomePage render error:', error);
      this.#loadError = error.message || 'Gagal memuat home page';
    }

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
                <span class="home__map-status-value">
                  ${this.#loadError
                    ? 'Data cerita gagal dimuat, peta default tetap ditampilkan.'
                    : this.#locationStories.length
                      ? `${this.#locationStories.length} marker aktif`
                      : 'Belum ada marker, peta tetap tampil.'}
                </span>
              </div>
              <div class="home__map-surface" id="home-map"></div>
              <div class="home__map-meta">
                <div>
                  <p class="home__meta-label">Total Story</p>
                  <strong class="home__meta-value">${this.#stories.length} cerita</strong>
                </div>
                <div>
                  <p class="home__meta-label">Marker Aktif</p>
                  <strong class="home__meta-value">${this.#locationStories.length} titik</strong>
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

            ${this.#stories.length ? `
              <div class="home__story-grid">
                ${this.#stories.map((story) => this.#buildStoryCard(story)).join('')}
              </div>
            ` : `
              <div class="home__story-empty">
                <p class="home__story-empty-title">Belum ada story untuk ditampilkan</p>
                <p class="home__story-empty-text">Coba muat ulang atau buat cerita baru terlebih dahulu.</p>
              </div>
            `}
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
    await this.#setupMap();
  }

  async #setupMap() {
    const mapSurface = document.getElementById('home-map');

    if (!mapSurface) {
      return;
    }

    try {
      this.#map = await Map.build('#home-map', {
        zoom: 5,
        center: [-2.5, 117.5],
        scrollWheelZoom: false,
        zoomControl: true,
      });

      this.#map.invalidateSize();

      const coordinates = this.#locationStories
        .map((story) => this.#toCoordinate(story))
        .filter(Boolean);

      this.#locationStories.forEach((story) => {
        const coordinate = this.#toCoordinate(story);
        if (!coordinate) {
          return;
        }

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

    return `
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
    if (!this.#hasValidCoordinate(story)) {
      return 'Tanpa lokasi';
    }

    const latitude = Number.parseFloat(story.lat).toFixed(3);
    const longitude = Number.parseFloat(story.lon).toFixed(3);
    return `${latitude}, ${longitude}`;
  }

  #toCoordinate(story) {
    if (!this.#hasValidCoordinate(story)) {
      return null;
    }

    return [Number.parseFloat(story.lat), Number.parseFloat(story.lon)];
  }

  #hasValidCoordinate(story) {
    const latitude = Number.parseFloat(story?.lat);
    const longitude = Number.parseFloat(story?.lon);
    return Number.isFinite(latitude) && Number.isFinite(longitude);
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
