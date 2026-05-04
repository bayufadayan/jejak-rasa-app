import '../../components/back-link.js';
import '../../components/field-group.js';
import '../../components/my-toast.js';
import AddStoryPresenter from './add-story-presenter.js';
import * as API from '../../data/api.js';

export default class AddStoryPage {
  #presenter = null;
  #photoPreview = null;

  async render() {
    return /* html */ `
      <section class="container add-story">
        <div class="add-story__shell">
          <header class="add-story__header">
            <app-back-link href="#/"></app-back-link>
            <div>
              <p class="add-story__eyebrow">Bagikan cerita</p>
              <h1 class="add-story__title">Buat cerita baru</h1>
            </div>
            <p class="add-story__description">Ceritakan momen spesial Anda melalui foto dan deskripsi yang penuh makna. Lokasi bersifat opsional untuk peta jejak cerita.</p>
          </header>

          <div class="add-story__layout">
            <article class="add-story__form-card">
              <form class="add-story__form">
                <field-group type="textarea" id="description" label="Deskripsi cerita" required></field-group>

                <div class="add-story__photo-group">
                  <label for="photo" class="add-story__photo-label">Foto cerita <span class="add-story__required">*</span></label>
                  <input type="file" id="photo" accept="image/*" class="add-story__photo-input" required />
                  <div id="photo-preview" class="add-story__photo-preview"></div>
                  <p class="add-story__photo-hint">Format: JPG, PNG, GIF. Ukuran maksimal: 1MB</p>
                </div>

                <div class="add-story__coordinates-group">
                  <div class="add-story__coordinates-header">
                    <p class="add-story__coordinates-label">Lokasi cerita (opsional)</p>
                    <button type="button" class="add-story__clear-coords-btn" id="clear-coords-btn">Hapus lokasi</button>
                  </div>

                  <field-group type="number" id="latitude" label="Latitude" step="0.0001"></field-group>
                  <field-group type="number" id="longitude" label="Longitude" step="0.0001"></field-group>

                  <div class="add-story__map-card" id="map-preview">
                    <div class="add-story__map-surface">
                      <span class="add-story__map-text">Klik untuk memilih lokasi di peta (fitur mendatang)</span>
                    </div>
                  </div>
                </div>

                <button type="submit" class="main__btn add-story__submit-btn">Bagikan cerita</button>
              </form>
            </article>

            <aside class="add-story__preview-panel">
              <div class="add-story__preview-card">
                <p class="add-story__preview-label">Preview cerita</p>
                <div id="preview-figure" class="add-story__preview-figure" style="display: none;">
                  <img id="preview-image" src="" alt="" />
                </div>
                <div id="preview-empty" class="add-story__preview-empty">
                  <p>Foto akan tampil di sini</p>
                </div>
                <div id="preview-content" class="add-story__preview-content">
                  <p id="preview-desc" class="add-story__preview-desc">Deskripsi akan tampil di sini</p>
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

    this.#presenter = new AddStoryPresenter({
      view: this,
      model: API,
    });

    this.#setupForm();
    this.#setupPhotoPreview();
    this.#setupCoordinatesClear();
  }

  #setupForm() {
    const form = document.querySelector('.add-story__form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = document.querySelector('#description textarea').value;
      const photoInput = document.querySelector('#photo');
      const latitudeInput = document.querySelector('#latitude input');
      const longitudeInput = document.querySelector('#longitude input');

      if (!description || !photoInput.files[0]) {
        this.showToast('error', 'Deskripsi dan foto harus diisi');
        return;
      }

      const data = {
        description,
        photo: photoInput.files[0],
        lat: latitudeInput.value ? parseFloat(latitudeInput.value) : null,
        lon: longitudeInput.value ? parseFloat(longitudeInput.value) : null,
      };

      await this.#presenter.addStory(data);
    });
  }

  #setupPhotoPreview() {
    const photoInput = document.querySelector('#photo');
    const previewFigure = document.querySelector('#preview-figure');
    const previewEmpty = document.querySelector('#preview-empty');
    const previewImage = document.querySelector('#preview-image');

    photoInput.addEventListener('change', (event) => {
      const file = event.target.files[0];

      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImage.src = e.target.result;
          previewImage.alt = 'Preview foto cerita';
          previewFigure.style.display = 'block';
          previewEmpty.style.display = 'none';
        };
        reader.readAsDataURL(file);
      } else {
        previewFigure.style.display = 'none';
        previewEmpty.style.display = 'block';
      }
    });

    const descriptionTextarea = document.querySelector('#description textarea');
    descriptionTextarea.addEventListener('input', (event) => {
      const previewDesc = document.querySelector('#preview-desc');
      previewDesc.textContent = event.target.value || 'Deskripsi akan tampil di sini';
    });
  }

  #setupCoordinatesClear() {
    const clearBtn = document.querySelector('#clear-coords-btn');
    const latInput = document.querySelector('#latitude input');
    const lonInput = document.querySelector('#longitude input');

    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      latInput.value = '';
      lonInput.value = '';
    });
  }

  showLoading(isLoading) {
    const submitBtn = document.querySelector('.add-story__submit-btn');

    if (isLoading) {
      submitBtn.classList.add('main__btn--loading');
      submitBtn.innerHTML = `
        <span style="display:flex; align-items:center; gap:8px; justify-content:center;">
          <svg width="18" height="18" viewBox="0 0 50 50">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="currentColor"
              stroke-width="4"
              stroke-linecap="round"
              stroke-dasharray="90 150">
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 25 25"
                to="360 25 25"
                dur="1s"
                repeatCount="indefinite" />
            </circle>
          </svg>
          <span>Mengunggah...</span>
        </span>
      `;
    } else {
      submitBtn.classList.remove('main__btn--loading');
      submitBtn.textContent = 'Bagikan cerita';
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
    }, 2500);
  }

  addStorySuccessfully(message) {
    this.showToast('success', message);
    location.hash = '/';
  }

  addStoryFailed(message) {
    this.showToast('error', message);
  }
}
