import { create } from 'zustand';
import { api, getStoredUser, logoutUser, refreshCurrentUser } from './api';

const initialDataState = {
  users: [],
  attendance: [],
  tasks: [],
  clients: [],
  categories: [],
  subcategories: [],
  demands: [],
  bills: [],
  inventory: [],
  dashboard: null,
  loading: false,
  error: null,
  isSidebarOpen: false,
  language: 'en'
};

export const translations = {
  en: {
    dashboard: "Dashboard",
    myHub: "My Hub",
    attendance: "Attendance",
    tasks: "Tasks",
    clients: "Clients",
    demands: "Demands",
    bills: "Bills",
    monitor: "Live Monitor",
    users: "User Management",
    permissions: "Permissions",
    managerHub: "Manager Hub",
    markAttendance: "Mark Attendance",
    checkOut: "Check Out Now",
    presentToday: "Present Today",
    lateArrivals: "Late Arrivals",
    welcome: "Ready for your shift?",
    reliability: "Reliability",
    search: "Search...",
    save: "Save",
    cancel: "Cancel",
    logout: "Sign Out"
  },
  ur: {
    dashboard: "ڈیش بورڈ",
    myHub: "میرا حب",
    attendance: "حاضری",
    tasks: "کام",
    clients: "گاہک",
    demands: "ڈیمانڈز",
    bills: "بل",
    monitor: "لائیو مانیٹر",
    users: "یوزر مینجمنٹ",
    permissions: "اجازت نامے",
    managerHub: "منیجر حب",
    markAttendance: "حاضری لگائیں",
    checkOut: "چھٹی کریں",
    presentToday: "آج کل حاضر",
    lateArrivals: "دیر سے آنے والے",
    welcome: "کام کے لیے تیار ہیں؟",
    reliability: "کارکردگی",
    search: "تلاش کریں...",
    save: "محفوظ کریں",
    cancel: "منسوخ کریں",
    logout: "لاگ آؤٹ"
  }
};

const CACHE_KEY = "citibooks-app-cache";

function loadCache() {
  if (typeof localStorage === "undefined") return initialDataState;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : initialDataState;
  } catch {
    return initialDataState;
  }
}

function saveCache(updates) {
  if (typeof localStorage === "undefined") return;
  const current = loadCache();
  localStorage.setItem(CACHE_KEY, JSON.stringify({ ...current, ...updates }));
}

export const useStore = create((set, get) => ({
  user: getStoredUser(),
  ...loadCache(),
  translations: translations,

  setUser: (user) => set({ user, error: null }),
  setLanguage: (lang) => set({ language: lang }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),

  logout: () => {
    logoutUser();
    localStorage.removeItem(CACHE_KEY);
    set({ user: null, ...initialDataState });
  },

  // Called on app start — syncs live permissions from the DB
  syncUser: async () => {
    const freshUser = await refreshCurrentUser();
    if (freshUser) set({ user: freshUser });
  },

  fetchData: async () => {
    const user = get().user;
    if (!user) return;
    
    set({ loading: true });
    try {
      const isOwner = user.role === 'owner';
      const permissions = new Set(user.permissions || []);
      const canAccess = (permission) => isOwner || permissions.has(permission);
      
      const [
        users,
        attendance,
        tasks,
        clients,
        demandsData,
        bills,
        inventory
      ] = await Promise.all([
        isOwner ? api.getUsers() : Promise.resolve([]),
        canAccess('attendance') ? api.getAttendance() : Promise.resolve([]),
        canAccess('tasks') ? api.getTasks() : Promise.resolve([]),
        canAccess('clients') ? api.getClients() : Promise.resolve([]),
        canAccess('demands') ? api.getDemands() : Promise.resolve({ categories: [], subcategories: [], demands: [] }),
        canAccess('bills') ? api.getBills() : Promise.resolve([]),
        canAccess('inventory') ? api.getInventory() : Promise.resolve([])
      ]);

      const updates = { 
        users, 
        attendance, 
        tasks, 
        clients, 
        categories: demandsData.categories,
        subcategories: demandsData.subcategories,
        demands: demandsData.demands,
        bills,
        inventory,
        loading: false 
      };

      set(updates);
      saveCache(updates);
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Specific fetchers if needed
  fetchUsers: async () => {
    try {
      const users = await api.getUsers();
      set({ users });
      saveCache({ users });
      return users;
    } catch {
      return get().users;
    }
  },

  fetchTasks: async () => {
    try {
      const tasks = await api.getTasks();
      set({ tasks });
      saveCache({ tasks });
      return tasks;
    } catch {
      return get().tasks;
    }
  },

  fetchBills: async () => {
    // Bills page for employees uses the API directly (they see their own uploads)
    // But the store-wide fetch skips it for employees to avoid 403
    try {
      const bills = await api.getBills();
      set({ bills });
      saveCache({ bills });
      return bills;
    } catch {
      return get().bills;
    }
  },

  fetchClients: async () => {
    try {
      const clients = await api.getClients();
      set({ clients });
      saveCache({ clients });
      return clients;
    } catch {
      return get().clients;
    }
  },

  fetchAttendance: async () => {
    try {
      const attendance = await api.getAttendance();
      set({ attendance });
      saveCache({ attendance });
      return attendance;
    } catch {
      return get().attendance;
    }
  },

  fetchDemands: async () => {
    try {
      const data = await api.getDemands();
      const updates = { 
        categories: data.categories,
        subcategories: data.subcategories,
        demands: data.demands 
      };
      set(updates);
      saveCache(updates);
      return data;
    } catch {
      const state = get();
      return { categories: state.categories, subcategories: state.subcategories, demands: state.demands };
    }
  },

  fetchInventory: async () => {
    const user = get().user;
    if (user?.role !== 'owner') return []; // Employees cannot view the inventory list
    try {
      const inventory = await api.getInventory();
      set({ inventory });
      saveCache({ inventory });
      return inventory;
    } catch {
      return get().inventory;
    }
  },

  fetchDashboard: async () => {
    try {
      const dashboard = await api.getDashboard();
      set({ dashboard });
      saveCache({ dashboard });
      return dashboard;
    } catch {
      return get().dashboard;
    }
  }
}));
