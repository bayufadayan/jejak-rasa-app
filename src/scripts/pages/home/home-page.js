import { storyList } from '../../data/story-data.js';

export default class HomePage {
  async render() {
    const featuredStories = storyList.slice(0, 6);

    return `
      <section class="home container">
        <div class="home__shell">
          <section class="home__map-panel" aria-label="Peta Jejak Rasa">
            <div class="home__header-top">
              <div>
                <div class="home__eyebrow">Jejak Rasa</div>
                <h1 class="home__title">Peta Rasa yang Pernah Disinggahi</h1>
              </div>
              <a class="home__add-btn" href="#/add-story" aria-label="Tambah cerita baru">Tambah cerita</a>
            </div>
            <p class="home__description">Layar depan untuk menampilkan jejak cerita dalam suasana hangat, nostalgia, dan penuh rute kenangan.</p>

            <div class="home__map-card">
              <div class="home__map-surface" aria-hidden="true">
                <span class="home__map-route home__map-route--one"></span>
                <span class="home__map-route home__map-route--two"></span>
                <span class="home__map-route home__map-route--three"></span>

                <span class="home__map-marker home__map-marker--one">Bandung</span>
                <span class="home__map-marker home__map-marker--two">Yogyakarta</span>
                <span class="home__map-marker home__map-marker--three">Surabaya</span>
              </div>

              <div class="home__map-meta">
                <div>
                  <p class="home__meta-label">Total Story</p>
                  <strong class="home__meta-value">6 cerita</strong>
                </div>
                <div>
                  <p class="home__meta-label">Status</p>
                  <strong class="home__meta-value">Siap tampil</strong>
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
                <p class="home__section-description">Grid berikut disiapkan untuk menampung story user dengan tampilan kartu memanjang di desktop dan lebih ringkas di mobile.</p>
                <a href="#/add-story" class="home__add-btn">+ Tambah Cerita Baru</a>
              </div>
            </div>

            <div class="home__story-grid">
              ${featuredStories.map((story) => `
                <a class="home__story-card" href="#/story/${story.id}" aria-label="Buka detail cerita ${story.title}">
                  <figure class="home__story-figure">
                    <img class="home__story-image" src="${story.image}" alt="${story.imageAlt}" />
                  </figure>

                  <div class="home__story-content">
                    <div class="home__story-topline">
                      <span class="home__story-location">${story.location}</span>
                      <span class="home__story-time">${story.time}</span>
                    </div>

                    <h3 class="home__story-title">${story.title}</h3>
                    <p class="home__story-excerpt">${story.excerpt}</p>
                    <span class="home__story-link">Lihat detail</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </section>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const navbar = document.getElementsByClassName("main__navbar")[0];
    navbar.classList.remove("hide-me");
    window.scrollTo(0, 0);
  }
}
