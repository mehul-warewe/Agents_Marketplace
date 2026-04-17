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

  const categories = useMemo(() => {
    return TOOL_CATEGORIES.filter(cat => cat !== 'Integrations' && cat !== 'Triggers');
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q) {
      const staticMatches = TOOL_REGISTRY.filter(t => 
        !t.id.startsWith('ai.') && 
        t.category !== 'AI' &&
        (t.label.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || t.name.toLowerCase().includes(q))
      );

      const subActionMatches = TOOL_REGISTRY.flatMap(t => {
        if (t.subActions) {
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

      const baseResults = [...staticMatches, ...subActionMatches, ...platformMatches]
        .filter(t => (t as any).category !== 'Triggers');
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

    let visibleRegistry = TOOL_REGISTRY;
    if (filter) {
      visibleRegistry = TOOL_REGISTRY.filter(filter);
    }

    if (activePlatform && activePlatform !== '__integrations_view__') {
       return platformTools.map(tool => ({
        name: tool.name,
        key: tool.key,
        description: tool.description,
      }));
    }

    return [];
  }, [query, activePlatform, platformTools, pipedreamApps, combinedRegistry, socketType, filter]);

  const toggle = (cat: string) =>
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <aside
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-card/95 backdrop-blur-xl border-r border-border/40 transition-all duration-500 z-40 flex flex-col shadow-2xl ${
        isOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
      }`}
    >
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="p-6 pb-4 flex flex-col gap-5 border-b border-border/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
        
        <div className="flex items-center justify-between">
           <div className="flex flex-col">
              <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Architecture</span>
              <h2 className="text-[14px] font-black text-foreground italic uppercase tracking-tighter flex items-center gap-2">
                <LayoutPanelLeft size={14} className="text-indigo-500" />
                {activePlatform && activePlatform !== '__integrations_view__' ? 'Action Protocol' : 'Unit Registry'}
              </h2>
           </div>
           <button onClick={onToggle} className="w-7 h-7 rounded-lg bg-foreground/[0.03] border border-border/10 flex items-center justify-center text-muted/40 hover:text-foreground hover:bg-foreground/[0.08] transition-all">
              <X size={12} strokeWidth={3} />
           </button>
        </div>

        <div className="relative group/search">
          <div className="absolute inset-x-0 inset-y-0 bg-indigo-500/5 rounded-2xl scale-95 group-focus-within/search:scale-100 opacity-0 group-focus-within/search:opacity-100 transition-all duration-500" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted/20 group-focus-within/search:text-indigo-500 group-focus-within/search:scale-110 transition-all z-10" size={14} strokeWidth={3} />
          <input
            type="text"
            placeholder={activePlatform ? 'Search protocol actions...' : 'Search units & platforms...'}
            className="w-full bg-foreground/[0.02] border border-border/40 rounded-2xl py-3 pl-11 pr-4 text-[11px] font-bold uppercase tracking-widest placeholder:text-muted/20 outline-none focus:border-indigo-500/40 focus:ring-4 focus:ring-indigo-500/5 transition-all relative z-0"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
        {/* UNIFIED SEARCH RESULTS VIEW */}
        {query.trim() && (
           <div className="space-y-1">
             {filtered.length === 0 && !isLoadingApps && (
               <div className="p-12 text-center">
                 <div className="w-12 h-12 bg-muted/5 rounded-2xl flex items-center justify-center text-muted/20 mx-auto mb-4 border border-dashed border-border/40">
                    <Search size={20} />
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/30 italic leading-relaxed">No matching operative <br/>found in registry</p>
               </div>
             )}
             {filtered.map((tool: any) => {
                const Icon = tool.icon as any;
                const toolLabel = tool.label || tool.name;
                const toolId = tool.id;
                const toolBg = tool.bg || 'bg-indigo-500/10';
                const toolColor = tool.color || 'text-indigo-500';

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
                    className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-foreground/[0.04] transition-all text-left group border border-transparent hover:border-border/20"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/10 shadow-sm ${toolBg} group-hover:scale-110 transition-transform`}>
                      {typeof tool.icon === 'string' ? (
                        <img src={tool.icon} alt={toolLabel} className="w-6 h-6 object-contain" />
                      ) : (
                        <Icon size={18} strokeWidth={2.5} className={toolColor} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-black text-foreground uppercase tracking-tight truncate leading-tight">{toolLabel}</p>
                      {tool.category && (
                        <p className="text-[8px] uppercase font-black tracking-widest text-muted/30 mt-1">{tool.category}</p>
                      )}
                    </div>
                    {tool.isGroup ? (
                      <ChevronRight size={14} className="text-muted/20 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                    ) : (
                      <div className="opacity-0 group-hover:opacity-100 transition-all">
                         <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Plus size={12} strokeWidth={3} />
                         </div>
                      </div>
                    )}
                  </button>
                );
             })}
             {isLoadingApps && (
               <div className="p-6 flex items-center justify-center gap-3 text-muted/30">
                 <Loader2 size={12} className="animate-spin text-indigo-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest italic">Syncing global registry...</span>
               </div>
             )}
           </div>
        )}

        {/* STANDARD CATEGORY / PLATFORM NAVIGATION */}
        {!query.trim() && (
          <>
            {activePlatform === '__integrations_view__' ? (
              <div>
                <button
                  onClick={() => {
                    setActivePlatform(null);
                    setSelectedPlatformName('');
                  }}
                  className="w-full flex items-center gap-2 mb-4 p-3 py-2 bg-foreground/[0.03] border border-border/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted/60 hover:text-foreground hover:bg-foreground/[0.06] transition-all group"
                >
                  <ChevronLeft size={12} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
                  Return to Core Units
                </button>

                {isLoadingApps && pipedreamApps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <div className="w-12 h-12 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20 relative">
                       <Loader2 size={24} className="animate-spin" />
                       <div className="absolute inset-0 rounded-3xl border border-indigo-500 animate-ping opacity-20" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted/40 italic">Decrypting Index...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="px-1 mb-4 flex flex-col gap-1">
                       <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">Global Matrix</h3>
                       <p className="text-[9px] text-muted/40 font-medium italic">3,100+ native logic platforms available</p>
                    </div>
                    {pipedreamApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setActivePlatform(app.id);
                          setSelectedPlatformName(app.name);
                          setSelectedPlatformIcon(app.icon);
                        }}
                        className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-foreground/[0.04] transition-all text-left group border border-transparent hover:border-border/10"
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border/10 bg-indigo-500/5 group-hover:bg-indigo-500/10 group-hover:scale-105 transition-all shadow-sm">
                          <img src={app.icon} alt={app.name} className="w-5 h-5 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-foreground truncate uppercase tracking-tight">{app.name}</p>
                        </div>
                        <ChevronRight size={14} strokeWidth={2.5} className="text-muted/20 transition-transform group-hover:translate-x-1 group-hover:text-indigo-500" />
                      </button>
                    ))}

                    {hasMore && (
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="w-full py-5 mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500/60 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all text-center rounded-2xl border border-dashed border-indigo-500/20"
                      >
                        {isLoadingApps ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Fetch Remaining'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : activePlatform ? (
              <div>
                <button
                  onClick={() => setActivePlatform('__integrations_view__')}
                  className="w-full flex items-center gap-2 mb-4 p-3 py-2 bg-foreground/[0.03] border border-border/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted/60 hover:text-foreground hover:bg-foreground/[0.06] transition-all group"
                >
                  <ChevronLeft size={12} strokeWidth={3} className="group-hover:-translate-x-0.5 transition-transform" />
                  Registry Index
                </button>

                <div className="flex items-center gap-4 p-4 mb-6 bg-indigo-500/5 rounded-[2rem] border border-indigo-500/20">
                   <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center p-2.5 shadow-xl shadow-indigo-500/5 border border-indigo-500/10">
                      <img src={selectedPlatformIcon} className="w-full h-full object-contain" />
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Platform Matrix</span>
                      <h4 className="text-[13px] font-black text-foreground uppercase tracking-tight italic">{selectedPlatformName}</h4>
                   </div>
                </div>

                {isLoadingTools ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <Loader2 size={24} className="animate-spin text-indigo-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted/30 italic">Decrypting protocols...</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
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
                          className="w-full flex items-start gap-4 p-4 rounded-2xl hover:bg-foreground/[0.05] transition-all text-left group border border-transparent hover:border-indigo-500/20"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-foreground uppercase tracking-tight leading-tight group-hover:text-indigo-500 transition-colors">{tool.name}</p>
                            {tool.description && (
                              <p className="text-[9px] text-muted/40 font-medium leading-relaxed italic mt-1 line-clamp-2">{tool.description}</p>
                            )}
                          </div>
                          <div className="w-6 h-6 rounded-lg bg-foreground/[0.05] flex items-center justify-center text-muted/20 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm">
                             <Plus size={12} strokeWidth={3} />
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
                <button
                  onClick={() => setActivePlatform('__integrations_view__')}
                  className="w-full flex items-center justify-between p-4 mb-8 rounded-[2rem] bg-indigo-500/5 border border-indigo-500/20 hover:bg-indigo-500/10 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full -mr-10 -mt-10 blur-xl group-hover:scale-150 transition-transform duration-700" />
                  <span className="flex items-center gap-4 flex-1 relative z-10">
                     <div className="w-10 h-10 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                        <Zap size={18} fill="white" className="text-white" />
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Connect Matrix</span>
                        <span className="text-[13px] font-black text-indigo-600 uppercase italic italic tracking-tight">Integrations</span>
                     </div>
                  </span>
                  <div className="w-8 h-8 rounded-full border border-indigo-500/10 flex items-center justify-center transition-all group-hover:translate-x-1 relative z-10">
                     <ChevronRight size={14} strokeWidth={3} className="text-indigo-500/40" />
                  </div>
                </button>

                {categories.map(cat => {
                  const items = (query.trim() ? filtered : (filter ? TOOL_REGISTRY.filter(filter) : TOOL_REGISTRY))
                    .filter(t => (t as any).category === cat);
                  if (items.length === 0) return null;
                  const isCollapsed = collapsed[cat];

                  return (
                    <div key={cat} className="mb-6">
                      <button
                        onClick={() => toggle(cat)}
                        className="w-full flex items-center justify-between px-2 mb-3 text-muted/40 font-black uppercase tracking-[0.2em] group"
                      >
                        <span className="text-[9px] flex items-center gap-2 group-hover:text-foreground transition-colors">
                           <div className="w-1 h-3 rounded-full bg-indigo-500/20 group-hover:bg-indigo-500 transition-all" />
                           {cat}
                        </span>
                        <ChevronDown size={12} strokeWidth={3} className={`transition-transform duration-500 ${isCollapsed ? '-rotate-90 text-muted/20' : 'text-indigo-500/20'}`} />
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-1 mt-1">
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
                                className="w-full flex items-center gap-4 p-3.5 rounded-2xl hover:bg-foreground/[0.04] transition-all text-left group border border-transparent hover:border-border/10"
                              >
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border/10 shadow-sm ${tool.bg || 'bg-indigo-500/10'} group-hover:scale-105 transition-all`}>
                                  {typeof tool.icon === 'string' ? (
                                    <img src={tool.icon} alt={toolLabel} className="w-5 h-5 object-contain" />
                                  ) : (
                                    <Icon size={18} strokeWidth={2.5} className={tool.color || 'text-indigo-500'} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold text-foreground uppercase tracking-tight truncate leading-tight">{toolLabel}</p>
                                </div>
                                {tool.isGroup ? (
                                  <ChevronRight size={14} className="text-muted/20 transition-transform group-hover:translate-x-1 hover:text-indigo-500" />
                                ) : (
                                  <div className="opacity-0 group-hover:opacity-100 transition-all">
                                     <Plus size={14} strokeWidth={3} className="text-indigo-500/40" />
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
            )}
          </>
        )}
      </div>
    </aside>
  );
}
