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
        const dropdownButton = document.querySelector(".nav-list__dropdown-button");
        const dropdownOption = document.querySelector(".nav-list__dropdown-option");

        const closeDropdown = () => {
            dropdownButton.classList.remove('open');
            dropdownButton.setAttribute('aria-expanded', 'false');
            dropdownOption.classList.remove('open');
        };

        dropdownButton.addEventListener("click", () => {
            const isOpen = !dropdownOption.classList.contains('open');
            dropdownButton.classList.toggle("open", isOpen);
            dropdownButton.setAttribute('aria-expanded', String(isOpen));
            dropdownOption.classList.toggle("open", isOpen);
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
            if (event.key !== 'Escape') {
                return;
            }

            if (!dropdownOption.classList.contains('open')) {
                return;
            }

            closeDropdown();
            dropdownButton.focus();
        });

        document.querySelector(".nav-list__dropdown-logout-btn").addEventListener("click", () => {
            getLogout();
        });
        createIcons({ icons });
    }
}

customElements.define('main-header', MainHeader);