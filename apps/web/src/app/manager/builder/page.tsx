'use client';

import SidebarLayout from '@/components/SidebarLayout';
import ManagerBuilder from '@/components/ManagerBuilder';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

export default function ManagerBuilderPage() {
  return (
    <main className="h-screen w-screen bg-background overflow-hidden relative">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center py-40 h-full">
          <Loader2 className="w-10 h-10 text-accent animate-spin mb-6" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Initializing_Architectural_Mesh</p>
        </div>
      }>
        <ManagerBuilder />
      </Suspense>
    </main>
  );
}
