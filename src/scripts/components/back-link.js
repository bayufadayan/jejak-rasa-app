import { createIcons, icons } from 'lucide';

class BackLink extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  render() {
    const href = this.getAttribute('href') || '#/';
    const className = this.getAttribute('class') || 'back-link';
    const label = this.getAttribute('label') || 'Kembali ke beranda';

    this.innerHTML = /* html */ `
      <a class="add-story__back-link" href="${href}">
        <i data-lucide="arrow-left" aria-hidden="true"></i>
        <span>${label}</span>
      </a>
    `;

    createIcons({ icons });
  }
}

customElements.define('app-back-link', BackLink);