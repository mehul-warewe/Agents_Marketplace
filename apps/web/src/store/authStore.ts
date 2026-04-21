import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  tier: 'free' | 'pro' | 'ultra';
  credits: number;
}


interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setLoading: (state: boolean) => void;
  setUser: (user: User | null) => void;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    devtools(
      (set) => ({
        user: null,
        token: typeof window !== 'undefined' ? localStorage.getItem('workforce_token') : null,
        isLoading: true,
        isAuthModalOpen: false,
        login: (token, user) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem('workforce_token', token);
          }
          set({ token, user, isLoading: false, isAuthModalOpen: false });
        },
        logout: () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('workforce_token');
          }
          set({ token: null, user: null, isLoading: false });
        },
        setLoading: (state) => set({ isLoading: state }),
        setUser: (user) => set({ user, isLoading: false }),
        openAuthModal: () => set({ isAuthModalOpen: true }),
        closeAuthModal: () => set({ isAuthModalOpen: false }),
      }),
      { name: 'AuthStore' }
    ),
    {
      name: 'auth-store',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);
