import { createIcons, icons } from 'lucide';
import 'leaflet/dist/leaflet.css';
import '../../components/back-link.js';
import '../../components/field-group.js';
import '../../components/my-toast.js';
import AddStoryPresenter from './add-story-presenter.js';
import * as API from '../../data/api.js';
import Map from '../../utils/map.js';

export default class AddStoryPage {
  #presenter = null;
  #photoBlob = null;
  #photoFile = null;
  #photoPreviewCanvas = null;
  #photoPreviewEmpty = null;
  #cameraPanel = null;
  #cameraVideo = null;
  #cameraSelect = null;
  #cameraOpenButton = null;
  #cameraCaptureButton = null;
  #cameraCloseButton = null;
  #cameraStream = null;
  #isCameraOpen = false;
  #map = null;
  #mapMarker = null;
  #mapSearchDebounce = null;

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
                <div class="add-story__form-intro">
                  <p class="add-story__form-intro-eyebrow">Isi Form Cerita</p>
                  <p class="add-story__form-intro-text">Lengkapi deskripsi, foto, dan lokasi agar cerita yang dibagikan lebih jelas dan informatif.</p>
                </div>

                <field-group type="textarea" id="description" label="Deskripsi cerita" placeholder="Tulis deskripsi cerita Anda di sini..." required></field-group>

                <div class="add-story__photo-group">
                  <p class="add-story__photo-label">Foto cerita <span class="add-story__required">*</span></p>
                  <div class="add-story__photo-actions">
                    <input type="file" id="photo-gallery-input" accept="image/*" hidden />
                    <button type="button" class="add-story__photo-action-btn add-story__photo-action-btn--gallery" id="photo-gallery-button">
                      <i data-lucide="images" aria-hidden="true"></i>
                      <span>Pilih dari Gallery</span>
                    </button>
                    <button type="button" class="add-story__photo-action-btn add-story__photo-action-btn--camera" id="photo-camera-button">
                      <i data-lucide="camera" aria-hidden="true"></i>
                      <span>Ambil dari Kamera</span>
                    </button>
                  </div>
                  <div class="add-story__camera-panel" id="camera-panel" hidden>
                    <select id="camera-select" class="add-story__camera-select" aria-label="Pilih kamera perangkat"></select>
                    <div class="add-story__camera-view">
                      <video id="camera-video" class="add-story__camera-video" playsinline muted>Video stream not available.</video>
                    </div>
                    <div class="add-story__camera-tools">
                      <div class="add-story__camera-tools-buttons">
                        <button type="button" class="add-story__camera-capture-btn" id="camera-capture-button">Ambil Gambar</button>
                        <button type="button" class="add-story__camera-close-btn" id="camera-close-button">Tutup Kamera</button>
                      </div>
                    </div>
                  </div>
                  <div id="photo-preview" class="add-story__photo-preview">
                    <canvas id="photo-preview-canvas" class="add-story__photo-preview-canvas" hidden></canvas>
                    <div id="photo-preview-empty" class="add-story__photo-preview-empty">
                      <p>Foto akan tampil di sini</p>
                    </div>
                  </div>
                  <p class="add-story__photo-hint">Gunakan gallery untuk memilih file, atau kamera untuk menangkap foto langsung. Hasilnya akan diproses lewat Canvas API.</p>
                  <p id="photo-error-message" class="auth__field-error-message add-story__field-error-message"></p>
                </div>

                <div class="add-story__coordinates-group">
                  <div class="add-story__coordinates-header">
                    <p class="add-story__coordinates-label">Lokasi cerita (opsional)</p>
                    <button type="button" class="add-story__clear-coords-btn" id="clear-coords-btn">Hapus lokasi</button>
                  </div>

                  <field-group type="number" id="latitude" label="Latitude" step="any" placeholder="Masukkan latitude..."></field-group>
                  <field-group type="number" id="longitude" label="Longitude" step="any" placeholder="Masukkan longitude..."></field-group>

