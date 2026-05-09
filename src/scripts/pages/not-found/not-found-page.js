export default class NotFoundPage {
    async render() {
        return `
            <section class="container" style="min-height: 70vh; display: flex; align-items: center; justify-content: center;">
                <div class="story-not-found" style="text-align: center; background: var(--color-bg-nav); padding: 4rem 2rem; border-radius: 12px; border: 1px solid var(--color-border); max-width: 500px; width: 100%;">
                    <h1 style="font-size: 4rem; color: var(--color-primary); margin-bottom: 1rem; font-family: 'Figtree', sans-serif;">404</h1>
                    <h2 style="font-size: 1.5rem; color: var(--color-text-dark); margin-bottom: 1rem;">Not Found</h2>
                    <p style="color: var(--color-text-muted); margin-bottom: 2rem; line-height: 1.6;">Halaman yang kamu cari tidak ditemukan atau mungkin telah dipindahkan.</p>
                    <a href="#/" class="main__btn" style="display: inline-block; padding: 0.8rem 2rem; text-decoration: none; border-radius: 4px;">Kembali ke Beranda</a>
                </div>
            </section>
        `;
    }
    
    async afterRender() {
        const navbar = document.getElementsByClassName("main__navbar")[0];
        if (navbar) {
            navbar.classList.remove("hide-me");
        }
    }
}
