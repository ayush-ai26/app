import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  user_id: string;
  name: string;
  email: string;
  profile_picture?: string;
}

interface AuthState {
  user: User | null;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setAnonymous: (anonymous: boolean) => void;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAnonymous: false,
  isAuthenticated: false,
  
  setUser: async (user: User) => {
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, isAnonymous: false });
  },
  
  setAnonymous: (anonymous: boolean) => {
    set({ isAnonymous: anonymous, isAuthenticated: !anonymous });
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('user');
    set({ user: null, isAuthenticated: false, isAnonymous: false });
  },
  
  loadUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        set({ user: JSON.parse(userData), isAuthenticated: true });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  },
}));
