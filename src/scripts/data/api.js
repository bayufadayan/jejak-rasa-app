import CONFIG from '../config';
import { removeAccessToken, getAccessToken } from '../utils/auth';

const ENDPOINTS = {
  // AUTH
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,

  // Story
  STORIES: `${CONFIG.BASE_URL}/stories`,
};


export async function getRegistered({name, email, password}) {
  const data = JSON.stringify({name, email, password});

  const fetchResponse = await fetch(ENDPOINTS.REGISTER, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getLogin({email, password}) {
  const data = JSON.stringify({email, password});

  const fetchResponse = await fetch(ENDPOINTS.LOGIN, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
    },
    body: data,
  });
  const json = await fetchResponse.json();



  return {
    ...json,
    ok: fetchResponse.ok,
  }
}

export function getLogout() {
    removeAccessToken();
    location.hash = "/login";
}

export async function getStories({ page, size, location = 0 } = {}) {
  const token = getAccessToken();
  const url = new URL(ENDPOINTS.STORIES);
  if (page) url.searchParams.append('page', page);
  if (size) url.searchParams.append('size', size);
  url.searchParams.append('location', location);

  const fetchResponse = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function getStoryById(id) {
  const token = getAccessToken();
  const fetchResponse = await fetch(`${ENDPOINTS.STORIES}/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function addStory({ description, photo, lat, lon }) {
  const token = getAccessToken();
  const formData = new FormData();
  formData.append('description', description);
  formData.append('photo', photo);
  if (lat !== null && lat !== undefined && lat !== '') formData.append('lat', lat);
  if (lon !== null && lon !== undefined && lon !== '') formData.append('lon', lon);

  const fetchResponse = await fetch(ENDPOINTS.STORIES, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}