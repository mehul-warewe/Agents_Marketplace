'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

import { useUser } from '@/hooks/useApi';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  // useUser hook already handles setUser and token checking internally now
  useUser();

  return <>{children}</>;
}
