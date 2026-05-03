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

                <nav id="navigation-drawer" class="navigation-drawer">
                <ul id="nav-list" class="nav-list">
                    <li><a href="#/">Beranda</a></li>
                    <li><a href="#/about">About</a></li>
                    <li>
                        <div class = "nav-list__dropdown-button">
                            <i data-lucide="circle-user-round"></i>
                            <span> ${accountOwnerName} </span> 
                            <i data-lucide="chevron-down"></i>
                        </div>

                        <div class="nav-list__dropdown-option">
                            <button class="nav-list__dropdown-logout-btn">
                                <i data-lucide="log-out"></i>
                                <span>Logout</span>
                            </button>
                        </div>
                    </li>
                </ul>
                </nav>

                <button id="drawer-button" class="drawer-button">
                    <i data-lucide="menu"></i>
                </button>

            </div>
        </header>
        `
        const dropdownButton = document.querySelector(".nav-list__dropdown-button");

        dropdownButton.addEventListener("click", () => {
            const dropdownOption = document.querySelector(".nav-list__dropdown-option");
            dropdownButton.classList.toggle("open")
            dropdownOption.classList.toggle("open")

            document.body.addEventListener('click', (event) => {
                if (
                    !dropdownButton.contains(event.target) &&
                    !dropdownOption.contains(event.target)
                ) {
                    dropdownButton.classList.remove('open');
                    dropdownOption.classList.remove('open');
                }
            });
        })

        document.querySelector(".nav-list__dropdown-logout-btn").addEventListener("click", () => {
            getLogout();
        })
        createIcons({ icons });
    }
}

customElements.define('main-header', MainHeader);