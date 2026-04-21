'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Plus, LayoutPanelLeft, ChevronLeft, ChevronRight, X, Loader2, Zap } from 'lucide-react';
import { TOOL_REGISTRY, TOOL_CATEGORIES } from './toolRegistry';
import api from '@/lib/api';
import { usePipedreamTools } from '@/hooks/usePipedreamApps';

interface ToolSidebarProps {
  onAddTool: (toolId: string, override?: { label?: string, icon?: string, appSlug?: string, actionName?: string, platformName?: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
  socketType?: string | null;
  filter?: (tool: any) => boolean;
  isSkillMode?: boolean;
}

interface PipedreamApp {
  id: string;
  name: string;
  icon: string;
  isGroup: boolean;
}

interface PipedreamTool {
  name: string;
  description: string;
}

// Tool Registry Navigation State
export default function ToolSidebar({ onAddTool, isOpen, onToggle, socketType, filter, isSkillMode }: ToolSidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [pipedreamApps, setPipedreamApps] = useState<PipedreamApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // State for drill-down into Pipedream platform actions
  const [selectedPlatformName, setSelectedPlatformName] = useState<string>('');
  const [selectedPlatformIcon, setSelectedPlatformIcon] = useState<string>('');
  
  const { data: platformToolsData, isLoading: isLoadingTools } = usePipedreamTools(activePlatform, !!activePlatform);
  const platformTools = platformToolsData || [];

  // Fetch Pipedream Apps with Search & Pagination support
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoadingApps(true);
      try {
        const offset = page * 100;
        const { data } = await api.get(`/credentials/pipedream/apps?limit=100&search=${encodeURIComponent(query)}&offset=${offset}`);

        const items = data.results ?? data; 
        const total: number = data.total ?? items.length;

        const mapped = items.map((app: any) => ({
          id: app.id,
          name: app.name,
          icon: app.icon,       
          isGroup: true,
        }));

        if (page === 0) {
          setPipedreamApps(mapped);
        } else {
          setPipedreamApps(prev => [...prev, ...mapped]);
        }

        setHasMore(offset + mapped.length < total);
      } catch (err) {
        console.error('Failed to fetch Pipedream apps:', err);
      } finally {
        setIsLoadingApps(false);
      }
    }, query ? 500 : 0);

