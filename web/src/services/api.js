function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (configuredBaseUrl) {
    return stripTrailingSlash(configuredBaseUrl);
  }

  const configuredPort = import.meta.env.VITE_API_PORT?.trim() || '4000';

  if (typeof window === 'undefined') {
    return `http://localhost:${configuredPort}/api`;
  }

  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname || 'localhost';

  return `${protocol}//${hostname}:${configuredPort}/api`;
}

export const API_BASE_URL = resolveApiBaseUrl();
const SESSION_TOKEN_KEY = "citibooks-session-token";
const SESSION_USER_KEY = "citibooks-session-user";

let toastClient = null;
let unauthorizedHandler = null;

function getToken() {
  return localStorage.getItem(SESSION_TOKEN_KEY);
}

function storeSession(data) {
  localStorage.setItem(SESSION_TOKEN_KEY, data.token);
  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(data.user));
}

function clearSessionStorage() {
  localStorage.removeItem(SESSION_TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
}

export function registerApiClient({ toast, onUnauthorized } = {}) {
  toastClient = toast || null;
  unauthorizedHandler = onUnauthorized || null;
}

function fireErrorToast(message) {
  if (toastClient) {
    toastClient.error(message);
  }
}

async function readResponseBody(response) {
  if (response.status === 204) {
    return null;
  }

  return response.json().catch(() => null);
}

const OFFLINE_QUEUE_KEY = "citibooks-offline-queue";

function getOfflineQueue() {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

function addToOfflineQueue(path, options) {
  const queue = getOfflineQueue();
  const now = new Date();
  
  // Enhance body with original timing if not already present
  let body = {};
  try {
    body = JSON.parse(options.body || "{}");
  } catch {
    // If body is not JSON (e.g. FormData), we might skip for now or handle differently
    // For attendance it's always JSON in our app
  }

  body.customDate = body.customDate || now.toISOString().slice(0, 10);
  body.customTime = body.customTime || now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

  queue.push({
    id: Math.random().toString(36).substring(7),
    path,
    options: {
      ...options,
      body: JSON.stringify(body)
    },
    queuedAt: now.toISOString()
  });
  saveOfflineQueue(queue);
}

async function drainOfflineQueue() {
  if (!navigator.onLine) return;
  
  const queue = getOfflineQueue();
  if (queue.length === 0) return;

  console.log(`Draining ${queue.length} offline actions...`);
  const remaining = [];

  for (const action of queue) {
    try {
      await request(action.path, action.options, { suppressToast: true });
    } catch (err) {
      console.error("Failed to sync offline action", action, err);
      remaining.push(action);
    }
  }

  saveOfflineQueue(remaining);
  if (remaining.length === 0 && toastClient) {
    toastClient.success("All offline actions synchronized!");
  }
}

// Sync on startup and on online event
if (typeof window !== "undefined") {
  window.addEventListener("online", drainOfflineQueue);
  // Initial check
  setTimeout(drainOfflineQueue, 2000);
}

async function request(path, options = {}, config = {}) {
  const { requireAuth = true, suppressToast = false } = config;
  const token = getToken();
  const headers = {
    ...(options.headers || {})
  };

  if (requireAuth) {
    if (!token) {
      const message = "Please login first";
      clearSessionStorage();
      unauthorizedHandler?.();

      if (!suppressToast) {
        fireErrorToast(message);
      }

      throw new Error(message);
    }

    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });
  } catch {
    // OFFLINE HANDLER
    if (options.method && options.method !== 'GET') {
      addToOfflineQueue(path, options);
      const message = "Saved offline. Will sync when internet is back.";
      if (!suppressToast) {
        fireErrorToast(message);
      }
      return { message, offline: true };
    }

    const message = `Unable to reach backend. Check your connection.`;

    if (!suppressToast) {
      fireErrorToast(message);
    }

    throw new Error(message);
  }

  if (response.status === 401) {
    clearSessionStorage();
    unauthorizedHandler?.();
    const message = "Session expired. Please login again.";

    if (!suppressToast) {
      fireErrorToast(message);
    }

    throw new Error(message);
  }

  if (!response.ok) {
    const errorBody = await readResponseBody(response);
    const message = errorBody?.message || "Request failed";

    if (!suppressToast) {
      fireErrorToast(message);
    }

    throw new Error(message);
  }

  return readResponseBody(response);
}

