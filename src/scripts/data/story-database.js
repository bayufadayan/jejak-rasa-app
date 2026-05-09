import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;
const STORIES_STORE = 'stories';
const PENDING_STORIES_STORE = 'pending-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORIES_STORE)) {
      const storiesStore = database.createObjectStore(STORIES_STORE, {
        keyPath: 'id',
      });
      storiesStore.createIndex('createdAt', 'createdAt');
    }

    if (!database.objectStoreNames.contains(PENDING_STORIES_STORE)) {
      const pendingStore = database.createObjectStore(PENDING_STORIES_STORE, {
        keyPath: 'localId',
      });
      pendingStore.createIndex('createdAt', 'createdAt');
      pendingStore.createIndex('status', 'status');
    }
  },
});

function createLocalId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const StoryDatabase = {
  async putStory(story) {
    if (!story?.id) {
      throw new Error('`id` is required to save story.');
    }

    return (await dbPromise).put(STORIES_STORE, story);
  },

  async putStories(stories = []) {
    const database = await dbPromise;
    const transaction = database.transaction(STORIES_STORE, 'readwrite');
    await Promise.all(stories.map((story) => transaction.store.put(story)));
    await transaction.done;
  },

  async getStoryById(id) {
    if (!id) {
      throw new Error('`id` is required.');
    }

    return (await dbPromise).get(STORIES_STORE, id);
  },

  async getAllStories() {
    return (await dbPromise).getAll(STORIES_STORE);
  },

  async removeStory(id) {
    if (!id) {
      throw new Error('`id` is required.');
    }

    return (await dbPromise).delete(STORIES_STORE, id);
  },

  async addPendingStory(pendingStory) {
    const story = {
      ...pendingStory,
      localId: pendingStory?.localId || createLocalId(),
      createdAt: pendingStory?.createdAt || new Date().toISOString(),
      status: pendingStory?.status || 'pending',
    };

    await (await dbPromise).put(PENDING_STORIES_STORE, story);

    return story.localId;
  },

  async getPendingStoryById(localId) {
    if (!localId) {
      throw new Error('`localId` is required.');
    }

    return (await dbPromise).get(PENDING_STORIES_STORE, localId);
  },

  async getAllPendingStories() {
    return (await dbPromise).getAll(PENDING_STORIES_STORE);
  },

  async updatePendingStory(localId, payload) {
    const current = await this.getPendingStoryById(localId);
    if (!current) {
      return null;
    }

    const updated = {
      ...current,
      ...payload,
    };
    await (await dbPromise).put(PENDING_STORIES_STORE, updated);
    return updated;
  },

  async removePendingStory(localId) {
    if (!localId) {
      throw new Error('`localId` is required.');
    }

    return (await dbPromise).delete(PENDING_STORIES_STORE, localId);
  },
};

export default StoryDatabase;
