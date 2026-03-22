import { Suspense } from 'react';
import AgentBuilder from '@/components/AgentBuilder';

export default function BuilderPage() {
  return (
    <main className="min-h-screen">
      <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" /></div>}>
        <AgentBuilder />
      </Suspense>
    </main>
  );
}
