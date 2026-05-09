export default class SavedPresenter {
  #view;
  #model;
  #savedStories = [];

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getSavedStories() {
    this.#view.showLoading();

    try {
      this.#savedStories = await this.#model.getSavedStories();
      this.#view.populateSavedStories(this.#savedStories);
    } catch (error) {
      console.error('SavedPresenter: error:', error);
      this.#view.populateError(error.message || 'Gagal memuat cerita tersimpan');
    } finally {
      this.#view.hideLoading();
    }
  }

  async toggleSavedStory(storyId) {
    const targetStory = this.#savedStories.find((story) => story.id === storyId);
    if (!targetStory) {
      this.#view.showToast('error', 'Story tidak ditemukan.');
      return;
    }

    try {
      await this.#model.deleteSavedStory(storyId);
      this.#view.showToast('success', 'Story dihapus dari tersimpan.');
      await this.getSavedStories();
    } catch (error) {
      console.error('SavedPresenter.toggleSavedStory: error:', error);
      this.#view.showToast('error', error.message || 'Gagal menghapus story dari tersimpan');
    }
  }
}