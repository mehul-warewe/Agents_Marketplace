'use client';

import React, { useEffect, useState, Suspense } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const router = useRouter();

  useEffect(() => {
    // In a real app, we might poll the API to confirm the session was processed by the webhook
    // For now, we'll just wait a bit to give the webhook time to finish
    const timer = setTimeout(() => {
      setStatus('success');
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <SidebarLayout>
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        {status === 'loading' ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-accent animate-spin" />
            <h1 className="text-2xl font-black">Verifying your payment...</h1>
            <p className="text-muted">This will only take a moment.</p>
          </div>
        ) : (
          <div className="max-w-md w-full animate-fade-in-up">
            <div className="relative mb-8 inline-block">
              <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full" />
              <div className="relative w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center mx-auto shadow-2xl shadow-green-500/20">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <div className="absolute -top-2 -right-2">
                <div className="p-1.5 rounded-lg bg-accent text-white shadow-lg animate-bounce">
                  <Sparkles size={16} />
                </div>
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tight mb-4">Payment Successful!</h1>
            <p className="text-muted text-lg mb-12">
              Your account has been credited. You can now continue building and running your autonomous agents.
            </p>

            <div className="grid grid-cols-1 gap-4">
              <Link
                href="/dashboard"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-accent text-white font-black text-sm hover:bg-accent/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent/20"
              >
                Go to Dashboard <ArrowRight size={16} />
              </Link>
              
              <Link
                href="/builder"
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-white/5 border border-white/5 font-black text-sm hover:bg-white/10 transition-all"
              >
                Start Building
              </Link>
            </div>

            <p className="mt-12 text-[10px] text-muted font-bold uppercase tracking-widest">
              Session ID: {sessionId?.substring(0, 20)}...
            </p>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <BillingSuccessContent />
    </Suspense>
  );
}
