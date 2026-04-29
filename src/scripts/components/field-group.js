class FieldGroup extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        const type = this.getAttribute('type') || 'text';
        const id = this.getAttribute('id') || `input-${Math.random().toString(36).substring(2, 9)}` 
        const label = this.getAttribute('label') || "Your Label";

        this.innerHTML = /* html */ `
            <div class="auth__field-group">
                <input type=${type} id=${id} name=${id} class="auth__input" placeholder=" " required>
                <label for=${id} class="auth__label">
                    ${label}
                </label>
                <p class="auth__field-error-message"></p>
            </div>
        `
    }
}

customElements.define("field-group", FieldGroup);