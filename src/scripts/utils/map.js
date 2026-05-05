import * as L from 'leaflet';
import { map, tileLayer, control, marker, latLng, latLngBounds } from 'leaflet';
import * as maptilersdk from '@maptiler/leaflet-maptilersdk';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import CONFIG from '../config.js';

// Fix Leaflet default icon untuk Vite/Webpack bundler
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const MAPTILER_API_KEY = CONFIG.MAPTILER_API_KEY;
const HAS_MAPTILER_KEY = Boolean(MAPTILER_API_KEY && MAPTILER_API_KEY !== 'YOUR_MAPTILER_API_KEY_HERE');

export default class Map {
  #zoom = 5;
  #map = null;
  #searchProvider = null;
  #layerControl = null;
  #baseMaps = {};

  static isGeolocationAvailable() {
    return 'geolocation' in navigator;
  }

  static getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!Map.isGeolocationAvailable()) {
        reject(new Error('Geolocation API unsupported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  static async build(selector, options = {}) {
    if ('center' in options && options.center) {
      return new Map(selector, options);
    }

    const defaultCoordinate = [-6.175389, 106.827139];

    if ('locate' in options && options.locate) {
      try {
        const position = await Map.getCurrentPosition();
        return new Map(selector, {
          ...options,
          center: [position.coords.latitude, position.coords.longitude],
        });
      } catch (error) {
        return new Map(selector, {
          ...options,
          center: defaultCoordinate,
        });
      }
    }

    return new Map(selector, {
      ...options,
      center: defaultCoordinate,
    });
  }

  constructor(selector, options = {}) {
    this.#zoom = options.zoom ?? this.#zoom;
    this.#searchProvider = new OpenStreetMapProvider({
      params: {
        countrycodes: 'id',
      },
    });

    // --- Base tile layers ---
    const osmLayer = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      maxZoom: 19,
    });

    // Tentukan layer awal (default: OSM)
    const initialLayers = [osmLayer];
    this.#baseMaps = {
      'OpenStreetMap': osmLayer,
    };

    // Tambah MapTiler layers jika API key tersedia
    // apiKey dipass langsung ke maptilerLayer() karena maptilersdk.config tidak di-export
    if (HAS_MAPTILER_KEY) {
      const mapTilerStreets = maptilersdk.maptilerLayer({
        apiKey: MAPTILER_API_KEY,
        style: maptilersdk.MapStyle.STREETS,
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      });

      const mapTilerSatellite = maptilersdk.maptilerLayer({
        apiKey: MAPTILER_API_KEY,
        style: maptilersdk.MapStyle.SATELLITE,
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>',
      });

      const mapTilerOutdoor = maptilersdk.maptilerLayer({
        apiKey: MAPTILER_API_KEY,
        style: maptilersdk.MapStyle.OUTDOOR,
        attribution: '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      });

      this.#baseMaps['MapTiler Streets'] = mapTilerStreets;
      this.#baseMaps['MapTiler Satellite'] = mapTilerSatellite;
      this.#baseMaps['MapTiler Outdoor'] = mapTilerOutdoor;
    }

    // Inisialisasi peta Leaflet
    const { layers: _ignoredLayers, ...restOptions } = options;
    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      layers: initialLayers,
      ...restOptions,
    });

    // Tambah Layer Control (base maps)
    this.#layerControl = control.layers(this.#baseMaps, {}, {
      collapsed: true,
      position: 'topright',
    });
    this.#layerControl.addTo(this.#map);
  }

  /**
   * Tambah overlay layer ke layer control yang sudah ada.
   * @param {string} name - Nama layer yang tampil di control
   * @param {L.Layer} layer - Leaflet layer yang akan ditambahkan
   * @param {boolean} [addToMap=true] - Langsung tampilkan di peta atau tidak
   */
  addOverlayLayer(name, layer, addToMap = true) {
    if (!this.#layerControl) {
      return;
    }

    this.#layerControl.addOverlay(layer, name);

    if (addToMap) {
      layer.addTo(this.#map);
    }
  }

  invalidateSize() {
    this.#map.invalidateSize();
  }

  getCenter() {
    const { lat, lng } = this.#map.getCenter();
    return {
      latitude: lat,
      longitude: lng,
    };
  }

  flyTo(coordinate, zoomLevel = null) {
    if (zoomLevel) {
      this.#map.flyTo(latLng(coordinate), zoomLevel);
      return;
    }

    this.#map.flyTo(latLng(coordinate));
  }

  createIcon(options = {}) {
    return new L.Icon({
      iconUrl: markerIcon,
      iconRetinaUrl: markerIcon2x,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
      ...options,
    });
  }

  addMarker(coordinates, markerOptions = {}, popupOptions = null) {
    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }

    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });

    if (popupOptions) {
      if (typeof popupOptions !== 'object') {
        throw new Error('popupOptions must be an object');
      }

      if (!('content' in popupOptions)) {
        throw new Error('popupOptions must include `content` property.');
      }

      newMarker.bindPopup(popupOptions.content, popupOptions.options ?? {});
    }

    newMarker.addTo(this.#map);
    return newMarker;
  }

  addMapEventListener(eventName, callback) {
    this.#map.addEventListener(eventName, callback);
  }

  zoomIn() {
    this.#map.zoomIn();
  }

  zoomOut() {
    this.#map.zoomOut();
  }

  fitBounds(coordinates, options = {}) {
    if (!coordinates.length) {
      return;
    }

    // Filter koordinat geografis yang valid (lat: -90..90, lon: -180..180)
    const validCoords = coordinates.filter(([lat, lon]) => (
      lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180
    ));

    if (!validCoords.length) {
      return;
    }

    this.#map.fitBounds(latLngBounds(validCoords), {
      padding: [32, 32],
      maxZoom: 14,
      ...options,
    });
  }

  async searchPlaces(query) {
    if (!query || !query.trim()) {
      return [];
    }

    return this.#searchProvider.search({
      query: query.trim(),
    });
  }
}
