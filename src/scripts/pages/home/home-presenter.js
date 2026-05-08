export default class HomePresenter {
  #view;
  #model;
  #currentPage = 1;
  #isFetching = false;
  #hasMoreStories = true;
  #currentStories = [];
  #locationStories = [];

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async getStories(isLoadMore = false) {
    if (this.#isFetching) return;
    if (isLoadMore && !this.#hasMoreStories) return;

    this.#isFetching = true;

    if (!isLoadMore) {
      this.#currentPage = 1;
      this.#currentStories = [];
      this.#hasMoreStories = true;
      this.#view.showLoading();
    } else {
      this.#view.showLoadMoreLoading();
    }

    try {
      console.log(`HomePresenter: fetching stories from API (Page ${this.#currentPage})`);
      
      const fetchPromises = [
        this.#model.getStories({ page: this.#currentPage, size: 12, location: 0 }),
      ];

      // Only fetch location stories once on initial load
      if (!isLoadMore) {
        fetchPromises.push(this.#model.getStories({ size: 100, location: 1 }));
      }

      const [storiesResponse, locationStoriesResponse] = await Promise.all(fetchPromises);

      if (!storiesResponse.ok) {
        throw new Error(storiesResponse.message || 'Gagal memuat daftar cerita');
      }

      if (!isLoadMore && locationStoriesResponse && !locationStoriesResponse.ok) {
        throw new Error(locationStoriesResponse.message || 'Gagal memuat cerita berlokasi');
      }

      const newStories = storiesResponse.listStory || [];
      
      if (newStories.length < 12) {
        this.#hasMoreStories = false;
      }

      this.#currentStories = [...this.#currentStories, ...newStories];

      if (!isLoadMore && locationStoriesResponse) {
        this.#locationStories = (locationStoriesResponse.listStory || []).filter((story) => this.#hasValidCoordinate(story));
      }

      this.#view.populateStories(this.#currentStories, this.#locationStories, this.#hasMoreStories);
      
      this.#currentPage++;
    } catch (error) {
      console.error('HomePresenter: error:', error);
      this.#view.populateError(error.message || 'Gagal memuat home page');
    } finally {
      this.#isFetching = false;
      this.#view.hideLoading();
    }
  }

  #hasValidCoordinate(story) {
    const latitude = Number.parseFloat(story?.lat);
    const longitude = Number.parseFloat(story?.lon);
    return (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }
}