export async function loginUser(username, password) {
  const data = await request(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ username, password })
    },
    { requireAuth: false }
  );

  storeSession(data);
  return data.user;
}

export function logoutUser() {
  clearSessionStorage();
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    clearSessionStorage();
    return null;
  }
}

/**
 * Called on app boot — fetches live user data from the DB to pick up
 * any permission changes the admin may have made since last login.
 */
export async function refreshCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const freshUser = await request('/auth/me');
    // Update stored user so the sidebar reflects new permissions immediately
    localStorage.setItem(SESSION_USER_KEY, JSON.stringify(freshUser));
    return freshUser;
  } catch {
    // If refresh fails (e.g. offline), fall back to stored user silently
    return getStoredUser();
  }
}

export const api = {
  getDashboard:       ()           => request("/dashboard"),
  getUsers:           ()           => request("/users"),
  createUser:         (p)          => request("/users", { method: "POST", body: JSON.stringify(p) }),
  updateUser:         (id, p)      => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(p) }),
  updateUserStatus:   (id, active) => request(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive: active }) }),
  promoteUser:        (id)         => request(`/users/${id}/promote`, { method: "POST" }),
  demoteUser:         (id)         => request(`/users/${id}/demote`, { method: "POST" }),
  resetUserPassword:  (id, pwd)    => request(`/users/${id}/reset-password`, { method: "POST", body: JSON.stringify({ password: pwd }) }),
  deleteUser:         (id)         => request(`/users/${id}`, { method: "DELETE" }),

  getAttendance:        ()         => request("/attendance"),
  getAttendanceSummary: ()         => request("/attendance/summary"),
  checkIn:            (p)          => request("/attendance/check-in", { method: "POST", body: JSON.stringify(p) }),
  checkOut:           ()           => request("/attendance/check-out", { method: "POST" }),

  getTasks:           ()           => request("/tasks"),
  createTask:         (p)          => request("/tasks", { method: "POST", body: JSON.stringify(p) }),
  updateTask:         (id, p)      => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(p) }),
  updateTaskStatus:   (id, status) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteTask:         (id)         => request(`/tasks/${id}`, { method: "DELETE" }),

  getClients:         ()           => request("/clients"),
  createClient:       (p)          => request("/clients", { method: "POST", body: JSON.stringify(p) }),
  updateClient:       (id, p)      => request(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(p) }),
  deleteClient:       (id)         => request(`/clients/${id}`, { method: "DELETE" }),

  getDemands:         ()           => request("/demands"),
  createCategory:     (p)          => request("/demands/categories", { method: "POST", body: JSON.stringify(p) }),
  createSubcategory:  (p)          => request("/demands/subcategories", { method: "POST", body: JSON.stringify(p) }),
  createDemand:       (p)          => request("/demands", { method: "POST", body: JSON.stringify(p) }),
  updateDemandStatus: (id, status) => request(`/demands/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteDemand:       (id)         => request(`/demands/${id}`, { method: "DELETE" }),

  getBills:           ()           => request("/bills"),
  createBill:         (p)          => request("/bills", { method: "POST", body: JSON.stringify(p) }),
  updateBill:         (id, p)      => request(`/bills/${id}`, { method: "PATCH", body: JSON.stringify(p) }),
  updateBillStatus:   (id, status, paymentMethod) => request(`/bills/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, paymentMethod }) }),
  deleteBill:         (id)         => request(`/bills/${id}`, { method: "DELETE" }),

  getInventory:       ()           => request("/inventory"),
  createInventoryItem: (p)          => request("/inventory", { method: "POST", body: JSON.stringify(p) }),
  updateInventoryItem: (id, p)      => request(`/inventory/${id}`, { method: "PATCH", body: JSON.stringify(p) }),
  deleteInventoryItem: (id)         => request(`/inventory/${id}`, { method: "DELETE" }),

  getLogs:            ()           => request("/logs"),

  getMe: () => request("/auth/me")
};

