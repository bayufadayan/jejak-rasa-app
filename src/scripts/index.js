// CSS imports
import '../styles/styles.css';

import App from './pages/app';

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    // Stop all active media streams before leaving the page
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

  const skipToContent = document.querySelector('.skip-to-content');
  if (skipToContent) {
    skipToContent.addEventListener('click', (event) => {
      event.preventDefault(); // Mencegah refresh halaman
      skipToContent.blur(); // Menghilangkan fokus skip to content
      
      const mainContent = document.querySelector('#main-content');
      if (mainContent) {
        mainContent.focus(); // Fokus ke konten utama
        mainContent.scrollIntoView(); // Halaman scroll ke konten utama
      }
    });
  }
});
