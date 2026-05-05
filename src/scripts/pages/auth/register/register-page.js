import '../../../components/unauthorize-header.js';
import '../../../components/field-group.js';
import '../../../components/my-toast.js';
import RegisterPresenter from './register-presenter.js';
import * as API from '../../../data/api.js';

export default class RegisterPage {
    #presenter = null;

    async render() {
        return /* html */ `
        <section class="container auth">
            <unauthorize-header class="auth__navbar--register"></unauthorize-header>
            <div class="auth__container auth__container--register">
                <div class="auth__decoration">
                    <figure class="auth__figure">
                        <img src="/images/register-decoration.svg" alt="Illustration register" class="auth__image">
                    </figure>
                </div>

                <div class="auth__content">
                    <header class="auth__header">
                        <h1 class="auth__title">Daftar Akun</h1>
                        <p class="auth__description">
                            Kamu ngga akan tau seberapa berharganya masa lalu kalau kamu melupakannya! Jadi, Ayo bangun kenangan itu kembali
                        </p>
                    </header>

                    <form class="auth__form">
                        <field-group type="text" id="name" label="Nama Lengkap" placeholder="Fulan bin fulan"></field-group>
                        <field-group type="email" id="email" label="Email" placeholder="email.kamu@domain.com"></field-group>
                        <field-group type="password" id="password" label="Password" placeholder="********"></field-group>
                        <field-group type="password" id="confirm-password" label="Konfirmasi Password" placeholder="********"></field-group>
                        <button type="submit" class="main__btn">Daftar</button>
                        <p>Sudah punya akun? <a href="/#/login" class="auth__link">Masuk yuuk!</a></p>
                    </form>
                </div>
            </div>
        </section>
        `;
    }

    async afterRender() {
        const navbar = document.getElementsByClassName("main__navbar")[0];
        navbar.classList.add("hide-me");
    

        this.#presenter = new RegisterPresenter({
            view : this,
            model : API,
        });

        const passwordInput = document.querySelector("#password input");
        const confirmPasswordInput = document.querySelector("#confirm-password input");

        confirmPasswordInput.addEventListener("input", () => {
            const parent = confirmPasswordInput.parentElement;
            const errorMessage = parent.querySelector(".auth__field-error-message");

            if (!errorMessage) return;

            if (confirmPasswordInput.value !== passwordInput.value) {
                errorMessage.textContent = "Password tidak sama";
                errorMessage.style.display = "flex";
            } else {
                errorMessage.textContent = "";
                errorMessage.style.display = "none";
            }
        });

        this.#setupForm();
    }

    #setupForm() {
        document.querySelector(".auth__form").addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.querySelector("#name input").value;
            const email = document.querySelector("#email input").value;
            const password = document.querySelector("#password input").value;
            const confirmPassword = document.querySelector("#confirm-password input").value;

            if (confirmPassword !== password) {
                this.registeredFailed("Password-nya nggak match, coba cek lagi ya.")
                return;
            }

            const data = {
                name: name,
                email: email,
                password: password,
            }

            await this.#presenter.getRegistered(data);
        })
    }

    showLoading(isLoading) {
        const submitBtn = document.querySelector(".main__btn");

        if (isLoading) {
            submitBtn.classList.add("main__btn--loading");
            submitBtn.innerHTML = `
                <span style="display:flex; align-items:center; gap:8px; justify-content:center;">
                    <svg width="18" height="18" viewBox="0 0 50 50">
                    <circle
                        cx="25"
                        cy="25"
                        r="20"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="4"
                        stroke-linecap="round"
                        stroke-dasharray="90 150">
                        <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 25 25"
                        to="360 25 25"
                        dur="1s"
                        repeatCount="indefinite" />
                    </circle>
                    </svg>
                    <span>Loading...</span>
                </span>
                `;
        } else {
            submitBtn.classList.remove("main__btn--loading");
            submitBtn.textContent = "Daftar"
        }
    }

    showToast(type, message) {
        const toast = document.createElement('my-toast');
        toast.setAttribute('type', type);
        toast.setAttribute('message', message);

        document.body.appendChild(toast);

        const toastContainer = toast.querySelector(".toast__container");
        if (toastContainer) {
            toastContainer.classList.remove('slide-out');
        }

        setTimeout(() => {
        if (toastContainer) {
            toastContainer.classList.add('slide-out');
            toastContainer.onanimationend = () => toast.remove();
        } else {
            toast.remove();
        }

            console.log(toastContainer)
        }, 2500);
    }

    registeredSuccessfully(message) {
        this.showToast("success", message)
        location.hash = '/login';
    }

    registeredFailed(message) {
        this.showToast("error", message)
    }
}
