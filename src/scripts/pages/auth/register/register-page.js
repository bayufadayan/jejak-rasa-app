import '../../../components/unauthorize-header.js';
import '../../../components/field-group.js';

export default class RegisterPage {
    async render() {
        return /* html */ `
        <section class="container auth">
            <unauthorize-header class="auth__navbar--register"></unauthorize-header>
            <div class="auth__container auth__container--register">
                <div class="auth__decoration">
                    <figure class="auth__figure">
                        <img src="public/images/register-decoration.svg" alt="decoration" class="auth__image">
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
                        <field-group type="text" id="name" label="Nama Lengkap"></field-group>
                        <field-group type="email" id="email" label="Email"></field-group>
                        <field-group type="password" id="password" label="Password"></field-group>
                        <field-group type="password" id="password" label="Konfirmasi Password"></field-group>

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

        // this.#setupForm();
    }

    // #setupForm() {
    //     document.getElementById('auth__form').addEventListener('submit', async (event) => {
    //         event.preventDefault();

    //         const data = {
    //             email: document.getElementById('email-input').value,
    //             password: document.getElementById('password-input').value,
    //         };

    //         // await this.#presenter.getLogin(data);
    //     });
    // }
}
