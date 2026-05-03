class FieldGroup extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render() {
        const type = this.getAttribute('type') || 'text';
        const id = this.getAttribute('id') || `input-${Math.random().toString(36).substring(2, 9)}`;
        const label = this.getAttribute('label') || 'Your Label';
        const placeholder = this.getAttribute('placeholder') || ' ';
        const step = this.getAttribute('step') || '';
        const isTextarea = type === 'textarea';
        const isRequired = this.getAttribute('required') !== null;

        const inputElement = isTextarea
            ? `<textarea id="${id}" name="${id}" class="auth__input" placeholder="${placeholder}" ${isRequired ? 'required' : ''}></textarea>`
            : `<input type="${type}" id="${id}" name="${id}" class="auth__input" placeholder="${placeholder}" ${step ? `step="${step}"` : ''} ${isRequired ? 'required' : ''} />`;

        this.innerHTML = /* html */ `
            <div class="auth__field-group">
                ${inputElement}
                <label for="${id}" class="auth__label">
                    ${label}
                </label>
                <p class="auth__field-error-message"></p>
            </div>
        `;
    }
}

customElements.define('field-group', FieldGroup);