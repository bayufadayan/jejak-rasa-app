export default class AddStoryPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async addStory({ description, photo, lat, lon }) {
    this.#view.showLoading(true);

    try {
      const response = await this.#model.addStory({
        description,
        photo,
        lat,
        lon,
      });

      if (!response.ok) {
        console.error('addStory: response:', response);
        this.#view.addStoryFailed(response.message || 'Gagal mengunggah cerita');
        return;
      }

      this.#view.addStorySuccessfully(response.message || 'Cerita berhasil dibagikan!');
    } catch (error) {
      console.error('addStory: error:', error);
      this.#view.addStoryFailed('Terjadi kesalahan saat mengunggah cerita');
    } finally {
      this.#view.showLoading(false);
    }
  }
}
