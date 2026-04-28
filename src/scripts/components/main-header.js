class MainHeader extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        this.innerHTML = /* html */ `
        <header class="main__navbar">
            <div class="main-header container">
                <a class="brand-name" href="#/">
                    <figure>
                        <img src="/public/images/logo-jejak-rasa.png"/>
                    </figure>
                </a>

                <nav id="navigation-drawer" class="navigation-drawer">
                <ul id="nav-list" class="nav-list">
                    <li><a href="#/">Beranda</a></li>
                    <li><a href="#/about">About</a></li>
                </ul>
                </nav>

                <button id="drawer-button" class="drawer-button">☰</button>

            </div>
        </header>
        `
    }
}

customElements.define('main-header', MainHeader);