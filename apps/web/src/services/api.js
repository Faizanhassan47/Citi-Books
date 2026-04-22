const API_BASE_URL = "http://localhost:4000/api";
const SESSION_TOKEN_KEY = "citibooks-session-token";
const SESSION_USER_KEY = "citibooks-session-user";

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

async function request(path, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Please login first");
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    clearSessionStorage();
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "Request failed" }));
    throw new Error(errorBody.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function loginUser(username, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "Login failed" }));
    throw new Error(errorBody.message || "Login failed");
  }

  const data = await response.json();
  storeSession(data);
  return data.user;
}

export function logoutUser() {
  clearSessionStorage();
}

export function getStoredUser() {
  const raw = localStorage.getItem(SESSION_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export const api = {
  getDashboard: () => request("/dashboard"),
  getUsers: () => request("/users"),
  createUser: (payload) => request("/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  updateUserStatus: (id, isActive) => request(`/users/${id}/status`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
  promoteUser: (id) => request(`/users/${id}/promote`, { method: "POST" }),
  demoteUser: (id) => request(`/users/${id}/demote`, { method: "POST" }),
  resetUserPassword: (id, password) => request(`/users/${id}/reset-password`, { method: "POST", body: JSON.stringify({ password }) }),
  deleteUser: (id) => request(`/users/${id}`, { method: "DELETE" }),

  getAttendance: () => request("/attendance"),
  getAttendanceSummary: () => request("/attendance/summary"),

  getTasks: () => request("/tasks"),
  createTask: (payload) => request("/tasks", { method: "POST", body: JSON.stringify(payload) }),
  updateTask: (id, payload) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  getClients: () => request("/clients"),
  createClient: (payload) => request("/clients", { method: "POST", body: JSON.stringify(payload) }),
  updateClient: (id, payload) => request(`/clients/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  getDemands: () => request("/demands"),
  createCategory: (payload) => request("/demands/categories", { method: "POST", body: JSON.stringify(payload) }),
  createSubcategory: (payload) => request("/demands/subcategories", { method: "POST", body: JSON.stringify(payload) }),
  createDemand: (payload) => request("/demands", { method: "POST", body: JSON.stringify(payload) }),
  updateDemandStatus: (id, status) => request(`/demands/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),

  getBills: () => request("/bills"),
  createBill: (payload) => request("/bills", { method: "POST", body: JSON.stringify(payload) }),
  updateBill: (id, payload) => request(`/bills/${id}`, { method: "PATCH", body: JSON.stringify(payload) })
};
