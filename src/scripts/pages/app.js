import routes from '../routes/routes';
import '../components/main-header.js'
import { getActiveRoute } from '../routes/url-parser';

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
    this.#drawerButton.addEventListener('click', () => {
      this.#navigationDrawer.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove('open');
      }

      this.#navigationDrawer.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove('open');
        }
      });
    });
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];

    const page = route();
    if (!page) return;

    const renderContent = async () => {
      this.#content.innerHTML = await page.render();
      await page.afterRender();
    };

    if (!document.startViewTransition || this.#isFirstRender) {
      await renderContent();
      this.#lastRoute = url;
      this.#isFirstRender = false;
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
}

export default App;
