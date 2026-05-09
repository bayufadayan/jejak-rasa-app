export default class HomePresenter {
  #view;
  #model;
  #currentPage = 1;
  #isFetching = false;
  #hasMoreStories = true;
  #allStories = [];
  #savedStoryIds = new Set();
  #searchQuery = '';
  #sortBy = 'newest';
  #filterBy = 'all';

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
      this.#allStories = [];
      this.#hasMoreStories = true;
      this.#view.showLoading();
    } else {
      this.#view.showLoadMoreLoading();
    }

    try {
      if (!isLoadMore) {
        const localStories = await this.#model.getMergedStories();
        this.#allStories = localStories;
        await this.#refreshSavedStories();
        this.#notifyView();
      }

      const storiesResponse = await this.#model.fetchStoriesPage({
        page: this.#currentPage,
        size: 12,
        location: 0,
      });

      if (!storiesResponse.ok) {
        throw new Error(storiesResponse.message || 'Gagal memuat daftar cerita');
      }

      const newStories = storiesResponse.listStory || [];
      if (newStories.length < 12) {
        this.#hasMoreStories = false;
      }

      this.#allStories = await this.#model.getMergedStories();
      await this.#refreshSavedStories();
      this.#notifyView();
      this.#currentPage++;
    } catch (error) {
      console.error('HomePresenter: error:', error);
      this.#view.populateError(error.message || 'Gagal memuat home page');
    } finally {
      this.#isFetching = false;
      this.#view.hideLoading();
    }
  }

  setSearchQuery(searchQuery) {
    this.#searchQuery = (searchQuery || '').trim().toLowerCase();
    this.#notifyView();
  }

  setSortBy(sortBy) {
    this.#sortBy = sortBy || 'newest';
    this.#notifyView();
  }

  setFilterBy(filterBy) {
    this.#filterBy = filterBy || 'all';
    this.#notifyView();
  }

  async removeStory(id) {
    try {
      await this.#model.removeStoryFromLocal(id);
      this.#allStories = await this.#model.getMergedStories();
      await this.#refreshSavedStories();
      this.#notifyView();
    } catch (error) {
      console.error('removeStory: error:', error);
      this.#view.showToast('error', error.message || 'Gagal menghapus story dari IndexedDB');
    }
  }

  async toggleSavedStory(storyId) {
    const targetStory = this.#allStories.find((story) => story.id === storyId);
    if (!targetStory) {
      this.#view.showToast('error', 'Story tidak ditemukan.');
      return;
    }

    try {
      const isSaved = this.#savedStoryIds.has(storyId);

      if (isSaved) {
        await this.#model.deleteSavedStory(storyId);
        this.#view.showToast('success', 'Story dihapus dari tersimpan.');
      } else {
        await this.#model.saveStory(targetStory);
        this.#view.showToast('success', 'Story disimpan di menu Tersimpan.');
      }

      await this.#refreshSavedStories();
      this.#notifyView();
    } catch (error) {
      console.error('toggleSavedStory: error:', error);
      this.#view.showToast('error', error.message || 'Gagal mengubah status tersimpan.');
    }
  }

  #notifyView() {
    const filteredStories = this.#getFilteredStories().map((story) => ({
      ...story,
      isSaved: this.#savedStoryIds.has(story.id),
    }));
    const locationStories = filteredStories.filter((story) => this.#model.hasValidCoordinate(story));
    this.#view.populateStories(filteredStories, locationStories, this.#hasMoreStories);
  }

  async #refreshSavedStories() {
    const savedStories = await this.#model.getSavedStories();
    this.#savedStoryIds = new Set(savedStories.map((story) => story.id));
  }

  #getFilteredStories() {
    const text = this.#searchQuery;

    let stories = [...this.#allStories];

    if (text) {
      stories = stories.filter((story) => {
        const name = (story.name || '').toLowerCase();
        const description = (story.description || '').toLowerCase();
        return name.includes(text) || description.includes(text);
      });
    }

    if (this.#filterBy === 'with-location') {
      stories = stories.filter((story) => this.#model.hasValidCoordinate(story));
    } else if (this.#filterBy === 'without-location') {
      stories = stories.filter((story) => !this.#model.hasValidCoordinate(story));
    } else if (this.#filterBy === 'pending') {
      stories = stories.filter((story) => story.isPending);
    }

    stories.sort((first, second) => {
      const firstDate = new Date(first.createdAt || 0).getTime();
      const secondDate = new Date(second.createdAt || 0).getTime();
      if (this.#sortBy === 'oldest') {
        return firstDate - secondDate;
      }
      return secondDate - firstDate;
    });

    return stories;
  }
}
