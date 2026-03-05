import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AdminAuthState {
  admin: Admin | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (admin: Admin, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (admin, accessToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('adminAccessToken', accessToken);
        }
        set({ admin, accessToken, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminAccessToken');
        }
        set({ admin: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        admin: state.admin,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
