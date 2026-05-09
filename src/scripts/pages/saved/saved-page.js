import { createIcons, icons } from 'lucide';
import '../../components/back-link.js';
import '../../components/my-toast.js';
import HomeRepository from '../../data/story-repository.js';
import SavedPresenter from './saved-presenter.js';

export default class SavedPage {
  #presenter = null;

  async render() {
    return /* html */ `
      <section class="home container">
        <div class="home__shell">
          <section class="home__stories-section" aria-label="Story tersimpan">
            <div class="home__section-head">
              <div>
                <p class="home__eyebrow">Menu Tersimpan</p>
                <h1 class="home__section-title">Story yang Disimpan</h1>
              </div>
              <app-back-link href="#/"></app-back-link>
            </div>

            <p class="home__description">Kumpulan cerita yang Anda bookmark akan muncul di sini. Anda dapat menghapusnya kapan saja.</p>

            <div id="saved-stories-container"></div>
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

    this.#presenter = new SavedPresenter({
      view: this,
      model: HomeRepository,
    });

    await this.#presenter.getSavedStories();
    this.#setupListInteractivityControls();
  }

  showLoading() {
    const container = document.getElementById('saved-stories-container');
    if (container) {
      container.innerHTML = `
        <div class="home__story-empty" style="text-align: center; padding: 3rem;">
          <p>Loading saved stories...</p>
        </div>
      `;
    }
  }

  hideLoading() {
    // Content is already handled by populateSavedStories.
  }

  populateSavedStories(stories) {
    const container = document.getElementById('saved-stories-container');
    if (!container) return;

    if (stories.length) {
      container.innerHTML = /* html */ `
        <div class="home__story-grid">
          ${stories.map((story) => this.#buildStoryCard(story)).join('')}
        </div>
      `;
      createIcons({ icons });
    } else {
      container.innerHTML = `
        <div class="home__story-empty">
          <p class="home__story-empty-title">Belum ada story tersimpan</p>
          <p class="home__story-empty-text">Buka halaman Beranda dan tekan tombol bookmark pada kartu story untuk menyimpannya.</p>
        </div>
      `;
    }
  }

  populateError(message) {
    const container = document.getElementById('saved-stories-container');
    if (container) {
      container.innerHTML = `
        <div class="home__story-empty">
          <p class="home__story-empty-title">Gagal memuat story tersimpan</p>
          <p class="home__story-empty-text">${this.#escapeHtml(message || 'Terjadi kesalahan saat memuat data tersimpan.')}</p>
        </div>
      `;
    }
  }

  #buildStoryCard(story) {
    const title = this.#escapeHtml(story.name || 'Tanpa nama');
    const description = this.#escapeHtml(this.#truncate(story.description || 'Tidak ada deskripsi', 120));
    const imageUrl = this.#escapeAttribute(story.photoUrl || '');
    const createdAt = this.#formatDate(story.createdAt);
    const locationText = this.#formatStoryLocation(story);

    return /* html */ `
      <article id="saved-story-card-${story.id}" class="home__story-card" aria-label="Story tersimpan ${title}">
        <figure class="home__story-figure">
          <img class="home__story-image" src="${imageUrl}" alt="Foto story ${title}" />
        </figure>

        <div class="home__story-content">
          <div class="home__story-topline">
            <span class="home__story-location">${locationText}</span>
            <span class="home__story-time">${createdAt}</span>
          </div>

          <h2 class="home__story-title">${title}</h2>
          <p class="home__story-excerpt">${description}</p>
          <div class="home__story-actions">
            <button
              type="button"
              class="home__story-save-btn is-saved"
              data-toggle-save-story-id="${story.id}"
              aria-pressed="true"
              aria-label="Hapus dari tersimpan"
              title="Hapus dari tersimpan"
            >
              <i data-lucide="bookmark" aria-hidden="true"></i>
              <span class="sr-only">Hapus dari tersimpan</span>
            </button>
            <a class="home__story-link" href="#/story/${story.id}">Lihat detail</a>
          </div>
        </div>
      </article>
    `;
  }

  #setupListInteractivityControls() {
    const storiesContainer = document.getElementById('saved-stories-container');
    if (!storiesContainer) return;

    storiesContainer.addEventListener('click', (event) => {
      const targetElement = event.target instanceof Element ? event.target : null;
      const saveButton = targetElement?.closest('[data-toggle-save-story-id]');

      if (!saveButton) {
        return;
      }

      const storyId = saveButton.getAttribute('data-toggle-save-story-id');
      if (!storyId) {
        return;
      }

      this.#presenter.toggleSavedStory(storyId);
    });
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

  #formatStoryLocation(story) {
    const latitude = Number.parseFloat(story?.lat);
    const longitude = Number.parseFloat(story?.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return 'Tanpa lokasi';
    }

    return `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
  }

  #formatDate(dateValue) {
    if (!dateValue) {
      return 'Baru saja';
    }

    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateValue));
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