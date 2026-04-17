'use client';
import React, { useState, useRef } from 'react';
import { Search, Star, Filter, Bot, ChevronRight, Zap, Target, ArrowRight, Shield, Download, Lock, Plus, Layers } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAgents, useAcquireAgent, useMyAgents, useWorkerDirectory } from '@/hooks/useApi';
import { useManagerDirectory } from '@/hooks/useManager';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatLabel } from '@/components/ui/utils';
import { useDebounce } from '@/hooks/useDebounce';

export default function AgentMarketplace() {
  const { data: agents = [], isLoading: isLoadingAgents } = useAgents();
  const { data: employeeDirectory = [], isLoading: isLoadingEmployees } = useWorkerDirectory();
  const { data: managerDirectory = [], isLoading: isLoadingManagers } = useManagerDirectory();
  const { data: mySkills } = useMyAgents();
  const { mutate: acquireAgent } = useAcquireAgent();
  const { user } = useAuthStore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeCategory, setActiveCategory] = useState('All Units');
  const [selectedMeshTier, setSelectedMeshTier] = useState<'skills' | 'employees' | 'managers'>('skills');

  const ownedIds = React.useMemo(() => {
    if (!mySkills) return new Set<string>();
    return new Set(mySkills.map((s: any) => s.originalId || s.id));
  }, [mySkills]);

  const isAlreadyOwned = (agentId: string) => {
    return ownedIds.has(agentId);
  };

  const [confirmingUnit, setConfirmingUnit] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleAcquireAgent = async (agentId: string) => {
    acquireAgent(agentId, {
      onSuccess: () => {
        setConfirmingUnit(null);
        router.push('/skills');
      },
      onError: (err: any) => {
        setConfirmingUnit(null);
        alert(err.response?.data?.error || "Failed to acquire unit");
      }
    });
  };

  const getFilteredSkills = () => {
    return (agents as any[]).filter(agent => {
      const matchesSearch = agent.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                          (agent.description || '').toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesCategory = activeCategory === 'All Units' || agent.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getActiveUnits = () => {
    const rawSearch = debouncedSearch.toLowerCase();
    if (selectedMeshTier === 'skills') return getFilteredSkills();
    if (selectedMeshTier === 'employees') return (employeeDirectory as any[]).filter(e => e.name.toLowerCase().includes(rawSearch) || e.description?.toLowerCase().includes(rawSearch));
    return (managerDirectory as any[]).filter(m => m.name.toLowerCase().includes(rawSearch) || m.description?.toLowerCase().includes(rawSearch));
  };

  const activeUnits = getActiveUnits();
  const isLoading = selectedMeshTier === 'skills' ? isLoadingAgents : 
                    selectedMeshTier === 'employees' ? isLoadingEmployees : 
                    isLoadingManagers;

  return (
    <div className="flex-1 h-full text-foreground p-0 bg-background flex flex-col overflow-hidden">
      {/* Platform Header */}
      <header className="bg-card border-b border-border/40 px-6 pt-6 pb-0 space-y-6 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
             <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
               {selectedMeshTier === 'skills' ? 'Skill' : selectedMeshTier === 'employees' ? 'Employee' : 'Manager'} Marketplace
             </h1>
             <p className="text-muted-foreground font-medium text-[11px] max-w-xl">
                Discover and deploy high-performance {selectedMeshTier} into your workforce repository.
             </p>
          </div>
        </div>

        {/* Professional Navigation Tabs */}
        <div className="flex items-center gap-8 border-b border-transparent">
          {[
            { id: 'skills', label: 'Skills', icon: Zap, color: 'text-indigo-500' },
            { id: 'employees', label: 'Employees', icon: Bot, color: 'text-emerald-500' },
            { id: 'managers', label: 'Managers', icon: Shield, color: 'text-amber-500' }
          ].map(tier => (
            <button
              key={tier.id}
              onClick={() => setSelectedMeshTier(tier.id as any)}
              className={`pb-4 px-1 text-[11px] font-bold uppercase tracking-[0.15em] transition-all flex items-center gap-2.5 relative group ${selectedMeshTier === tier.id ? tier.color : 'text-muted-foreground/60 hover:text-foreground'}`}
            >
              <tier.icon size={14} strokeWidth={selectedMeshTier === tier.id ? 2.5 : 2} />
              {tier.label}
              
              {/* Active Indicator */}
              {selectedMeshTier === tier.id && (
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full ${tier.id === 'skills' ? 'bg-indigo-600' : tier.id === 'employees' ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              )}
            </button>
          ))}
        </div>

        <div className="pb-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                <Input 
                  type="text" 
                  placeholder={`Search the registry for ${selectedMeshTier}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 h-10 rounded-xl bg-background border-border/40 focus:border-indigo-500/50 text-[11px] font-medium shadow-sm transition-all"
                />
            </div>
            <Button variant="outline" className="h-10 w-full gap-2 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-background border-border/40 shadow-sm transition-all">
                <Filter size={14} /> Filter Logic
            </Button>
          </div>

          {selectedMeshTier === 'skills' && (
            <div className="flex gap-2 overflow-x-auto pb-0 no-scrollbar">
              {['All Units', 'Automation', 'Intelligence', 'Analysis', 'Enterprise', 'Social'].map((cat) => (
                <Button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  variant={activeCategory === cat ? 'default' : 'secondary'}
                  className={`rounded-full px-5 whitespace-nowrap font-bold text-[10px] uppercase tracking-widest h-7 transition-all ${activeCategory === cat ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/10 border-none' : 'bg-secondary/50 hover:bg-secondary text-muted-foreground border border-border/20'}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Operational Deck (No Vertical Scroll) */}
      <div className="flex-1 overflow-hidden p-6 bg-secondary/5 pt-8 flex flex-col">

        {/* Explorer Content */}
        {isLoading ? (
           <div 
            className="flex-1 overflow-x-auto pb-6 pt-2 flex flex-row gap-4 items-start no-scrollbar pr-20"
           >
              {[1, 2, 3, 4, 5, 6].map(i => (
                 <div key={i} className="w-72 flex-shrink-0 h-[320px] bg-muted animate-pulse rounded-2xl" />
              ))}
           </div>
        ) : activeUnits.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-card rounded-2xl border border-border border-dashed text-center px-8">
             <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-500 mb-6 shadow-sm">
                <Target size={32} />
             </div>
             <h3 className="text-xl font-bold font-display mb-2">No {selectedMeshTier} found</h3>
             <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto">Either the registry is empty or no units match your current search parameters.</p>
             <Button onClick={() => setSearchTerm('')}>
                Clear Search
             </Button>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            onWheel={handleWheel}
            className="flex-1 overflow-x-auto pb-12 pt-2 flex flex-row gap-4 items-start scrollbar-thin scrollbar-thumb-indigo-500/10 hover:scrollbar-thumb-indigo-500/20 scrollbar-track-transparent pr-20 scroll-smooth px-6"
          >
            {activeUnits.map((agent: any) => (
              <div 
                key={agent.id} 
                className="group relative bg-card border border-border/40 hover:border-indigo-500/30 rounded-2xl p-5 flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/5 overflow-hidden flex-shrink-0 w-72 h-[320px]"
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                
                <div className="mb-3 flex justify-between items-start relative z-10">
                   <div className={`size-10 rounded-xl bg-secondary border border-border/40 flex items-center justify-center transition-all duration-500 shadow-inner group-hover:text-white group-hover:border-transparent group-hover:rotate-3
                     ${selectedMeshTier === 'skills' ? 'text-indigo-500 group-hover:bg-indigo-600' : 
                       selectedMeshTier === 'employees' ? 'text-emerald-500 group-hover:bg-emerald-600' : 
                       'text-amber-500 group-hover:bg-amber-600'}`}>
                      {selectedMeshTier === 'skills' ? <Zap size={20} strokeWidth={2.5} /> : 
                       selectedMeshTier === 'employees' ? <Bot size={20} strokeWidth={2.5} /> : 
                       <Shield size={20} strokeWidth={2.5} />}
                   </div>
                   <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-foreground/5 border border-border/10 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Star size={8} fill="currentColor" className="text-amber-500" /> {agent.rating || '5.0'}
                      </div>
                      <div className="flex items-center gap-1 text-[7px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">
                         <Shield size={8} strokeWidth={3} /> Verified
                      </div>
                   </div>
                </div>
                
                <div className="mb-2.5 relative z-10">
                   <span className={`text-[8px] font-black uppercase tracking-widest
                     ${selectedMeshTier === 'skills' ? 'text-indigo-500' : 
                       selectedMeshTier === 'employees' ? 'text-emerald-500' : 
                       'text-amber-500'}`}>
                      {formatLabel(agent.category || 'Automation')}
                   </span>
                   <h3 className="text-xs font-bold font-display tracking-tight text-foreground line-clamp-1 mt-0.5 group-hover:text-indigo-600 transition-colors">
                      {agent.name}
                   </h3>
                </div>

                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-4 leading-relaxed font-medium">
                  {agent.description || "Specialized logic unit for workforce orchestration and process optimization."}
                </p>
                
                {/* Credentials / Requirements / Fleet Stats */}
                <div className="flex flex-wrap gap-1 mb-4 h-4 overflow-hidden">
                  {selectedMeshTier === 'skills' ? (
                    <>
                      {(agent.requiredCredentials as any[] || []).slice(0, 2).map((cred, idx) => (
                        <div key={idx} className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/20 text-[7px] font-bold text-amber-600/80 uppercase">
                          <Lock size={7} /> {formatLabel(cred.provider)}
                        </div>
                      ))}
                      {(agent.requiredCredentials as any[] || []).length === 0 && (
                        <div className="text-[8px] font-bold text-muted-foreground/20 uppercase tracking-widest">System Native</div>
                      )}
                    </>
                  ) : selectedMeshTier === 'employees' ? (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-[7px] font-bold text-emerald-600/80 uppercase">
                       <Zap size={7} /> {agent.unitCount || 0} Core Skills Included
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/5 border border-amber-500/20 text-[7px] font-bold text-amber-600/80 uppercase">
                       <Bot size={7} /> {agent.fleetSize || 0} Units Orchestrated
                    </div>
                  )}
                </div>

                <div className="mt-auto space-y-3 pt-3 border-t border-border/40 relative z-10">
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[11px] font-bold text-foreground leading-none">
                            {agent.price === 0 || agent.price === null ? 'Open Source' : `${agent.price} Cr`}
                         </span>
                         <span className="text-[8px] font-bold text-muted-foreground/50 uppercase tracking-tighter mt-1">
                            {agent.price === 0 || agent.price === null ? 'Public Domain' : 'Premium Unit'}
                         </span>
                      </div>
                   </div>

                   <button 
                    onClick={() => {
                      if (selectedMeshTier === 'skills') {
                        if (isAlreadyOwned(agent.id)) {
                          router.push('/skills');
                        } else {
                          setConfirmingUnit(agent);
                        }
                      } else if (selectedMeshTier === 'employees') {
                        router.push('/employees');
                      } else {
                        router.push('/manager');
                      }
                    }}
                    className={`h-8 w-full rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border-none shadow-sm
                      ${selectedMeshTier === 'skills' && isAlreadyOwned(agent.id)
                        ? 'bg-secondary text-muted-foreground hover:bg-secondary/80' 
                        : (selectedMeshTier === 'skills' ? 'bg-indigo-600 hover:bg-indigo-700' : 
                           selectedMeshTier === 'employees' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                           'bg-amber-600 hover:bg-amber-700') + ' text-white shadow-lg active:scale-95'
                    }`}
                  >
                    {selectedMeshTier === 'skills' && isAlreadyOwned(agent.id) ? (
                      <>Deploy Skill <ChevronRight size={12} strokeWidth={3} /></>
                    ) : (
                      <>
                        {selectedMeshTier === 'skills' ? 'Learn Skill' : 
                         selectedMeshTier === 'employees' ? 'Hire Operative' : 
                         'Enlist Manager'} 
                        <ArrowRight size={12} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 border border-indigo-500/0 group-hover:border-indigo-500/10 transition-colors pointer-events-none rounded-2xl" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmingUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300">
           <Card className="w-full max-w-md bg-card border-border/40 shadow-2xl overflow-hidden rounded-3xl animate-in zoom-in-95 duration-300">
              <div className="relative p-8 space-y-6">
                 <div className="flex items-center justify-center">
                    <div className="size-16 rounded-2xl bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 shadow-inner">
                       <Zap size={32} strokeWidth={2.5} />
                    </div>
                 </div>
                 
                 <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold font-display tracking-tight text-foreground">Strategic Commitment</h2>
                    <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.15em]">Confirming Unit Acquisition</p>
                 </div>

                 <div className="bg-secondary/30 rounded-2xl p-6 border border-border/20 space-y-4">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Unit Name</span>
                       <span className="text-xs font-bold text-foreground">{confirmingUnit.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Acquisition Cost</span>
                       <span className="text-lg font-black text-indigo-600">
                          {confirmingUnit.price === 0 || confirmingUnit.price === null ? '0.00' : confirmingUnit.price} <span className="text-[10px] font-bold text-muted-foreground">Cr</span>
                       </span>
                    </div>
                    <div className="pt-4 border-t border-border/20">
                       <p className="text-[10px] text-center text-muted-foreground/60 font-medium italic">
                          This action will bind the unit logic to your repository. Credits will be finalized upon confirmation.
                       </p>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button 
                       onClick={() => handleAcquireAgent(confirmingUnit.id)}
                       className="h-11 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                    >
                       Confirm & Deploy
                    </button>
                    <button 
                       onClick={() => setConfirmingUnit(null)}
                       className="h-11 w-full bg-secondary hover:bg-muted text-foreground rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all"
                    >
                       Cancel Acquisition
                    </button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
