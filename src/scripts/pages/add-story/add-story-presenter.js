export default class AddStoryPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showAddStoryMap() {
    this.#view.showMapLoading();

    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error('showAddStoryMap: error:', error);
      this.#view.showToast('error', 'Peta gagal dimuat');
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async addStory({ description, photo, lat, lon }) {
    this.#view.showLoading(true);

    try {
      const response = await this.#model.createStory({
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

      if (response.isPending) {
        this.#view.addStoryPending(response.message || 'Cerita disimpan offline.');
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
