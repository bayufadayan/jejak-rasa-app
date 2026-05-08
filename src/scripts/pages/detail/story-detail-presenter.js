export default class StoryDetailPresenter {
  #storyId;
  #view;
  #model;

  constructor(storyId, { view, model }) {
    this.#storyId = storyId;
    this.#view = view;
    this.#model = model;
  }

  async getStoryDetail() {
    this.#view.showLoading();
    try {
      const response = await this.#model.getStoryById(this.#storyId);

      if (!response.ok) {
        throw new Error(response.message || 'Gagal memuat detail cerita');
      }

      this.#view.populateStoryDetail(response.story);
    } catch (error) {
      console.error('StoryDetailPresenter: error:', error);
      this.#view.populateError(error.message || 'Cerita tidak ditemukan');
    } finally {
      this.#view.hideLoading();
    }
  }
}
