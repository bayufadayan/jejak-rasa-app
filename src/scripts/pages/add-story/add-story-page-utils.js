export const PREVIEW_WIDTH = 1280;
export const PREVIEW_HEIGHT = 800;

export function parseOptionalCoordinate(value) {
  const trimmedValue = String(value ?? '').trim();

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

export function validatePhotoFile(photoFile) {
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

export function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function extractResultLatitude(result) {
  return Number.parseFloat(
    result?.y
    ?? result?.lat
    ?? result?.latitude
    ?? result?.raw?.lat
    ?? result?.raw?.latitude
    ?? '',
  );
}

export function extractResultLongitude(result) {
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

export function loadImage(file) {
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

export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
  });
}

export function normalizeFilename(filename) {
  const baseName = String(filename ?? '').replace(/\.[^.]+$/, '') || 'story-photo';
  return `${baseName}.jpg`;
}

export function getCameraButtonContent() {
  return `
      <i data-lucide="camera" aria-hidden="true"></i>
      <span>Ambil dari Kamera</span>
    `;
}

export function getLoadingButtonContent() {
  return `
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
}