export default class LoginPage {
    async render() {
        return /* html */ `
        <section class="container auth">
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
                        <div class="auth__field-group">
                            <label for="email" class="auth__label">Email</label>
                            <input type="email" id="email" name="email" class="auth__input">
                        </div>
                        <div class="auth__field-group">
                            <label for="password" class="auth__label">Password</label>
                            <input type="password" id="password" name="password" class="auth__input">
                        </div>

                        <button type="submit" class="auth__button">Masuk</button>
                    </form>
                </div>
            </div>
        </section>
        `;
    }

    async afterRender() {
        const navbar = document.getElementsByTagName("header")[0];
        navbar.classList.add("hide-me");
    }
}
