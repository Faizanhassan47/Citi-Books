import { create } from 'zustand';
import { api, getStoredUser, logoutUser } from './api';

export const useStore = create((set, get) => ({
  user: getStoredUser(),
  users: [],
  attendance: [],
  tasks: [],
  clients: [],
  categories: [],
  subcategories: [],
  demands: [],
  bills: [],
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  logout: () => {
    logoutUser();
    set({ user: null });
  },

  fetchData: async () => {
    set({ loading: true });
    try {
      const [
        users,
        attendance,
        tasks,
        clients,
        demandsData,
        bills
      ] = await Promise.all([
        api.getUsers(),
        api.getAttendance(),
        api.getTasks(),
        api.getClients(),
        api.getDemands(),
        api.getBills()
      ]);

      set({ 
        users, 
        attendance, 
        tasks, 
        clients, 
        categories: demandsData.categories,
        subcategories: demandsData.subcategories,
        demands: demandsData.demands,
        bills,
        loading: false 
      });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Specific fetchers if needed
  fetchUsers: async () => {
    const users = await api.getUsers();
    set({ users });
  },

  fetchTasks: async () => {
    const tasks = await api.getTasks();
    set({ tasks });
  },

  fetchBills: async () => {
    const bills = await api.getBills();
    set({ bills });
  },

  fetchClients: async () => {
    const clients = await api.getClients();
    set({ clients });
  },

  fetchAttendance: async () => {
    const attendance = await api.getAttendance();
    set({ attendance });
  },

  fetchDemands: async () => {
    const data = await api.getDemands();
    set({ 
      categories: data.categories,
      subcategories: data.subcategories,
      demands: data.demands 
    });
  }
}));
