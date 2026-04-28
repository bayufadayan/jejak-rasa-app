class MyNavbar extends HTMLElement {

    constructor() {
        super();

        this.innerHTML = `<p>Ini adalah navbar saya</p>`;
    }
}

customElements.define('my-navbar', MyNavbar);