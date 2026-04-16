'use client';

import React from 'react';
import { Search, Star, Filter, Bot, ChevronRight, Zap, Target, ArrowRight, Shield, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAgents, useAcquireAgent } from '@/hooks/useApi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export default function AgentMarketplace() {
  const { data: agents, isLoading } = useAgents();
  const { mutate: acquireAgent } = useAcquireAgent();
  const router = useRouter();

  const handleAcquireAgent = async (agentId: string) => {
    acquireAgent(agentId, {
      onSuccess: () => {
        router.push('/skills');
      },
      onError: (err: any) => {
        alert(err.response?.data?.error || "Failed to acquire agent");
      }
    });
  };

  return (
    <div className="flex-1 text-foreground space-y-8 p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        
        {/* Modern Header Section */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
               <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-foreground">Marketplace</h1>
               <p className="text-muted-foreground font-medium text-sm max-w-xl">Discover and deploy high-performance agents into your workspace.</p>
            </div>
            <Button 
              onClick={() => router.push('/skills/builder')}
              size="lg"
              className="gap-2"
            >
              <Zap size={16} /> Build Agent
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
             <div className="lg:col-span-3 relative group">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  type="text" 
                  placeholder="Search agents..." 
                  className="pl-10 h-12 rounded-[10px]"
                />
             </div>
             <Button variant="outline" className="h-12 w-full gap-2 rounded-[10px]">
                <Filter size={16} /> Filters
             </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {['All Units', 'Automation', 'Intelligence', 'Analysis', 'Enterprise', 'Social'].map((cat, i) => (
              <Button 
                key={cat} 
                variant={i === 0 ? 'default' : 'secondary'}
                className="rounded-full px-6 whitespace-nowrap"
              >
                {cat}
              </Button>
            ))}
          </div>
        </header>

        {/* Explorer Content */}
        {isLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="h-64 bg-muted rounded-[10px] animate-pulse" />
              ))}
           </div>
        ) : !agents || agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-card rounded-[10px] border border-border border-dashed text-center px-8">
             <div className="w-16 h-16 bg-card border border-border rounded-[10px] flex items-center justify-center text-muted-foreground mb-6 shadow-sm">
                <Target size={32} />
             </div>
             <h3 className="text-xl font-bold font-display mb-2">No agents found</h3>
             <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">The global grid is currently awaiting first-party or community-driven units.</p>
             <Button onClick={() => router.push('/builder')}>
                Create Agent
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-6">
            {agents.map((agent: any) => (
              <Card key={agent.id} className="p-6 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all shadow-md bg-card border-border/40">
                
                <div className="mb-6 flex justify-between items-start">
                   <div className="w-12 h-12 bg-card rounded-[10px] flex items-center justify-center text-foreground border border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all shadow-sm">
                      <Bot size={24} />
                   </div>
                   <div className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-card border border-border px-2 py-1 rounded-md shadow-sm">
                      <Star size={12} fill="currentColor" /> {agent.rating || '5.0'}
                   </div>
                </div>
                
                <div className="mb-4 flex items-center gap-2">
                   <span className="text-[10px] font-bold text-muted-foreground uppercase bg-card border border-border px-2 py-0.5 rounded-md shadow-sm">{agent.category || 'Automation'}</span>
                   <div className="flex items-center gap-1 text-[10px] font-bold text-foreground uppercase opacity-80">
                     <Shield size={12} /> Verified
                   </div>
                </div>
                
                <h3 className="text-lg font-bold font-display tracking-tight mb-2 truncate">{agent.name}</h3>
                <p className="text-sm text-muted-foreground mb-8 line-clamp-2">{agent.description || "No manual technical documentation provided for this unit."}</p>
                
                <div className="mt-auto flex items-center justify-between pt-6 border-t border-border">
                  <div className="flex flex-col">
                     <span className="text-lg font-bold text-foreground">{agent.price === 0 ? 'Free' : `${agent.price} Cr`}</span>
                     <span className="text-[10px] font-medium text-muted-foreground uppercase">Cost / Install</span>
                  </div>
                  <Button 
                    onClick={() => handleAcquireAgent(agent.id)}
                    className="gap-2"
                  >
                    Install <Download size={14} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
