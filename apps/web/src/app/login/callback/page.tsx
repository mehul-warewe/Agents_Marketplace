'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

import { Suspense } from 'react';

function LoginCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      const fetchProfile = async () => {
        try {
          const { data: user } = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          login(token, user);
          router.push('/dashboard');
        } catch (err) {
          console.error('Failed to fetch user profile during callback:', err);
          router.push('/?error=auth_failed');
        }
      };
      fetchProfile();
    } else {
      router.push('/?error=missing_token');
    }
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-indigo-500/20 rounded-full" />
        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin absolute inset-0" />
      </div>
      <div className="flex flex-col items-center transition-all animate-pulse">
        <p className="text-white font-bold tracking-[0.2em] uppercase text-xs">Authenticating</p>
        <p className="text-white/40 text-[10px] uppercase font-medium mt-1">Establishing Secure Session</p>
      </div>
    </div>
  );
}

export default function LoginCallback() {
  return (
    <Suspense fallback={null}>
       <LoginCallbackHandler />
    </Suspense>
  );
}
