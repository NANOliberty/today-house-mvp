import { create } from 'zustand';
import apiClient from '@/src/lib/apiClient';

interface User {
  id: number;
  email: string;
  nickname: string;
  createdAt?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, nickname: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/register', { email, password, nickname });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      set({ user, token, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await apiClient.get('/auth/me');
      set({ user: response.data, token });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: null, token: null });
    }
  },
}));