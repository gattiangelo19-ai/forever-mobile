import { create } from 'zustand';
import storage from '../config/storage';
import api from '../config/api';
import { disconnectSocket } from '../config/socket';

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await storage.getItem('accessToken');
      if (!token) return set({ isLoading: false });

      const { data } = await api.get('/auth/me').catch(() => ({ data: null }));
      set({ user: data?.data || null, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await storage.setItem('accessToken', data.data.accessToken);
    await storage.setItem('refreshToken', data.data.refreshToken);
    set({ user: data.data.user });
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    await storage.setItem('accessToken', data.data.accessToken);
    await storage.setItem('refreshToken', data.data.refreshToken);
    set({ user: data.data.user });
  },

  logout: async () => {
    const refreshToken = await storage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
    await storage.deleteItem('accessToken');
    await storage.deleteItem('refreshToken');
    disconnectSocket();
    set({ user: null });
  },
}));

export default useAuthStore;
