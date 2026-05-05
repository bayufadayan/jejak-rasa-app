import { map, tileLayer, Icon, icon, marker, latLng } from 'leaflet';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

export default class Map {
  #zoom = 5;
  #map = null;
  #searchProvider = null;

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

    const tileOsm = tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    });

    this.#map = map(document.querySelector(selector), {
      zoom: this.#zoom,
      layers: [tileOsm],
      ...options,
    });
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
    return icon({
      ...Icon.Default.prototype.options,
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      ...options,
    });
  }

  addMarker(coordinates, markerOptions = {}) {
    if (typeof markerOptions !== 'object') {
      throw new Error('markerOptions must be an object');
    }

    const newMarker = marker(coordinates, {
      icon: this.createIcon(),
      ...markerOptions,
    });

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

  async searchPlaces(query) {
    if (!query || !query.trim()) {
      return [];
    }

    return this.#searchProvider.search({
      query: query.trim(),
    });
  }
}
