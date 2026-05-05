class FieldGroup extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    autoResizeTextarea(textarea) {
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = Number.parseFloat(computedStyle.lineHeight) || (Number.parseFloat(computedStyle.fontSize) * 1.5) || 24;
        const verticalPadding = Number.parseFloat(computedStyle.paddingTop) + Number.parseFloat(computedStyle.paddingBottom);
        const verticalBorder = Number.parseFloat(computedStyle.borderTopWidth) + Number.parseFloat(computedStyle.borderBottomWidth);
        const maxHeight = lineHeight * 5 + verticalPadding + verticalBorder;

        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
        textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
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
            ? `<textarea id="${id}" name="${id}" class="auth__input auth__input--textarea" placeholder="${placeholder}" ${isRequired ? 'required' : ''} cols="30" rows="1"></textarea>`
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

        if (isTextarea) {
            const textarea = this.querySelector('textarea');

            if (textarea) {
                textarea.addEventListener('input', () => this.autoResizeTextarea(textarea));
                this.autoResizeTextarea(textarea);
            }
        }
    }
}

customElements.define('field-group', FieldGroup);