'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // We set a default empty user object, the AuthProvider will immediately fetch '/auth/me'
      login(token, { id: '', name: '', email: '', tier: 'free', credits: 0 });
      router.push('/dashboard');
    } else {
      router.push('/');
    }
  }, [searchParams, router, login]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
        <p className="text-gray-400">Authenticating...</p>
      </div>
    </div>
  );
}

export default function LoginCallback() {
  return (
    <Suspense fallback={null}>
      <CallbackHandler />
    </Suspense>
  );
}