    return () => clearTimeout(timer);
  }, [query, page]);

  // Reset page on search
  useEffect(() => {
    setPage(0);
    setHasMore(true);
  }, [query]);

  const combinedRegistry = useMemo(() => {
    return [...TOOL_REGISTRY, ...pipedreamApps];
  }, [pipedreamApps]);

  // virtual categories: Consolidate Logic, Core, Data into "Built-in Tools"
  const virtualCategories = useMemo(() => {
    const cats = TOOL_CATEGORIES.filter(cat => !['Integrations', 'Triggers', 'Output'].includes(cat));
    const merged = new Set<string>();
    cats.forEach(c => {
      if (['Logic', 'Core', 'Data'].includes(c)) {
        merged.add('Built-in Tools');
      } else {
        merged.add(c);
      }
    });
    return Array.from(merged);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q) {
      const staticMatches = TOOL_REGISTRY.filter(t => 
        !t.id.startsWith('ai.') && 
        t.category !== 'AI' &&
        t.category !== 'Triggers' &&
        (t.label.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
      );

      const subActionMatches = TOOL_REGISTRY.flatMap(t => {
        if (t.subActions && t.category !== 'Triggers') {
           return t.subActions
            .filter(sub => sub.label.toLowerCase().includes(q))
            .map(sub => ({ ...t, id: sub.id, label: `${t.label}: ${sub.label}`, isGroup: false, icon: t.icon, subAction: true }));
        }
        return [];
      });

      const platformMatches = pipedreamApps
        .filter(app => app.name.toLowerCase().includes(q))
        .map(app => ({
          ...app,
          label: app.name,
          isGroup: true,
          category: 'Integrations'
        }));

      const baseResults = [...staticMatches, ...subActionMatches, ...platformMatches];
      const filteredResults = filter ? baseResults.filter(filter) : baseResults;

      return filteredResults.sort((a, b) => {
        const aLabel = (a as any).label || (a as any).name || '';
        const bLabel = (b as any).label || (b as any).name || '';
        const aExact = aLabel.toLowerCase() === q;
        const bExact = bLabel.toLowerCase() === q;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        return aLabel.toLowerCase().startsWith(q) ? -1 : 1;
      });
    }

    if (activePlatform && activePlatform !== '__integrations_view__') {
       return platformTools.map(tool => ({
        name: tool.name,
        key: tool.key,
        description: tool.description,
      }));
    }

    return [];
  }, [query, activePlatform, platformTools, pipedreamApps, filter]);

  const toggle = (cat: string) =>
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <aside
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-card border-r border-border/40 transition-all duration-500 z-40 flex flex-col shadow-xl ${
        isOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
      }`}
    >
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="p-6 pb-4 flex flex-col gap-5 relative overflow-hidden">
        <div className="flex items-center justify-between relative z-10">
               <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none">Intelligence Hub</span>
                  </div>
                  <h2 className="text-base font-bold font-display tracking-tight text-foreground leading-none uppercase">
                    {activePlatform && activePlatform !== '__integrations_view__' ? 'Action Index' : 'Tool Registry'}
                  </h2>
               </div>
           <button onClick={onToggle} className="w-8 h-8 rounded-lg bg-secondary border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all group">
              <X size={14} strokeWidth={2.5} />
           </button>
        </div>

        <div className="relative group/search">
          <div className="relative flex items-center bg-secondary border border-border/60 rounded-xl p-1 group-focus-within/search:border-indigo-500/40 transition-all shadow-inner">
            <Search className="absolute left-3.5 text-muted-foreground/30 group-focus-within/search:text-indigo-500 transition-all z-10" size={13} strokeWidth={2.5} />
            <input
              type="text"
              placeholder={activePlatform ? 'Search actions...' : 'Find tools & nodes...'}
              className="w-full bg-transparent py-2.5 pl-10 pr-3 text-[10px] font-bold uppercase tracking-widest text-foreground placeholder:text-muted-foreground/20 outline-none transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 no-scrollbar">
        {/* UNIFIED SEARCH RESULTS VIEW */}
        {query.trim() && (
           <div className="space-y-1">
             {filtered.length === 0 && !isLoadingApps && (
               <div className="p-16 text-center">
                 <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground mx-auto mb-4 border border-border/40 border-dashed">
                    <Search size={20} strokeWidth={2.5} />
                 </div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 leading-relaxed italic">No matching tools <br/>mapped in registry</p>
               </div>
             )}
             <div className="space-y-2 p-3 bg-secondary border border-border/60 rounded-3xl shadow-inner mt-2">
               {filtered.map((tool: any) => {
                  const Icon = tool.icon as any;
                  const toolLabel = tool.label || tool.name;
                  const toolId = tool.id;

                  return (
                    <button
                      key={toolId || toolLabel}
                      onClick={() => {
                        if (tool.isGroup) {
                          setActivePlatform(tool.id);
                          setSelectedPlatformName(tool.label || tool.name);
                          setSelectedPlatformIcon((tool as any).icon || '');
                          setQuery(''); 
                        } else {
                          onAddTool(toolId, { label: toolLabel, icon: tool.icon });
                        }
                      }}
                      className="w-full flex items-center gap-3 p-4 bg-card border border-border shadow-md rounded-2xl hover:bg-muted/50 transition-all text-left group hover:border-indigo-500/20"
                    >
                      <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 border border-border/40 bg-secondary group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all shadow-sm overflow-hidden">
                        {typeof tool.icon === 'string' ? (
                          <img src={tool.icon} alt={toolLabel} className="w-4.5 h-4.5 object-contain" />
                        ) : (
                          <Icon size={14} strokeWidth={2.5} className="text-indigo-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-foreground uppercase tracking-tight truncate leading-tight group-hover:text-indigo-500 transition-colors leading-none">{toolLabel}</p>
                        {tool.category && (
                          <p className="text-[8px] uppercase font-bold tracking-widest text-muted-foreground/40 mt-1 leading-none">{tool.category === 'Logic' ? 'Protocol' : tool.category}</p>
                        )}
                      </div>
                      {tool.isGroup ? (
                        <ChevronRight size={12} className="text-muted-foreground opacity-30 transition-transform group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-indigo-500" />
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 transition-all">
                           <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                              <Plus size={12} strokeWidth={2.5} />
                           </div>
                        </div>
                      )}
                    </button>
                  );
               })}
             </div>
             {isLoadingApps && (
               <div className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
                 <Loader2 size={14} className="animate-spin text-indigo-500" />
                 <span className="text-[10px] font-bold uppercase tracking-widest italic">Syncing Index...</span>
               </div>
             )}
           </div>
        )}

        {/* STANDARD CATEGORY / PLATFORM NAVIGATION */}
        {!query.trim() && (
            activePlatform === '__integrations_view__' ? (
              <div>
                <button
                  onClick={() => {
                    setActivePlatform(null);
                    setSelectedPlatformName('');
                  }}
                  className="w-full flex items-center gap-2 mb-4 p-2.5 bg-secondary border border-border/40 rounded-lg text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all group"
                >
                  <ChevronLeft size={12} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
                  Return to Core
                </button>

                {isLoadingApps && pipedreamApps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24">
                     <Loader2 size={24} className="animate-spin text-indigo-500 opacity-50" />
                     <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">Syncing Index...</span>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-secondary border border-border/60 rounded-3xl shadow-inner">
                    <div className="px-1 mb-4 flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <h3 className="text-[11px] font-bold text-foreground uppercase tracking-widest">Global Ecosystem</h3>
                       </div>
                       <p className="text-[10px] text-muted-foreground font-medium italic">3,100+ native logic platforms indexed</p>
                    </div>
                    {pipedreamApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setActivePlatform(app.id);
                          setSelectedPlatformName(app.name);
                          setSelectedPlatformIcon(app.icon);
                        }}
                        className="w-full flex items-center gap-3 p-4 bg-card border border-border shadow-md rounded-2xl hover:bg-muted/50 transition-all text-left group hover:border-indigo-500/20"
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/40 bg-secondary group-hover:bg-muted transition-all shadow-sm overflow-hidden p-1.5">
                          <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-foreground truncate uppercase tracking-tight group-hover:text-indigo-500 transition-colors leading-none">{app.name}</p>
                        </div>
                        <ChevronRight size={14} strokeWidth={2.5} className="text-muted-foreground opacity-30 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                      </button>
                    ))}

                    {hasMore && (
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="w-full py-6 mt-4 text-[10px] font-black uppercase tracking-[0.35em] text-indigo-400 border border-dashed border-indigo-400/20 bg-card rounded-2xl shadow-sm hover:bg-indigo-400/5 transition-all text-center"
                      >
                        {isLoadingApps ? <Loader2 size={14} className="animate-spin mx-auto" /> : 'Fetch Remaining Units'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : activePlatform ? (
              <div>
                <button
                  onClick={() => setActivePlatform('__integrations_view__')}
                  className="w-full flex items-center gap-2 mb-4 p-3 bg-secondary border border-border/40 rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all group"
                >
                  <ChevronLeft size={14} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" />
                  Ecosystem Index
                </button>

                <div className="flex items-center gap-4 p-4 mb-6 bg-indigo-500/5 rounded-xl border border-indigo-500/10 shadow-sm relative overflow-hidden">
                   <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center p-2 shadow-sm border border-border">
                      <img src={selectedPlatformIcon} className="w-full h-full object-contain" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest mb-0.5">Active Extension</span>
                      <h4 className="text-base font-bold text-foreground uppercase tracking-tight leading-none">{selectedPlatformName}</h4>
                   </div>
                </div>

                {isLoadingTools ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-24">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">Syncing Protocols...</span>
                  </div>
                ) : (
                  <div className="space-y-2 p-3 bg-secondary border border-border/60 rounded-3xl shadow-inner">
                    {platformTools.map((tool) => {
                      return (
                        <button
                          key={tool.name}
                          onClick={() => {
                            const toolId = `pd:${activePlatform}:${tool.key}`;
                            onAddTool(toolId, {
                              label: `${selectedPlatformName}: ${tool.name}`,
                              icon: selectedPlatformIcon,
                              appSlug: activePlatform as string,
                              actionName: tool.key,
                              platformName: selectedPlatformName
                            });
                          }}
                          className="w-full flex items-start gap-4 p-4 bg-card border border-border shadow-md rounded-2xl hover:bg-muted/50 transition-all text-left group hover:border-indigo-500/20"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-foreground uppercase tracking-tight leading-tight group-hover:text-indigo-500 transition-colors uppercase">{tool.name}</p>
                            {tool.description && (
                              <p className="text-[10px] text-muted-foreground font-medium leading-relaxed italic mt-1.5 line-clamp-2">{tool.description}</p>
                            )}
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-secondary border border-border/40 flex items-center justify-center text-muted-foreground group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm group-hover:scale-110 shrink-0">
                             <Plus size={14} strokeWidth={2.5} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* MAIN REGISTRY VIEW */
              <>
                <div className="p-3 bg-secondary border border-border/60 rounded-3xl shadow-inner mb-10">
                  <button
                    onClick={() => setActivePlatform('__integrations_view__')}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all group relative overflow-hidden shadow-lg shadow-indigo-500/20 border border-indigo-500/30"
                  >
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-4 relative z-10">
                       <div className="w-10 h-10 rounded-lg bg-secondary border border-border/40 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Zap size={18} fill="white" className="text-white" />
                       </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[9px] font-bold text-indigo-100/60 uppercase tracking-widest mb-0.5">External Extensions</span>
                          <span className="text-lg font-bold uppercase tracking-tight leading-tight">Integrations</span>
                       </div>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center transition-all group-hover:translate-x-1 relative z-10">
                       <ChevronRight size={16} strokeWidth={2.5} className="text-white" />
                    </div>
                  </button>
                </div>

                {virtualCategories.map(vCat => {
                  const baseCats = vCat === 'Built-in Tools' ? ['Logic', 'Core', 'Data'] : [vCat];
                  const items = TOOL_REGISTRY.filter(t => baseCats.includes(t.category));
                  if (items.length === 0) return null;
                  const isCollapsed = collapsed[vCat];

                  return (
                    <div key={vCat} className="mb-8">
                      <button
                        onClick={() => toggle(vCat)}
                        className="w-full flex items-center justify-between px-2 mb-3 text-muted-foreground font-bold uppercase tracking-widest group"
                      >
                        <span className="text-[10px] flex items-center gap-2 group-hover:text-foreground transition-colors">
                           <div className={`w-1 h-3 rounded-full transition-all ${isCollapsed ? 'bg-secondary' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]'}`} />
                           {vCat}
                        </span>
                        <ChevronDown size={12} strokeWidth={2.5} className={`transition-transform duration-500 ${isCollapsed ? '-rotate-90 text-muted-foreground/20' : 'text-indigo-500'}`} />
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-2 p-3 bg-secondary border border-border/60 rounded-3xl shadow-inner mt-2">
                          {items.map((tool: any) => {
                            const Icon = tool.icon as any;
                            const toolLabel = tool.label || tool.name;
                            return (
                              <button
                                key={tool.id}
                                  onClick={() => {
                                    if (tool.isGroup) {
                                      setActivePlatform(tool.id);
                                      setSelectedPlatformName(toolLabel);
                                      setSelectedPlatformIcon((tool as any).icon || '');
                                    } else {
                                    onAddTool(tool.id, { label: toolLabel, icon: tool.icon });
                                  }
                                }}
                                className="w-full flex items-center gap-3 p-4 bg-card border border-border shadow-md rounded-2xl hover:bg-muted/50 transition-all text-left group hover:border-indigo-500/20"
                              >
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/40 bg-secondary group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all shadow-sm">
                                  {typeof tool.icon === 'string' ? (
                                    <img src={tool.icon} alt={toolLabel} className="w-5 h-5 object-contain" />
                                  ) : (
                                    <Icon size={16} strokeWidth={2.5} className="text-muted-foreground group-hover:text-indigo-500 transition-colors" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold text-foreground uppercase tracking-tight truncate leading-tight group-hover:text-indigo-500 transition-colors leading-none">{toolLabel}</p>
                                </div>
                                {tool.isGroup ? (
                                  <ChevronRight size={14} className="text-muted-foreground/20 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                                ) : (
                                  <div className="opacity-0 group-hover:opacity-100 transition-all">
                                     <div className="w-7 h-7 rounded-lg bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shadow-sm group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-110 transition-all">
                                        <Plus size={14} strokeWidth={2.5} />
                                     </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )
        )}
      </div>

      <div className="p-4 border-t border-border/40 bg-secondary/20 block">
        <div className="flex items-center justify-between">
           <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Registry v4.1.0</span>
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest leading-none">Sync Active</span>
           </div>
        </div>
      </div>
    </aside>
  );
}
