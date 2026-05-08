import CONFIG from '../config.js';
import { createIcons, icons } from 'lucide';
import { getLogout } from '../data/api.js';

class MainHeader extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    async render() {
        const accountOwnerName = await localStorage.getItem(CONFIG.ACCOUNT_OWNER);

        this.innerHTML = /* html */ `
        <header class="main__navbar">
            <div class="main-header container">
                <a class="brand-name" href="#/">
                    <figure>
                        <img src="/images/logo-jejak-rasa.png" alt="Jejak Rasa"/>
                    </figure>
                </a>

                <nav id="navigation-drawer" class="navigation-drawer" aria-label="Navigasi utama">
                <ul id="nav-list" class="nav-list">
                    <li><a href="#/">Beranda</a></li>
                    <li><a href="#/about">About</a></li>
                    <li>
                        <button
                            id="push-toggle-button"
                            class="nav-list__toggle-button"
                            type="button"
                            aria-pressed="false"
                        >
                            <i data-lucide="bell"></i>
                            <span class="nav-list__toggle-label">Notifikasi: Mati</span>
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            class="nav-list__dropdown-button"
                            aria-label="Buka menu akun"
                            aria-haspopup="menu"
                            aria-expanded="false"
                            aria-controls="user-menu"
                        >
                            <i data-lucide="circle-user-round"></i>
                            <span> ${accountOwnerName} </span> 
                            <i data-lucide="chevron-down"></i>
                        </button>

                        <div id="user-menu" class="nav-list__dropdown-option" role="menu">
                            <button type="button" class="nav-list__dropdown-logout-btn" role="menuitem">
                                <i data-lucide="log-out"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </li>
                </ul>
                </nav>

                <button
                    id="drawer-button"
                    class="drawer-button"
                    type="button"
                    aria-label="Buka menu navigasi"
                    aria-controls="navigation-drawer"
                    aria-expanded="false"
                >
                    <i data-lucide="menu"></i>
                </button>

            </div>
        </header>
        `
        const dropdownButton = document.querySelector('.nav-list__dropdown-button');
        const dropdownOption = document.querySelector('.nav-list__dropdown-option');
        const drawerButton = document.querySelector('#drawer-button');
        const navDrawer = document.querySelector('#navigation-drawer');

        const closeDropdown = () => {
            dropdownButton.classList.remove('open');
            dropdownButton.setAttribute('aria-expanded', 'false');
            dropdownOption.classList.remove('open');
            dropdownOption.hidden = true;
        };

        const openDropdown = () => {
            dropdownButton.classList.add('open');
            dropdownButton.setAttribute('aria-expanded', 'true');
            dropdownOption.classList.add('open');
            dropdownOption.hidden = false;
            // Move focus to first menu item
            const firstItem = dropdownOption.querySelector('[role="menuitem"]');
            if (firstItem) firstItem.focus();
        };

        dropdownButton.addEventListener('click', () => {
            const isOpen = dropdownOption.classList.contains('open');
            if (isOpen) {
                closeDropdown();
            } else {
                openDropdown();
            }
        });

        document.body.addEventListener('click', (event) => {
            if (
                !dropdownButton.contains(event.target) &&
                !dropdownOption.contains(event.target)
            ) {
                closeDropdown();
            }
        });

        document.addEventListener('keydown', (event) => {
            // Close account dropdown on Escape
            if (event.key === 'Escape') {
                if (dropdownOption.classList.contains('open')) {
                    closeDropdown();
                    dropdownButton.focus();
                } else if (navDrawer && navDrawer.classList.contains('open')) {
                    navDrawer.classList.remove('open');
                    if (drawerButton) {
                        drawerButton.setAttribute('aria-expanded', 'false');
                        drawerButton.setAttribute('aria-label', 'Buka menu navigasi');
                        drawerButton.focus();
                    }
                }
            }
        });

        // Hamburger drawer toggle
        if (drawerButton && navDrawer) {
            drawerButton.addEventListener('click', () => {
                const isOpen = navDrawer.classList.contains('open');
                navDrawer.classList.toggle('open', !isOpen);
                drawerButton.setAttribute('aria-expanded', String(!isOpen));
                drawerButton.setAttribute('aria-label', isOpen ? 'Buka menu navigasi' : 'Tutup menu navigasi');
                if (!isOpen) {
                    // Focus first nav link when opening
                    const firstLink = navDrawer.querySelector('a, button');
                    if (firstLink) firstLink.focus();
                }
            });
        }

        // Initialize dropdown as hidden
        dropdownOption.hidden = true;

        document.querySelector('.nav-list__dropdown-logout-btn').addEventListener('click', () => {
            getLogout();
        });
        createIcons({ icons });
    }
}

customElements.define('main-header', MainHeader);