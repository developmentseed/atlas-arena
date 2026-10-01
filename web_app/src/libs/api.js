import axios from 'axios';
import { API_URL } from '@/config/constants/general';
import { readHashParams, setHashParams } from '@/libs/hashParams';

// Sign-in goes through the atlasarena-model-infra API: GET {api}/auth/login
// sends the browser to Google and back to the API, which then redirects here
// with the outcome in the URL fragment: #token=<session token> or
// #error=<reason>. The token lives in sessionStorage (this tab only, gone when
// it closes) and is sent as the Bearer token on every call. The API replaces
// the whole fragment, so any page state in it (e.g. #job=...) is stashed
// before leaving and put back on return.

export const authConfigured = Boolean(API_URL);

const TOKEN_KEY = 'atlasarena.sessionToken';
const RETURN_HASH_KEY = 'atlasarena.returnHash';
const SIGN_IN_PARAMS = ['token', 'error', 'email'];

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked: the token just won't survive a reload.
  }
}

export function signInUrl() {
  try {
    if (window.location.hash) {
      sessionStorage.setItem(RETURN_HASH_KEY, window.location.hash);
    } else sessionStorage.removeItem(RETURN_HASH_KEY);
  } catch {
    // Storage blocked: the page state is lost across sign-in.
  }
  const returnTo = window.location.origin + window.location.pathname;
  return new URL(
    `auth/login?return_to=${encodeURIComponent(returnTo)}`,
    API_URL
  ).toString();
}

const SIGN_IN_ERRORS = {
  access_denied: 'This Google account is not on the AtlasArena allowlist.',
  sign_in_failed: 'Google sign-in failed. Try again.',
};

// Returns { token }, { error } or null if the URL carries no sign-in outcome.
export function readSignInFragment() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (!params.has('token') && !params.has('error')) return null;
  // Swap the token out of the address bar and history for the page state
  // stashed by signInUrl().
  let stashed = {};
  try {
    stashed = readHashParams(sessionStorage.getItem(RETURN_HASH_KEY) || '');
    sessionStorage.removeItem(RETURN_HASH_KEY);
  } catch {
    // Storage blocked: nothing was stashed.
  }
  setHashParams({
    ...Object.fromEntries(SIGN_IN_PARAMS.map((key) => [key, null])),
    ...stashed,
  });
  if (params.has('token')) return { token: params.get('token') };
  const error = params.get('error');
  const who = params.get('email') ? ` (${params.get('email')})` : '';
  return { error: (SIGN_IN_ERRORS[error] || `Sign-in error: ${error}`) + who };
}

// Called when the API rejects the session token, so the UI can sign out.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export async function apiFetch(
  path,
  { method = 'GET', data, auth = true, ...rest } = {}
) {
  const headers = { ...rest.headers };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  try {
    return await axios({
      ...rest,
      url: new URL(path, API_URL).toString(),
      method,
      data,
      headers,
    });
  } catch (err) {
    if (err.response?.status === 401 && token) {
      setToken(null);
      onUnauthorized();
    }
    throw err;
  }
}
