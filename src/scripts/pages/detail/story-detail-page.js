import 'leaflet/dist/leaflet.css';
import '../../components/back-link.js';
import { getStoryById } from '../../data/api.js';
import { parseActivePathname } from '../../routes/url-parser.js';
import Map from '../../utils/map.js';

export default class StoryDetailPage {
  #map = null;
  #story = null;
  #loadError = null;

  async render() {
    const { id } = parseActivePathname();

    try {
      const response = await getStoryById(id);

      if (!response.ok) {
        throw new Error(response.message || 'Gagal memuat detail cerita');
      }

      this.#story = response.story;
    } catch (error) {
      console.error('StoryDetailPage render error:', error);
      this.#loadError = error.message || 'Cerita tidak ditemukan';
    }

    if (this.#loadError || !this.#story) {
      return `
        <section class="story-detail container">
          <div class="story-detail__empty">
            <p class="story-detail__eyebrow">Cerita tidak ditemukan</p>
            <h1 class="story-detail__title">Detail cerita yang kamu cari belum tersedia.</h1>
            <p class="story-detail__desc">${this.#escapeHtml(this.#loadError || 'ID tidak valid atau story sudah dihapus.')}</p>
            <app-back-link class="story-detail__back-link" href="#/"></app-back-link>
          </div>
        </section>
      `;
    }

    const story = this.#story;
    const hasLocation = this.#hasValidCoordinate(story);
    const locationText = hasLocation
      ? `${Number.parseFloat(story.lat).toFixed(5)}, ${Number.parseFloat(story.lon).toFixed(5)}`
      : 'Tanpa lokasi';
    const createdAt = this.#formatDate(story.createdAt);
    const authorName = this.#escapeHtml(story.name || 'Anonim');
    const description = this.#escapeHtml(story.description || 'Tidak ada deskripsi');
    const imageUrl = this.#escapeAttribute(story.photoUrl || '');

    return /* html */ `
      <section class="story-detail container">
        <div class="story-detail__shell">
          <header class="story-detail__hero">
            <app-back-link href="#/"></app-back-link>
            <p class="story-detail__eyebrow">Detail Cerita</p>
            <h1 class="story-detail__title">${authorName}</h1>
            <p class="story-detail__description">${description}</p>
          </header>

          <div class="story-detail__layout">
            <article class="story-detail__card">
              <figure class="story-detail__figure">
                <img class="story-detail__image" src="${imageUrl}" alt="Foto cerita oleh ${authorName}" />
              </figure>

              <div class="story-detail__meta-grid">
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">Penulis</span>
                  <strong class="story-detail__meta-value">${authorName}</strong>
                </div>
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">Waktu</span>
                  <strong class="story-detail__meta-value">${createdAt}</strong>
                </div>
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">Lokasi</span>
                  <strong class="story-detail__meta-value">${locationText}</strong>
                </div>
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">ID Cerita</span>
                  <strong class="story-detail__meta-value story-detail__meta-value--mono">${this.#escapeHtml(story.id || '-')}</strong>
                </div>
              </div>
            </article>

            <aside class="story-detail__map-panel" aria-label="Peta lokasi cerita">
              <div class="story-detail__map-card">
                ${hasLocation ? `
                  <div class="story-detail__map-status">
                    <span class="story-detail__map-status-label">Lokasi Terdeteksi</span>
                    <span class="story-detail__map-status-value">${locationText}</span>
                  </div>
                  <div class="story-detail__map-surface" id="story-detail-map"></div>
                ` : `
                  <div class="story-detail__map-surface story-detail__map-surface--empty">
                    <p class="story-detail__map-empty-text">Cerita ini tidak menyertakan data lokasi.</p>
                  </div>
                `}

                <div class="story-detail__map-meta">
                  <p class="story-detail__map-label">Lokasi pada peta</p>
                  <strong class="story-detail__map-title">${locationText}</strong>
                  ${hasLocation
                    ? '<p class="story-detail__map-description">Gunakan layer control di pojok kanan atas peta untuk beralih tampilan antara OSM, MapTiler Streets, Satellite, atau Outdoor.</p>'
                    : '<p class="story-detail__map-description">Cerita ini dibuat tanpa data koordinat, sehingga peta tidak ditampilkan.</p>'
                  }
                </div>
              </div>
            </aside>
          </div>
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

    if (this.#story && this.#hasValidCoordinate(this.#story)) {
      await this.#setupMap();
    }
  }

  async #setupMap() {
    const story = this.#story;
    const lat = Number.parseFloat(story.lat);
    const lon = Number.parseFloat(story.lon);

    const mapSurface = document.getElementById('story-detail-map');
    if (!mapSurface) return;

    try {
      this.#map = await Map.build('#story-detail-map', {
        zoom: 14,
        center: [lat, lon],
        scrollWheelZoom: true,
        zoomControl: true,
      });

      this.#map.invalidateSize();

      const authorName = this.#escapeHtml(story.name || 'Anonim');
      const description = this.#escapeHtml(
        (story.description || '').slice(0, 120) + ((story.description || '').length > 120 ? '...' : ''),
      );

      this.#map.addMarker([lat, lon], {}, {
        content: `
          <div class="story-detail__map-popup">
            <p class="story-detail__map-popup-author">${authorName}</p>
            <p class="story-detail__map-popup-desc">${description}</p>
            <p class="story-detail__map-popup-coords">${lat.toFixed(5)}, ${lon.toFixed(5)}</p>
          </div>
        `,
        options: {
          maxWidth: 260,
          closeButton: true,
          autoPan: true,
        },
      });
    } catch (error) {
      console.error('StoryDetailPage map error:', error);
      mapSurface.innerHTML = '<p style="padding:1rem;color:#888">Peta gagal dimuat.</p>';
    }
  }

  #hasValidCoordinate(story) {
    const lat = Number.parseFloat(story?.lat);
    const lon = Number.parseFloat(story?.lon);
    return Number.isFinite(lat) && Number.isFinite(lon);
  }

  #formatDate(dateValue) {
    if (!dateValue) return 'Baru saja';
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(dateValue));
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