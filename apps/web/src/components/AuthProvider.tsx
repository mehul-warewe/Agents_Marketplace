'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, setUser, logout, setLoading } = useAuthStore();

  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Auth verification failed', error);
        logout();
      }
    }

    verifyToken();
  }, [token, setUser, logout, setLoading]);

  return <>{children}</>;
}
