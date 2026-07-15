const KEYS = {
  COLLECTIONS: "postman_clone_collections",
  ENVIRONMENTS: "postman_clone_environments",
  ACTIVE_ENV: "postman_clone_active_env",
};

function safeParse(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function loadCollections() {
  return safeParse(localStorage.getItem(KEYS.COLLECTIONS), []);
}

export function saveCollections(collections) {
  localStorage.setItem(KEYS.COLLECTIONS, JSON.stringify(collections));
}

export function loadEnvironments() {
  return safeParse(localStorage.getItem(KEYS.ENVIRONMENTS), []);
}

export function saveEnvironments(environments) {
  localStorage.setItem(KEYS.ENVIRONMENTS, JSON.stringify(environments));
}

export function loadActiveEnvId() {
  return localStorage.getItem(KEYS.ACTIVE_ENV) || null;
}

export function saveActiveEnvId(id) {
  if (id === null || id === undefined) {
    localStorage.removeItem(KEYS.ACTIVE_ENV);
  } else {
    localStorage.setItem(KEYS.ACTIVE_ENV, id);
  }
}

export function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
