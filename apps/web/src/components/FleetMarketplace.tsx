'use client';

import React, { useState, useRef } from 'react';
import { Search, Star, Filter, Bot, ChevronRight, Zap, Target, ArrowRight, Shield, Lock, Plus, Layers, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMarketplaceSkills, useAcquireSkill, useSkills } from '@/hooks/useSkills';
import { useEmployeeDirectory } from '@/hooks/useEmployees';
import { useManagerDirectory } from '@/hooks/useManager';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatLabel, cn } from '@/components/ui/utils';
import { useDebounce } from '@/hooks/useDebounce';

export default function FleetMarketplace() {
  const { data: agents = [], isLoading: isLoadingAgents } = useMarketplaceSkills();
  const { data: employeeDirectory = [], isLoading: isLoadingEmployees } = useEmployeeDirectory();
  const { data: managerDirectory = [], isLoading: isLoadingManagers } = useManagerDirectory();
  const { data: mySkills } = useSkills();
  const { mutate: acquireSkill } = useAcquireSkill();
  const { user } = useAuthStore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [activeCategory, setActiveCategory] = useState('All Categories');
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
    acquireSkill(agentId, {
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
      const matchesCategory = activeCategory === 'All Categories' || agent.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  };

  const getActiveAssets = () => {
    const rawSearch = debouncedSearch.toLowerCase();
    if (selectedMeshTier === 'skills') return getFilteredSkills();
    if (selectedMeshTier === 'employees') return (employeeDirectory as any[]).filter(e => e.name.toLowerCase().includes(rawSearch) || e.description?.toLowerCase().includes(rawSearch));
    return (managerDirectory as any[]).filter(m => m.name.toLowerCase().includes(rawSearch) || m.description?.toLowerCase().includes(rawSearch));
  };

  const activeAssets = getActiveAssets();
  const isLoading = selectedMeshTier === 'skills' ? isLoadingAgents : 
                    selectedMeshTier === 'employees' ? isLoadingEmployees : 
                    isLoadingManagers;

  return (
    <div className="flex-1 h-full text-foreground bg-background flex flex-col overflow-hidden">
      {/* Platform Header */}
      <header className="bg-card border-b border-border px-6 pt-8 pb-0 space-y-8 shrink-0 z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5">
             <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
               <Layers size={16} strokeWidth={3} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Global Asset Network</span>
             </div>
             <h1 className="text-3xl font-black tracking-tighter text-foreground">
               Marketplace Registry
             </h1>
             <p className="text-muted-foreground font-medium text-[11px] max-w-2xl leading-relaxed italic">
                Acquire high-performance professional assets. Each unit is pre-configured for seamless integration into your workforce repository.
             </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-10">
          {[
            { id: 'skills', label: 'Functional Skills', icon: Zap, color: 'text-indigo-600' },
            { id: 'employees', label: 'Employee Profiles', icon: Bot, color: 'text-emerald-600' },
            { id: 'managers', label: 'Manager Hubs', icon: Shield, color: 'text-amber-600' }
          ].map(tier => (
            <button
              key={tier.id}
              onClick={() => setSelectedMeshTier(tier.id as any)}
              className={cn(
                "pb-5 px-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 relative group",
                selectedMeshTier === tier.id ? tier.color : 'text-muted-foreground/40 hover:text-foreground'
              )}
            >
              <tier.icon size={15} strokeWidth={selectedMeshTier === tier.id ? 3 : 2} />
              {tier.label}
              
              {selectedMeshTier === tier.id && (
                <div className={cn(
                  "absolute bottom-0 left-0 right-0 h-0.5 rounded-full",
                  tier.id === 'skills' ? 'bg-indigo-600' : tier.id === 'employees' ? 'bg-emerald-600' : 'bg-amber-600'
                )} />
              )}
            </button>
          ))}
        </div>

        <div className="pb-8 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3 relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-indigo-600 transition-colors" />
                <Input 
                  type="text" 
                  placeholder={`Search registry for ${selectedMeshTier}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-11 rounded-xl bg-muted border-border focus:border-indigo-600 focus:ring-0 text-[12px] font-medium transition-all"
                />
            </div>
            <Button variant="outline" className="h-11 w-full gap-2 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-muted border-border transition-all">
                <Filter size={15} strokeWidth={3} /> Refine Results
            </Button>
          </div>

          {selectedMeshTier === 'skills' && (
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar pt-1">
              {['All Categories', 'Automation', 'Intelligence', 'Analysis', 'Enterprise', 'Social'].map((cat) => (
                <button 
                  key={cat} 
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "rounded-xl px-6 whitespace-nowrap font-black text-[9px] uppercase tracking-[0.15em] h-8 transition-all border",
                    activeCategory === cat 
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-500/20' 
                      : 'bg-muted text-muted-foreground/60 border-border hover:border-indigo-600/30 hover:text-foreground'
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Explorer Content */}
      <div className="flex-1 overflow-hidden p-6 bg-muted/30 pt-10 flex flex-col">
        {isLoading ? (
           <div className="flex-1 overflow-x-auto pb-10 flex flex-row gap-6 items-start no-scrollbar">
              {[1, 2, 3, 4, 5].map(i => (
                 <div key={i} className="w-80 flex-shrink-0 h-[360px] bg-card border border-border rounded-2xl animate-pulse" />
              ))}
           </div>
        ) : activeAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 border border-border border-dashed rounded-3xl text-center px-8 bg-card">
             <div className="w-16 h-16 bg-muted border border-border rounded-2xl flex items-center justify-center text-muted-foreground/30 mb-6">
                <Target size={32} />
             </div>
             <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-2 text-foreground">Registry Unavailable</h3>
             <p className="text-muted-foreground/40 text-[11px] font-medium italic max-w-sm mx-auto leading-relaxed">No professional assets identified matching your current parameters. Please refine your search criteria.</p>
             <button 
               onClick={() => setSearchTerm('')}
               className="mt-8 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:underline"
             >
                Clear All Parameters
             </button>
          </div>
        ) : (
          <div 
            ref={scrollRef}
            onWheel={handleWheel}
            className="flex-1 overflow-x-auto pb-12 flex flex-row gap-6 items-start no-scrollbar px-1"
          >
            {activeAssets.map((asset: any) => (
              <Card 
                key={asset.id} 
                className="group relative bg-card border border-border hover:border-indigo-600/40 rounded-2xl p-6 flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex-shrink-0 w-80 h-[380px]"
              >
                <div className="mb-4 flex justify-between items-start relative z-10">
                   <div className={cn(
                     "size-12 rounded-xl flex items-center justify-center transition-all duration-500 border",
                     selectedMeshTier === 'skills' ? 'text-indigo-600 bg-indigo-500/5 border-indigo-500/10' : 
                     selectedMeshTier === 'employees' ? 'text-emerald-600 bg-emerald-500/5 border-emerald-500/10' : 
                     'text-amber-600 bg-amber-500/5 border-amber-500/10'
                   )}>
                      {selectedMeshTier === 'skills' ? <Zap size={22} strokeWidth={3} /> : 
                       selectedMeshTier === 'employees' ? <Bot size={22} strokeWidth={3} /> : 
                       <Shield size={22} strokeWidth={3} />}
                   </div>
                   <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-muted border border-border text-[9px] font-black text-foreground uppercase tracking-widest">
                        <Star size={10} fill="currentColor" className="text-amber-500" /> {asset.rating || '5.0'}
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-black text-emerald-600/60 uppercase tracking-[0.2em]">
                         <Shield size={10} strokeWidth={3} /> Authenticated
                      </div>
                   </div>
                </div>
                
                <div className="mb-3 relative z-10">
                   <span className={cn(
                     "text-[9px] font-black uppercase tracking-[0.2em]",
                     selectedMeshTier === 'skills' ? 'text-indigo-600' : 
                     selectedMeshTier === 'employees' ? 'text-emerald-600' : 
                     'text-amber-600'
                   )}>
                      {formatLabel(asset.category || 'Core Operation')}
                   </span>
                   <h3 className="text-[14px] font-bold tracking-tight text-foreground line-clamp-1 mt-1 group-hover:text-indigo-600 transition-colors">
                      {asset.name}
                   </h3>
                </div>

                <p className="text-[11px] text-muted-foreground/70 line-clamp-3 mb-6 leading-relaxed font-medium italic">
                  {asset.description || "Synthetically engineered logic unit optimized for complex workforce orchestration and process automation."}
                </p>
                
                <div className="flex flex-wrap gap-1.5 mb-6">
                  {selectedMeshTier === 'skills' ? (
                    <>
                      {(asset.requiredCredentials as any[] || []).slice(0, 2).map((cred, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-[8px] font-bold text-indigo-600 uppercase tracking-tight">
                          <Lock size={9} strokeWidth={3} /> {formatLabel(cred.provider)}
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted border border-border text-[8px] font-bold text-muted-foreground uppercase tracking-tight font-black">
                       <Layers size={9} strokeWidth={3} /> Professional Index
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-5 border-t border-border flex flex-col gap-4">
                   <div className="flex flex-col">
                      <span className="text-[14px] font-black text-foreground tabular-nums">
                         {asset.price === 0 || asset.price === null ? 'Open Protocol' : `${asset.price}.00 Cr`}
                      </span>
                      <span className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-[0.15em] mt-1">
                         {asset.price === 0 || asset.price === null ? 'System Default' : 'Corporate Asset'}
                      </span>
                   </div>

                   <button 
                    onClick={() => {
                      if (selectedMeshTier === 'skills') {
                        if (isAlreadyOwned(asset.id)) {
                          router.push('/skills');
                        } else {
                          setConfirmingUnit(asset);
                        }
                      } else if (selectedMeshTier === 'employees') {
                        router.push('/employees');
                      } else {
                        router.push('/manager');
                      }
                    }}
                    className={cn(
                      "h-10 w-full rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-2 shadow-sm",
                      selectedMeshTier === 'skills' && isAlreadyOwned(asset.id)
                        ? 'bg-muted text-muted-foreground/60 border border-border hover:bg-muted/80' 
                        : (selectedMeshTier === 'skills' ? 'bg-indigo-600 hover:bg-indigo-700' : 
                           selectedMeshTier === 'employees' ? 'bg-emerald-600 hover:bg-emerald-700' : 
                           'bg-amber-600 hover:bg-amber-700') + ' text-white shadow-lg active:scale-95'
                    )}
                  >
                    {selectedMeshTier === 'skills' && isAlreadyOwned(asset.id) ? (
                      <>Initialize Logic <ChevronRight size={14} strokeWidth={3} /></>
                    ) : (
                      <>
                        {selectedMeshTier === 'skills' ? 'Acquire Skill' : 
                         selectedMeshTier === 'employees' ? 'Initialize Unit' : 
                         'Select Schema'} 
                        <ArrowRight size={14} strokeWidth={3} />
                      </>
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmingUnit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/90 animate-in fade-in duration-300">
           <Card className="w-full max-w-md bg-card border border-border shadow-2xl overflow-hidden rounded-3xl animate-in zoom-in-95 duration-300">
              <div className="relative p-10 space-y-8">
                 <div className="flex items-center justify-center">
                    <div className="size-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                       <Zap size={40} strokeWidth={3} />
                    </div>
                 </div>
                 
                 <div className="text-center space-y-1.5">
                    <h2 className="text-2xl font-black tracking-tighter text-foreground">Asset Acquisition</h2>
                    <p className="text-muted-foreground/40 text-[10px] font-black uppercase tracking-[0.2em]">Authentication Required</p>
                 </div>

                 <div className="bg-muted p-8 rounded-2xl border border-border space-y-6">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Protocol Name</span>
                       <span className="text-[13px] font-bold text-foreground">{confirmingUnit.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-widest">Volume Cost</span>
                       <span className="text-[18px] font-black text-indigo-600">
                          {confirmingUnit.price === 0 || confirmingUnit.price === null ? '0.00' : confirmingUnit.price} <span className="text-[10px] font-bold text-muted-foreground">Cr</span>
                       </span>
                    </div>
                    <div className="pt-6 border-t border-border">
                       <p className="text-[10px] text-center text-muted-foreground/60 font-medium italic leading-relaxed">
                          By confirming, you authorize the permanent integration of this functional logic into your workforce repository.
                       </p>
                    </div>
                 </div>

                 <div className="flex flex-col gap-3">
                    <button 
                       onClick={() => handleAcquireAgent(confirmingUnit.id)}
                       className="h-12 w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
                    >
                       Confirm Acquisition
                    </button>
                    <button 
                       onClick={() => setConfirmingUnit(null)}
                       className="h-12 w-full bg-muted hover:bg-muted/80 text-muted-foreground font-black text-[11px] uppercase tracking-[0.2em] rounded-xl transition-all"
                    >
                       Abort Sequence
                    </button>
                 </div>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
