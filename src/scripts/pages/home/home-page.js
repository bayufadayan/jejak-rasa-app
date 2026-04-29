export default class HomePage {
  async render() {
    return `
      <section class="container">
        <h1>Home Page</h1>
      </section>
    `;
  }

  async afterRender() {
    const navbar = document.getElementsByClassName("main__navbar")[0];
    navbar.classList.remove("hide-me");
  }
}