                  <div class="add-story__map-toolbar">
                    <div class="add-story__map-search">
                      <label for="map-search-input" class="add-story__map-search-label">Cari tempat</label>
                      <input id="map-search-input" type="search" class="add-story__map-search-input" placeholder="Contoh: Monas, Jakarta" autocomplete="off" />
                      <ul id="map-search-results" class="add-story__map-search-results" hidden></ul>
                    </div>
                    <div class="add-story__map-zoom-tools" role="group" aria-label="Kontrol zoom peta">
                      <button type="button" id="map-zoom-out" class="add-story__map-zoom-btn">-</button>
                      <button type="button" id="map-zoom-in" class="add-story__map-zoom-btn">+</button>
                    </div>
                  </div>

                  <div class="add-story__map-card">
                    <div class="add-story__map-surface" id="add-story-map"></div>
                    <div class="add-story__map-loading" id="add-story-map-loading" hidden>
                      <span class="add-story__map-text">Memuat peta...</span>
                    </div>
                  </div>
                </div>

                <button type="submit" class="main__btn add-story__submit-btn">Bagikan cerita</button>
              </form>
            </article>

            <aside class="add-story__preview-panel">
              <div class="add-story__preview-card">
                <p class="add-story__preview-label  ">Preview cerita</p>
                <div id="preview-figure" class="add-story__preview-figure" style="display: none;">
                  <img id="preview-image" src="" alt="preview-image" />
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
    this.#setupPhotoTools();
    this.#setupPhotoPreview();
    this.#setupCoordinatesClear();
    this.#setupCoordinateInputs();
    this.#setupLiveValidation();
    this.#setupMapToolbar();
    await this.#presenter.showAddStoryMap();
    createIcons({ icons });
  }

  async initialMap() {
    this.#map = await Map.build('#add-story-map', {
      zoom: 13,
      locate: true,
      scrollWheelZoom: true,
      zoomControl: false,
    });

    this.#map.invalidateSize();

    const center = this.#map.getCenter();
    this.#placeMarker(center.latitude, center.longitude, false);

    this.#mapMarker = this.#map.addMarker([center.latitude, center.longitude], {
      draggable: true,
    });

    this.#mapMarker.addEventListener('move', (event) => {
      const { lat, lng } = event.target.getLatLng();
      this.#updateCoordinateInputs(lat, lng);
    });

    this.#map.addMapEventListener('click', (event) => {
      const { lat, lng } = event.latlng;
      this.#placeMarker(lat, lng);
    });
  }

  #setupMapToolbar() {
    const zoomInButton = document.querySelector('#map-zoom-in');
    const zoomOutButton = document.querySelector('#map-zoom-out');
    const searchInput = document.querySelector('#map-search-input');
    const searchResults = document.querySelector('#map-search-results');

    zoomInButton.addEventListener('click', () => {
      if (!this.#map) {
        return;
      }
      this.#map.zoomIn();
    });

    zoomOutButton.addEventListener('click', () => {
      if (!this.#map) {
        return;
      }
      this.#map.zoomOut();
    });

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

      if (!resultButton) {
        return;
      }

      const latitude = Number.parseFloat(resultButton.dataset.lat || '');
      const longitude = Number.parseFloat(resultButton.dataset.lng || '');

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        this.showToast('error', 'Koordinat lokasi tidak valid');
        return;
      }

      this.#placeMarker(latitude, longitude);
      searchInput.value = resultButton.dataset.label || resultButton.textContent.trim();
      this.#renderMapSearchResults([]);
      searchInput.focus();
    });

    // Keyboard navigation for search results (ArrowUp / ArrowDown / Enter / Escape)
    searchInput.addEventListener('keydown', (event) => {
      const items = searchResults.querySelectorAll('button[data-lat]');
      if (!items.length) return;

      const current = searchResults.querySelector('button[data-lat]:focus');
      const idx = [...items].indexOf(current);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        (items[idx + 1] ?? items[0]).focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        (items[idx - 1] ?? items[items.length - 1]).focus();
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
        (items[idx + 1] ?? items[0]).focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        (idx <= 0 ? searchInput : items[idx - 1]).focus();
      } else if (event.key === 'Escape') {
        this.#renderMapSearchResults([]);
        searchInput.focus();
      } else if (event.key === 'Enter' && current?.dataset?.lat) {
        event.preventDefault();
        const latitude = Number.parseFloat(current.dataset.lat);
        const longitude = Number.parseFloat(current.dataset.lng);
        if (!Number.isNaN(latitude) && !Number.isNaN(longitude)) {
          this.#placeMarker(latitude, longitude);
          searchInput.value = current.dataset.label || current.textContent.trim();
          this.#renderMapSearchResults([]);
          searchInput.focus();
        }
      }
    });

    searchInput.addEventListener('blur', () => {
      setTimeout(() => {
        this.#renderMapSearchResults([]);
      }, 120);
    });

    searchInput.addEventListener('focus', () => {
      if (!searchInput.value.trim()) {
        return;
      }

      this.#handleMapSearch(searchInput.value);
    });

    searchInput.addEventListener('search', () => {
      this.#renderMapSearchResults([]);
    });
  }

  async #handleMapSearch(query) {
    if (!this.#map) {
      return;
    }

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
    const searchResults = document.querySelector('#map-search-results');

    if (!results.length) {
      searchResults.hidden = true;
      searchResults.innerHTML = '';
      return;
    }

    searchResults.innerHTML = results
      .map((result) => {
        const latitude = this.#extractResultLatitude(result);
        const longitude = this.#extractResultLongitude(result);

        if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
          return '';
        }

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

  #placeMarker(latitude, longitude, shouldFly = true) {
    if (!this.#mapMarker || !this.#map) {
      this.#updateCoordinateInputs(latitude, longitude);
      return;
    }

    this.#mapMarker.setLatLng([latitude, longitude]);
    this.#updateCoordinateInputs(latitude, longitude);

    if (shouldFly) {
      this.#map.flyTo([latitude, longitude]);
    }
  }

  #escapeHtml(text) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  #extractResultLatitude(result) {
    return Number.parseFloat(
      result?.y
      ?? result?.lat
      ?? result?.latitude
      ?? result?.raw?.lat
      ?? result?.raw?.latitude
      ?? '',
    );
  }

  #extractResultLongitude(result) {
    return Number.parseFloat(
      result?.x
      ?? result?.lng
      ?? result?.lon
      ?? result?.longitude
      ?? result?.raw?.lon
      ?? result?.raw?.lng
      ?? result?.raw?.longitude
      ?? '',
    );
  }

  #setupCoordinateInputs() {
    const latitudeInput = document.querySelector('#latitude input');
    const longitudeInput = document.querySelector('#longitude input');

    const moveMarkerByInput = () => {
      const latitude = parseFloat(latitudeInput.value);
      const longitude = parseFloat(longitudeInput.value);

      if (Number.isNaN(latitude) || Number.isNaN(longitude) || !this.#mapMarker || !this.#map) {
        return;
      }

      this.#placeMarker(latitude, longitude);
    };

    latitudeInput.addEventListener('change', moveMarkerByInput);
    longitudeInput.addEventListener('change', moveMarkerByInput);
  }

  #updateCoordinateInputs(latitude, longitude) {
    const latitudeInput = document.querySelector('#latitude input');
    const longitudeInput = document.querySelector('#longitude input');

    latitudeInput.value = Number(latitude).toFixed(6);
    longitudeInput.value = Number(longitude).toFixed(6);
  }

  #setupForm() {
    const form = document.querySelector('.add-story__form');
    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const description = document.querySelector('#description textarea').value.trim();
      const latitudeInput = document.querySelector('#latitude input');
      const longitudeInput = document.querySelector('#longitude input');

      const validation = this.#validateStoryForm({
        description,
        photoFile: this.#photoFile,
        latitudeValue: latitudeInput.value,
        longitudeValue: longitudeInput.value,
      });

      if (!validation.isValid) {
        return;
      }

      const data = {
        description: validation.description,
        photo: validation.photoFile,
        lat: validation.latitude,
        lon: validation.longitude,
      };

      if (this.#isCameraOpen) {
        await this.#closeCameraPanel();
      }

      await this.#presenter.addStory(data);
    });
  }

  #setupLiveValidation() {
    const descriptionTextarea = document.querySelector('#description textarea');
    const latitudeInput = document.querySelector('#latitude input');
    const longitudeInput = document.querySelector('#longitude input');

    descriptionTextarea.addEventListener('input', () => {
      if (descriptionTextarea.value.trim()) {
        this.#setFieldError('description', '');
      }
    });

    latitudeInput.addEventListener('input', () => {
      if (!latitudeInput.value.trim() || this.#isValidOptionalCoordinate(latitudeInput.value)) {
        this.#setFieldError('latitude', '');
      }
    });

    longitudeInput.addEventListener('input', () => {
      if (!longitudeInput.value.trim() || this.#isValidOptionalCoordinate(longitudeInput.value)) {
        this.#setFieldError('longitude', '');
      }
    });
  }

  #setupPhotoTools() {
    const galleryInput = document.querySelector('#photo-gallery-input');
    const galleryButton = document.querySelector('#photo-gallery-button');
    this.#cameraPanel = document.querySelector('#camera-panel');
    this.#cameraVideo = document.querySelector('#camera-video');
    this.#cameraSelect = document.querySelector('#camera-select');
    this.#cameraOpenButton = document.querySelector('#photo-camera-button');
    this.#cameraCaptureButton = document.querySelector('#camera-capture-button');
    this.#cameraCloseButton = document.querySelector('#camera-close-button');

    this.#cameraPanel.hidden = true;

    galleryButton.addEventListener('click', () => {
      galleryInput.click();
    });

    galleryInput.addEventListener('change', async (event) => {
      const file = event.target.files?.[0];

      if (!file) {
        return;
      }

      try {
        await this.#updatePhotoPreviewFromFile(file);
      } catch (error) {
        console.error('#setupPhotoTools gallery error:', error);
        this.#setFieldError('photo', error.message || 'Foto dari gallery gagal diproses');
        this.showToast('error', 'Foto dari gallery gagal diproses');
      } finally {
        event.target.value = '';
      }
    });

    this.#cameraOpenButton.addEventListener('click', async () => {
      if (this.#isCameraOpen) {
        await this.#closeCameraPanel();
        return;
      }

      await this.#openCameraPanel();
    });

    this.#cameraCaptureButton.addEventListener('click', async () => {
      try {
        await this.#capturePhotoFromCamera();
      } catch (error) {
        console.error('#setupPhotoTools capture error:', error);
        this.#setFieldError('photo', error.message || 'Gagal mengambil gambar dari kamera');
        this.showToast('error', 'Gagal mengambil gambar dari kamera');
      }
    });

    this.#cameraCloseButton.addEventListener('click', async () => {
      await this.#closeCameraPanel();
    });

    this.#cameraSelect.addEventListener('change', async () => {
      if (!this.#isCameraOpen) {
        return;
      }

      await this.#startCamera();
    });

    this.#resetPhotoPreview();
  }

  #setupPhotoPreview() {
    const descriptionTextarea = document.querySelector('#description textarea');
    const previewDesc = document.querySelector('#preview-desc');

    descriptionTextarea.addEventListener('input', (event) => {
      previewDesc.textContent = event.target.value || 'Deskripsi akan tampil di sini';
    });
  }

  async #openCameraPanel() {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.showToast('error', 'Browser tidak mendukung kamera');
      return;
    }

    this.#cameraPanel.hidden = false;
    this.#isCameraOpen = true;
    this.#cameraOpenButton.innerHTML = 'Tutup Kamera';
    createIcons({ icons });

    const started = await this.#startCamera();
    if (!started) {
      await this.#closeCameraPanel();
    }
  }

  async #closeCameraPanel() {
    await this.#stopCamera();
    this.#cameraPanel.hidden = true;
    this.#isCameraOpen = false;
    this.#cameraOpenButton.innerHTML = this.#getCameraButtonContent();
    createIcons({ icons });
  }

  async #startCamera() {
    await this.#stopCamera();

    const deviceId = this.#cameraSelect.value ? { exact: this.#cameraSelect.value } : undefined;

    try {
      this.#cameraStream = await navigator.mediaDevices.getUserMedia({
        video: {
          aspectRatio: 4 / 3,
          deviceId,
        },
      });

      if (!Array.isArray(window.currentStreams)) {
        window.currentStreams = [];
      }
      window.currentStreams.push(this.#cameraStream);

      this.#cameraVideo.srcObject = this.#cameraStream;
      await this.#cameraVideo.play();
      await this.#populateCameraDeviceList(this.#cameraStream);

      return true;
    } catch (error) {
      console.error('#startCamera error:', error);
      this.showToast('error', 'Kamera tidak dapat dibuka');
      await this.#stopCamera();

      return false;
    }
  }

  async #stopCamera() {
    if (this.#cameraVideo) {
      this.#cameraVideo.pause();
      this.#cameraVideo.srcObject = null;
    }

    if (this.#cameraStream) {
      this.#cameraStream.getTracks().forEach((track) => track.stop());
      this.#cameraStream = null;
    }
  }

  async #populateCameraDeviceList(stream) {
    if (!(stream instanceof MediaStream)) {
      return;
    }

    const { deviceId } = stream.getVideoTracks()[0].getSettings();
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === 'videoinput');

    const html = cameras.reduce((accumulator, device, currentIndex) => {
      return accumulator.concat(`
        <option value="${device.deviceId}" ${deviceId === device.deviceId ? 'selected' : ''}>
          ${device.label || `Camera ${currentIndex + 1}`}
        </option>
      `);
    }, '');

    this.#cameraSelect.innerHTML = html;
  }

  async #capturePhotoFromCamera() {
    if (!this.#cameraVideo?.videoWidth || !this.#cameraVideo?.videoHeight) {
      this.showToast('error', 'Kamera belum siap, coba lagi sebentar');
      return;
    }

    await this.#renderSourceToPreview(this.#cameraVideo, this.#cameraVideo.videoWidth, this.#cameraVideo.videoHeight, `camera-${Date.now()}.jpg`);
  }

  async #updatePhotoPreviewFromFile(file) {
    const image = await this.#loadImage(file);
    const filename = this.#normalizeFilename(file.name || `gallery-${Date.now()}.jpg`);

    await this.#renderSourceToPreview(image, image.naturalWidth, image.naturalHeight, filename);
  }

  #loadImage(file) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const objectUrl = URL.createObjectURL(file);

      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };

      image.onerror = (error) => {
        URL.revokeObjectURL(objectUrl);
        reject(error);
      };

      image.src = objectUrl;
    });
  }

  async #renderSourceToPreview(source, sourceWidth, sourceHeight, filename) {
    const canvas = this.#photoPreviewCanvas;
    const context = canvas.getContext('2d');
    const targetWidth = 1280;
    const targetHeight = 800;

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    context.fillStyle = '#f8ecd8';
    context.fillRect(0, 0, targetWidth, targetHeight);

    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;

    let drawWidth = targetWidth;
    let drawHeight = targetHeight;
    let drawX = 0;
    let drawY = 0;

    if (sourceRatio > targetRatio) {
      drawHeight = targetHeight;
      drawWidth = drawHeight * sourceRatio;
      drawX = (targetWidth - drawWidth) / 2;
    } else {
      drawWidth = targetWidth;
      drawHeight = drawWidth / sourceRatio;
      drawY = (targetHeight - drawHeight) / 2;
    }

    context.drawImage(source, drawX, drawY, drawWidth, drawHeight);

    const blob = await this.#canvasToBlob(canvas);
    if (!blob) {
      throw new Error('Canvas snapshot failed');
    }

    const photoFile = new File([blob], filename, { type: blob.type || 'image/jpeg' });
    const validationError = this.#validatePhotoFile(photoFile);

    if (validationError) {
      throw new Error(validationError);
    }

    this.#photoBlob = blob;
    this.#photoFile = photoFile;
    this.#setFieldError('photo', '');
    this.#showPhotoPreview();
  }

  #canvasToBlob(canvas) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
    });
  }

  #normalizeFilename(filename) {
    const baseName = filename.replace(/\.[^.]+$/, '') || 'story-photo';
    return `${baseName}.jpg`;
  }

  #resetPhotoPreview() {
    this.#photoBlob = null;
    this.#photoFile = null;

    if (!this.#photoPreviewCanvas) {
      this.#photoPreviewCanvas = document.querySelector('#photo-preview-canvas');
    }

    if (!this.#photoPreviewEmpty) {
      this.#photoPreviewEmpty = document.querySelector('#photo-preview-empty');
    }

    const context = this.#photoPreviewCanvas.getContext('2d');
    this.#photoPreviewCanvas.width = 1280;
    this.#photoPreviewCanvas.height = 800;
    context.fillStyle = '#f8ecd8';
    context.fillRect(0, 0, this.#photoPreviewCanvas.width, this.#photoPreviewCanvas.height);

    this.#photoPreviewCanvas.hidden = true;
    this.#photoPreviewEmpty.hidden = false;

    const previewFigure = document.querySelector('#preview-figure');
    const previewEmpty = document.querySelector('#preview-empty');
    previewFigure.style.display = 'none';
    previewEmpty.hidden = false;
  }

  #getCameraButtonContent() {
    return `
      <i data-lucide="camera" aria-hidden="true"></i>
      <span>Ambil dari Kamera</span>
    `;
  }

  #showPhotoPreview() {
    const previewFigure = document.querySelector('#preview-figure');
    const previewEmpty = document.querySelector('#preview-empty');
    const previewImage = document.querySelector('#preview-image');

    this.#photoPreviewCanvas.hidden = false;
    this.#photoPreviewEmpty.hidden = true;

    const dataUrl = this.#photoPreviewCanvas.toDataURL('image/jpeg', 0.92);
    previewImage.src = dataUrl;
    previewImage.alt = 'Preview foto cerita';
    previewFigure.style.display = 'block';
    previewEmpty.hidden = true;
  }

  #setupCoordinatesClear() {
    const clearBtn = document.querySelector('#clear-coords-btn');
    const latInput = document.querySelector('#latitude input');
    const lonInput = document.querySelector('#longitude input');

    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      latInput.value = '';
      lonInput.value = '';
      this.#setFieldError('latitude', '');
      this.#setFieldError('longitude', '');
    });
  }

  #validateStoryForm({ description, photoFile, latitudeValue, longitudeValue }) {
    let isValid = true;
    const latitude = this.#parseOptionalCoordinate(latitudeValue);
    const longitude = this.#parseOptionalCoordinate(longitudeValue);

    this.#clearFormErrors();

    if (!description.trim()) {
      this.#setFieldError('description', 'Deskripsi wajib diisi');
      isValid = false;
    }

    const photoValidationError = this.#validatePhotoFile(photoFile);
    if (photoValidationError) {
      this.#setFieldError('photo', photoValidationError);
      isValid = false;
    }

    if (!latitude.isValid) {
      this.#setFieldError('latitude', 'Latitude harus berupa angka desimal yang valid');
      isValid = false;
    }

    if (!longitude.isValid) {
      this.#setFieldError('longitude', 'Longitude harus berupa angka desimal yang valid');
      isValid = false;
    }

    return {
      isValid,
      description,
      photoFile,
      latitude: latitude.value,
      longitude: longitude.value,
    };
  }

  #parseOptionalCoordinate(value) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return {
        isValid: true,
        value: null,
      };
    }

    const parsedValue = Number(trimmedValue);

    if (!Number.isFinite(parsedValue)) {
      return {
        isValid: false,
        value: null,
      };
    }

    return {
      isValid: true,
      value: parsedValue,
    };
  }

  #isValidOptionalCoordinate(value) {
    return this.#parseOptionalCoordinate(value).isValid;
  }

  #validatePhotoFile(photoFile) {
    if (!(photoFile instanceof File)) {
      return 'Foto wajib diisi';
    }

    if (!photoFile.type || !photoFile.type.startsWith('image/')) {
      return 'Foto harus berupa file gambar';
    }

    if (photoFile.size > 1024 * 1024) {
      return 'Ukuran foto maksimal 1 MB';
    }

    return '';
  }

  #clearFormErrors() {
    this.#setFieldError('description', '');
    this.#setFieldError('latitude', '');
    this.#setFieldError('longitude', '');
    this.#setFieldError('photo', '');
  }

  #setFieldError(field, message) {
    const fieldError = this.#getFieldErrorElement(field);

    if (!fieldError) {
      return;
    }

    fieldError.textContent = message;
    fieldError.style.display = message ? 'block' : 'none';
  }

  #getFieldErrorElement(field) {
    const fieldMap = {
      description: '#description .auth__field-error-message',
      latitude: '#latitude .auth__field-error-message',
      longitude: '#longitude .auth__field-error-message',
      photo: '#photo-error-message',
    };

    return document.querySelector(fieldMap[field]);
  }

  showMapLoading() {
    const mapLoading = document.querySelector('#add-story-map-loading');
    mapLoading.hidden = false;
  }

  hideMapLoading() {
    const mapLoading = document.querySelector('#add-story-map-loading');
    mapLoading.hidden = true;
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
