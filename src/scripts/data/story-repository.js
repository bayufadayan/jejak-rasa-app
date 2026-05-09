import * as StoryAPI from './api.js';
import StoryDatabase from './story-database.js';

function isConnectivityError(error) {
  return error instanceof TypeError;
}

function hasValidCoordinate(story) {
  const latitude = Number.parseFloat(story?.lat);
  const longitude = Number.parseFloat(story?.lon);
  return (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180
  );
}

function dataUrlToFile(dataUrl, filename = 'offline-story.jpg', mimeType = 'image/jpeg') {
  const [meta, content] = dataUrl.split(',');
  const mimeMatch = meta?.match(/data:(.*?);base64/);
  const contentType = mimeMatch?.[1] || mimeType;
  const binary = atob(content || '');
  const length = binary.length;
  const bytes = new Uint8Array(length);

  for (let index = 0; index < length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new File([bytes], filename, { type: contentType });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal memproses file story.'));
    reader.readAsDataURL(file);
  });
}

function toPendingViewModel(pendingStory) {
  return {
    id: `local-pending-${pendingStory.localId}`,
    name: 'Anda (Offline)',
    description: pendingStory.description,
    photoUrl: pendingStory.photoDataUrl,
    createdAt: pendingStory.createdAt,
    lat: pendingStory.lat,
    lon: pendingStory.lon,
    isPending: true,
    pendingStatus: pendingStory.status,
    localId: pendingStory.localId,
  };
}

function sortByDateDesc(stories) {
  return [...stories].sort((first, second) => {
    const firstDate = new Date(first.createdAt || 0).getTime();
    const secondDate = new Date(second.createdAt || 0).getTime();
    return secondDate - firstDate;
  });
}

function sortBySavedAtDesc(stories) {
  return [...stories].sort((first, second) => {
    const firstDate = new Date(first.savedAt || first.createdAt || 0).getTime();
    const secondDate = new Date(second.savedAt || second.createdAt || 0).getTime();
    return secondDate - firstDate;
  });
}

const StoryRepository = {
  async getCachedStories() {
    return sortByDateDesc(await StoryDatabase.getAllStories());
  },

  async getPendingStories() {
    const pendingStories = await StoryDatabase.getAllPendingStories();
    return sortByDateDesc(pendingStories.map(toPendingViewModel));
  },

  async getSavedStories() {
    return sortBySavedAtDesc(await StoryDatabase.getAllSavedStories());
  },

  async getSavedStoryById(id) {
    return StoryDatabase.getSavedStoryById(id);
  },

  async saveStory(story) {
    return StoryDatabase.saveStory(story);
  },

  async deleteSavedStory(id) {
    return StoryDatabase.deleteSavedStory(id);
  },

  async isStorySaved(id) {
    return Boolean(await StoryDatabase.getSavedStoryById(id));
  },

  async getMergedStories() {
    const [cachedStories, pendingStories] = await Promise.all([
      this.getCachedStories(),
      this.getPendingStories(),
    ]);

    return sortByDateDesc([...pendingStories, ...cachedStories]);
  },

  async fetchStoriesPage(params) {
    const response = await StoryAPI.getStories(params);
    if (response.ok) {
      await StoryDatabase.putStories(response.listStory || []);
    }

    return response;
  },

  async createStory({ description, photo, lat, lon }) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await StoryAPI.addStory({ description, photo, lat, lon });
        if (response.ok) {
          return {
            ok: true,
            isPending: false,
            message: response.message || 'Cerita berhasil dibagikan.',
          };
        }

        return {
          ok: false,
          isPending: false,
          message: response.message || 'Gagal menambahkan cerita.',
        };
      } catch (error) {
        if (!isConnectivityError(error)) {
          throw error;
        }
      }
    }

    const photoDataUrl = await fileToDataUrl(photo);
    const localId = await StoryDatabase.addPendingStory({
      description,
      photoDataUrl,
      photoName: photo.name,
      photoType: photo.type,
      lat,
      lon,
      status: 'pending',
    });

    return {
      ok: true,
      isPending: true,
      localId,
      message: 'Cerita disimpan offline dan akan dikirim otomatis saat online.',
    };
  },

  async syncPendingStories() {
    if (!navigator.onLine) {
      return {
        syncedCount: 0,
      };
    }

    const pendingStories = await StoryDatabase.getAllPendingStories();
    if (!pendingStories.length) {
      return {
        syncedCount: 0,
      };
    }

    let syncedCount = 0;
    for (const pending of pendingStories) {
      try {
        const photoFile = dataUrlToFile(pending.photoDataUrl, pending.photoName, pending.photoType);
        const response = await StoryAPI.addStory({
          description: pending.description,
          photo: photoFile,
          lat: pending.lat,
          lon: pending.lon,
        });

        if (!response.ok) {
          await StoryDatabase.updatePendingStory(pending.localId, {
            status: 'failed',
          });
          continue;
        }

        await StoryDatabase.removePendingStory(pending.localId);
        syncedCount += 1;
      } catch (error) {
        if (!isConnectivityError(error)) {
          await StoryDatabase.updatePendingStory(pending.localId, {
            status: 'failed',
          });
        }
      }
    }

    return {
      syncedCount,
    };
  },

  async removeStoryFromLocal(id) {
    if (!id) {
      throw new Error('`id` is required.');
    }

    if (id.startsWith('local-pending-')) {
      const localId = id.replace('local-pending-', '');
      await StoryDatabase.removePendingStory(localId);
      await StoryDatabase.deleteSavedStory(id);
      return true;
    }

    await StoryDatabase.removeStory(id);
    await StoryDatabase.deleteSavedStory(id);
    return true;
  },

  hasValidCoordinate,
};

export default StoryRepository;
