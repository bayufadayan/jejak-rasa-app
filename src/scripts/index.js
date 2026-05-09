import '../styles/styles.css';

import App from './pages/app';
import { registerServiceWorker } from './utils/index.js';
import StoryRepository from './data/story-repository.js';

document.addEventListener('DOMContentLoaded', async () => {
  await registerServiceWorker();
  await StoryRepository.syncPendingStories();

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    if (Array.isArray(window.currentStreams)) {
      window.currentStreams.forEach((stream) => {
        if (stream.active) {
          stream.getTracks().forEach((track) => track.stop());
        }
      });
      window.currentStreams = [];
    }
    
    await app.renderPage();
  });

  window.addEventListener('online', async () => {
    const { syncedCount } = await StoryRepository.syncPendingStories();
    if (syncedCount > 0 && location.hash === '#/') {
      await app.renderPage();
    }
  });

  const skipToContent = document.querySelector('.skip-to-content');
  if (skipToContent) {
    skipToContent.addEventListener('click', (event) => {
      event.preventDefault();
      skipToContent.blur();
      
      const mainContent = document.querySelector('#main-content');
      if (mainContent) {
        mainContent.focus();
        mainContent.scrollIntoView();
      }
    });
  }
});
