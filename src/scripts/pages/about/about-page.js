export default class AboutPage {
  async render() {
    return `
      <section class="about container">
        <div class="about__shell">
          <header class="about__hero">
            <p class="about__eyebrow">Tentang Jejak Rasa</p>
            <h1 class="about__title">Ruang cerita yang dirancang untuk terasa hangat, dekat, dan mudah ditelusuri.</h1>
            <p class="about__description">Jejak Rasa dibangun sebagai aplikasi berbagi cerita yang menempatkan kenangan sebagai pusat pengalaman. Setiap halaman dirancang supaya data, lokasi, dan navigasi terasa seperti satu perjalanan yang sama.</p>
          </header>

          <div class="about__grid">
            <article class="about__card">
              <p class="about__card-label">Prinsip desain</p>
              <h2 class="about__card-title">Vibes nostalgia yang konsisten</h2>
              <p class="about__card-text">Warna terracotta, soft gold, dan cream dipakai untuk menjaga rasa hangat dari login sampai halaman detail.</p>
            </article>

            <article class="about__card">
              <p class="about__card-label">Arsitektur</p>
              <h2 class="about__card-title">SPA dengan pendekatan MVP</h2>
              <p class="about__card-text">Routing hash dipakai untuk perpindahan halaman, sementara logika tampilan dipisahkan agar mudah dikembangkan ke fitur API story.</p>
            </article>

            <article class="about__card about__card--accent">
              <p class="about__card-label">Aksesibilitas</p>
              <h2 class="about__card-title">Siap dibaca dan dipakai dengan nyaman</h2>
              <p class="about__card-text">Struktur semantik, label yang jelas, skip link, dan fokus keyboard disiapkan supaya pengalaman lebih inklusif.</p>
            </article>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    // Do your job here
  }
}
