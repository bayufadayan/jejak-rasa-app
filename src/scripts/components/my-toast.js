import { createIcons, icons } from 'lucide';

class MyToast extends HTMLElement {
    connectedCallback() {
        this.render();
    }

    render(){
        // Type = "success", "error", "info", "warning", "secondary"
        const typeAttribute = this.getAttribute("type") || "secondary"
        const message = this.getAttribute("message") || "This is your Message"
        const isAssertive = typeAttribute === 'error' || typeAttribute === 'warning';

        const typeList = {
            "success" : {
                "label": "Success",
                "color": "#47d764",
                "backgroundColor": "hsl(131, 58%, 91%)",
                "icon": "circle-check",
            },
            "error" : {
                "label": "Error",
                "color": "#ff355b",
                "backgroundColor": "#ffdae1",
                "icon": "circle-x",
            },
            "info" : {
                "label": "Info",
                "color": "#2f86eb",
                "backgroundColor": "#e6eef8",
                "icon": "info",
            },
            "warning" : {
                "label": "Warning",
                "color": "#ffbf21",
                "backgroundColor": "#f1e5c5",
                "icon": "circle-alert",
            },
            "secondary" : {
                "label": "Status",
                "color": "#4b4b4b",
                "backgroundColor": "#d6d6d6",
                "icon": "smile",
            },
        }

        const selectedType = typeList[typeAttribute] || typeList.secondary;

        this.innerHTML = /* html */ `
        <style>
            .toast__container {
                background-color: ${selectedType.backgroundColor};
                border-color: ${selectedType.color};
                filter: drop-shadow(5px 10px 15px ${selectedType.backgroundColor});
            }

            .toast__icon svg {
                background-color: ${selectedType.color};
            }
        </style>

        <div
            class="toast__container"
            role="${isAssertive ? 'alert' : 'status'}"
            aria-live="${isAssertive ? 'assertive' : 'polite'}"
            aria-atomic="true"
        >
            <figure class="toast__icon">
                <i data-lucide=${selectedType.icon}></i>
            </figure>
            <div class="toast__content">
                <strong class="toast__status">Status: ${selectedType.label}</strong>
                <p class="toast__message">${message}</p>
            </div>
        </div>
        `

        createIcons({ icons });
    }
}

customElements.define('my-toast', MyToast);