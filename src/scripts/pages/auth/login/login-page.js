import '../../../components/unauthorize-header.js';
import '../../../components/field-group.js';

export default class LoginPage {
    async render() {
        return /* html */ `
        <section class="container auth">
            <unauthorize-header></unauthorize-header>
            <div class="auth__container">
                <!-- Decoration -->
                <div class="auth__decoration">
                    <figure class="auth__figure">
                        <img src="public/images/login-decoration.svg" alt="decoration" class="auth__image">
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
                        <field-group type="email" id="email" label="Email"></field-group>
                        <field-group type="password" id="password" label="Password"></field-group>

                        <button type="submit" class="auth__button">Masuk</button>
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

        this.#setupForm();
    }

    #setupForm() {
        document.getElementById('auth__form').addEventListener('submit', async (event) => {
            event.preventDefault();

            const data = {
                email: document.getElementById('email-input').value,
                password: document.getElementById('password-input').value,
            };

            // await this.#presenter.getLogin(data);
        });
    }
}
