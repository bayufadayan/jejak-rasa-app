import { getStoryById } from '../../data/story-data.js';
import { parseActivePathname } from '../../routes/url-parser.js';

export default class StoryDetailPage {
  async render() {
    const { id } = parseActivePathname();
    const story = getStoryById(id);

    if (!story) {
      return `
        <section class="story-detail container">
          <div class="story-detail__empty">
            <p class="story-detail__eyebrow">Cerita tidak ditemukan</p>
            <h1 class="story-detail__title">Detail cerita yang kamu cari belum tersedia.</h1>
            <a class="story-detail__back-link" href="#/">Kembali ke beranda</a>
          </div>
        </section>
      `;
    }

    return `
      <section class="story-detail container">
        <div class="story-detail__shell">
          <header class="story-detail__hero">
            <a class="story-detail__back-link" href="#/">Kembali ke beranda</a>
            <p class="story-detail__eyebrow">Detail Cerita</p>
            <h1 class="story-detail__title">${story.title}</h1>
            <p class="story-detail__description">${story.detail}</p>
          </header>

          <div class="story-detail__layout">
            <article class="story-detail__card">
              <figure class="story-detail__figure">
                <img class="story-detail__image" src="${story.image}" alt="${story.imageAlt}" />
              </figure>

              <div class="story-detail__meta-grid">
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">Lokasi</span>
                  <strong class="story-detail__meta-value">${story.location}</strong>
                </div>
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">Waktu</span>
                  <strong class="story-detail__meta-value">${story.time}</strong>
                </div>
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">Koordinat</span>
                  <strong class="story-detail__meta-value">${story.latitude}, ${story.longitude}</strong>
                </div>
                <div class="story-detail__meta-item">
                  <span class="story-detail__meta-label">Map Label</span>
                  <strong class="story-detail__meta-value">${story.mapLabel}</strong>
                </div>
              </div>
            </article>

            <aside class="story-detail__map-panel" aria-label="Peta lokasi cerita">
              <div class="story-detail__map-card">
                <div class="story-detail__map-surface">
                  <span class="story-detail__map-route"></span>
                  <span class="story-detail__map-marker">${story.location}</span>
                </div>

                <div class="story-detail__map-meta">
                  <p class="story-detail__map-label">Lokasi pada peta</p>
                  <strong class="story-detail__map-title">${story.mapLabel}</strong>
                  <p class="story-detail__map-description">Marker visual ini dipakai sebagai preview detail lokasi cerita sebelum data peta digital penuh diaktifkan.</p>
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
  }
}