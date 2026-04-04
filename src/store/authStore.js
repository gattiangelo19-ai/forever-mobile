import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../config/api';
import { disconnectSocket } from '../config/socket';

const useAuthStore = create((set) => ({
  user: null,
  isLoading: true,

  // Controlla se c'è già una sessione salvata
  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) return set({ isLoading: false });

      const { data } = await api.get('/auth/me').catch(() => ({ data: null }));
      set({ user: data?.data || null, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
    set({ user: data.data.user });
  },

  register: async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    await SecureStore.setItemAsync('accessToken', data.data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.data.refreshToken);
    set({ user: data.data.user });
  },

  logout: async () => {
    const refreshToken = await SecureStore.getItemAsync('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    disconnectSocket();
    set({ user: null });
  },
}));

export default useAuthStore;
