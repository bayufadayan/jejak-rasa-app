import routes from '../routes/routes';
import '../components/main-header.js'
import { getActiveRoute } from '../routes/url-parser';
import { getAccessToken } from '../utils/auth.js';
import { isServiceWorkerAvailable } from '../utils/index.js';
import {
  isCurrentPushSubscriptionAvailable,
  isNotificationAvailable,
  subscribe,
  unsubscribe,
} from '../utils/notification-helper.js';
import NotFoundPage from './not-found/not-found-page.js';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #lastRoute = null;
  #isFirstRender = true;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
  }

  #setupDrawer() {
    if (!this.#drawerButton || !this.#navigationDrawer) {
      this.#refreshDrawerReferences();
    }

    if (!this.#drawerButton || !this.#navigationDrawer) {
      return;
    }

    const setDrawerState = (isOpen) => {
      this.#navigationDrawer.classList.toggle('open', isOpen);
      this.#drawerButton.setAttribute('aria-expanded', String(isOpen));
    };

    this.#drawerButton.addEventListener('click', () => {
      const isOpen = !this.#navigationDrawer.classList.contains('open');
      setDrawerState(isOpen);
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        setDrawerState(false);
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          setDrawerState(false);
        }
      });
    });

    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') {
        return;
      }

      if (!this.#navigationDrawer.classList.contains('open')) {
        return;
      }

      setDrawerState(false);
      this.#drawerButton.focus();
    });

    setDrawerState(false);
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url] || (() => new NotFoundPage());

    const page = route();
    if (!page) return;

    const renderContent = async () => {
      this.#content.setAttribute('aria-busy', 'true');
      try {
        this.#content.innerHTML = await page.render();
        await page.afterRender();
      } finally {
        this.#content.setAttribute('aria-busy', 'false');
      }
    };

    if (!document.startViewTransition || this.#isFirstRender) {
      await renderContent();
      const isFirst = this.#isFirstRender;
      this.#lastRoute = url;
      this.#isFirstRender = false;
      this.#applyPostRenderAccessibility(url, isFirst);
      await this.#setupPushNotificationToggle();
      return;
    }

    const transitionDirection = this.#getTransitionDirection(this.#lastRoute, url);
    document.documentElement.setAttribute('data-view-transition-direction', transitionDirection);

    const transition = document.startViewTransition(async () => {
      await renderContent();
    });

    try {
      await transition.finished;
    } finally {
      document.documentElement.removeAttribute('data-view-transition-direction');
      this.#lastRoute = url;
      this.#isFirstRender = false;
      this.#applyPostRenderAccessibility(url, false);
      await this.#setupPushNotificationToggle();
    }
  }

  #applyPostRenderAccessibility(route, isFirstRender = false) {
    this.#setDocumentTitle(route);
    this.#markActiveNavigation(route);
    if (!isFirstRender) {
      this.#content.focus({ preventScroll: true });
    }
  }

  #setDocumentTitle(route) {
    const routeTitles = {
      '/': 'Beranda',
      '/about': 'Tentang',
      '/add-story': 'Tambah Cerita',
      '/story/:id': 'Detail Cerita',
      '/login': 'Masuk',
      '/register': 'Daftar',
    };

    const pageTitle = routeTitles[route] || 'Jejak Rasa';
    document.title = `${pageTitle} | Jejak Rasa`;
  }

  #markActiveNavigation(route) {
    this.#refreshDrawerReferences();

    if (!this.#navigationDrawer) {
      return;
    }

    this.#navigationDrawer.querySelectorAll('a[href]').forEach((link) => {
      const href = link.getAttribute('href') || '';
      const linkRoute = href.startsWith('#') ? href.slice(1) || '/' : href;
      const isCurrent = linkRoute === route;

      if (isCurrent) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  #refreshDrawerReferences() {
    if (!this.#drawerButton) {
      this.#drawerButton = document.querySelector('#drawer-button');
    }

    if (!this.#navigationDrawer) {
      this.#navigationDrawer = document.querySelector('#navigation-drawer');
    }
  }

  #getTransitionDirection(previousRoute, nextRoute) {
    if (!previousRoute || !nextRoute || previousRoute === nextRoute) {
      return 'forward';
    }

    const previousRank = this.#getRouteRank(previousRoute);
    const nextRank = this.#getRouteRank(nextRoute);

    if (nextRank < previousRank) {
      return 'backward';
    }

    return 'forward';
  }

  #getRouteRank(route) {
    if (route.startsWith('/login') || route.startsWith('/register')) {
      return 0;
    }

    if (route === '/' || route.startsWith('/about')) {
      return 1;
    }

    if (route.startsWith('/add-story')) {
      return 2;
    }

    if (route.startsWith('/story/')) {
      return 3;
    }

    return 1;
  }

  async #setupPushNotificationToggle() {
    const button = document.getElementById('push-toggle-button');
    if (!button) {
      return;
    }

    const isLoggedIn = !!getAccessToken();
    button.hidden = !isLoggedIn;

    if (!isLoggedIn) {
      return;
    }

    const isSupported = isServiceWorkerAvailable() && isNotificationAvailable();
    button.disabled = !isSupported;

    if (!isSupported) {
      this.#updatePushToggleLabel(button, false, 'Notifikasi tidak didukung');
      button.title = 'Browser tidak mendukung push notification.';
      return;
    }

    const isSubscribed = await isCurrentPushSubscriptionAvailable();
    this.#updatePushToggleLabel(button, isSubscribed);

    button.onclick = async () => {
      button.disabled = true;
      button.title = '';

      if (await isCurrentPushSubscriptionAvailable()) {
        await unsubscribe();
      } else {
        await subscribe();
      }

      const latestState = await isCurrentPushSubscriptionAvailable();
      this.#updatePushToggleLabel(button, latestState);
      button.disabled = false;
    };
  }

  #updatePushToggleLabel(button, isSubscribed, customLabel) {
    const label = button.querySelector('.nav-list__toggle-label');
    const status = customLabel || (isSubscribed ? 'Notifikasi: Aktif' : 'Notifikasi: Mati');

    button.dataset.state = isSubscribed ? 'on' : 'off';
    button.setAttribute('aria-pressed', String(isSubscribed));

    if (label) {
      label.textContent = status;
    } else {
      button.textContent = status;
    }
  }
}

export default App;
