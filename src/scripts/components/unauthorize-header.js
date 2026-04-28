class UnauthorizeHeader extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        const classList = this.getAttribute("class") || ""
        this.innerHTML = /* html */ `

        <header class="auth__navbar ${classList}">
            <div class="main-header">
                <a class="brand-name" href="#/">
                    <figure>
                        <img src="/public/images/logo-jejak-rasa.png"/>
                    </figure>
                </a>
            </div>
        </header>
        `
    }
}

customElements.define('unauthorize-header', UnauthorizeHeader);