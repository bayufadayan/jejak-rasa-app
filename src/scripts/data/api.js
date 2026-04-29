import CONFIG from '../config';
import { removeAccessToken } from '../utils/auth';

const ENDPOINTS = {
  // AUTH
  REGISTER: `${CONFIG.BASE_URL}/register`,
  LOGIN: `${CONFIG.BASE_URL}/login`,

  // Story
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

export async function getData() {
  const fetchResponse = await fetch(ENDPOINTS.ENDPOINT);
  return await fetchResponse.json();
}