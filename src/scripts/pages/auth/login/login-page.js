import '../../../components/unauthorize-header.js';
import '../../../components/field-group.js';
import '../../../components/my-toast.js';
import LoginPresenter from './login-presenter.js';
import * as API from '../../../data/api.js';
import * as AuthModel from '../../../utils/auth.js';

export default class LoginPage {
    #presenter = null;

    async render() {
        return /* html */ `
        <section class="container auth">
            <unauthorize-header></unauthorize-header>
            <div class="auth__container">
                <div class="auth__decoration">
                    <figure class="auth__figure">
                        <img src="/images/login-decoration.svg" alt="" class="auth__image">
                    </figure>
                </div>

                <div class="auth__content">
                    <header class="auth__header">
                        <h1 class="auth__title">Sudah siap untuk menceritakan masa lalu kamu lagi?</h1>
                        <p class="auth__description">
                            Masuk ke akun Anda, dan buat kenagan indah itu kembali bersemi
                        </p>
                    </header>

                    <form class="auth__form">
                        <field-group type="email" id="email" label="Email" placeholder="email.kamu@domain.com"></field-group>
                        <field-group type="password" id="password" label="Password" placeholder="********"></field-group>

                        <button type="submit" class="main__btn">Masuk</button>
                        <p>Belum punya akun? <a href="/#/register" class="auth__link">Daftar disini</a></p>
                    </form>
                </div>
            </div>
        </section>
        `;
    }


    async afterRender() {
        const navbar = document.getElementsByClassName("main__navbar")[0];
        navbar.classList.add("hide-me");

        this.#presenter = new LoginPresenter({
            view: this,
            model: API,
            authModel: AuthModel
        })
        

        this.#setupForm();
    }

    #setupForm() {
        document.querySelector('.auth__form').addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.querySelector('#email input').value;
            const password = document.querySelector('#password input').value;

            const data = {
                email: email,
                password: password,
            };

            await this.#presenter.getLogin(data);
        });
    }

    showLoading(isLoading){
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
            submitBtn.textContent = "Masuk";
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

    loginSuccessfully(message) {
        this.showToast("success", message)
        location.replace('/#/');
    }

    loginFailed(message) {
        this.showToast("error", message)
    }

    
    // #formValidation(email, password) {
    //   if (!email || !password) {
    //     return {
    //       validation: "error",
    //       message: "Kolom wajib diisi"
    //     }
    //   }
    // }
}
