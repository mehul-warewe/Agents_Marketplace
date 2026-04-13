'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronDown, Plus, LayoutPanelLeft, ChevronLeft, ChevronRight, X, Loader2 } from 'lucide-react';
import { TOOL_REGISTRY, TOOL_CATEGORIES } from './toolRegistry';
import api from '@/lib/api';
import { usePipedreamTools } from '@/hooks/usePipedreamApps';

interface ToolSidebarProps {
  onAddTool: (toolId: string, override?: { label?: string, icon?: string, appSlug?: string, actionName?: string, platformName?: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
  socketType?: string | null;
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
export default function ToolSidebar({ onAddTool, isOpen, onToggle, socketType }: ToolSidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activePlatform, setActivePlatform] = useState<string | null>(null);
  const [pipedreamApps, setPipedreamApps] = useState<PipedreamApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);


  // State for drill-down into Pipedream platform actions
  const [selectedPlatformName, setSelectedPlatformName] = useState<string>('');
  
  const { data: platformToolsData, isLoading: isLoadingTools } = usePipedreamTools(activePlatform, !!activePlatform);
  const platformTools = platformToolsData || [];

  // Fetch Pipedream Apps with Search & Pagination support
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoadingApps(true);
      try {
        const offset = page * 100;
        const { data } = await api.get(`/credentials/pipedream/apps?limit=100&search=${encodeURIComponent(query)}&offset=${offset}`);

        // API now returns { results: [...], total: number }
        const items = data.results ?? data; // fallback for safety
        const total: number = data.total ?? items.length;

        const mapped = items.map((app: any) => ({
          id: app.id,
          name: app.name,
          icon: app.icon,        // already mapped from icon_url on the backend
          isGroup: true,
        }));

        if (page === 0) {
          setPipedreamApps(mapped);
        } else {
          setPipedreamApps(prev => [...prev, ...mapped]);
        }

        // hasMore is true when there are more items beyond the current page
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
    // Don't include Integrations in the main categories list anymore
    // We'll show it as a separate button
    return TOOL_CATEGORIES.filter(cat => cat !== 'Integrations');
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    
    // 1. If searching, show a flat list of matching tools and apps
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

      // Platform matches with STRICT NAME FILTERING
      // Even if backend returns it, we only show it if name contains query
      const platformMatches = pipedreamApps
        .filter(app => app.name.toLowerCase().includes(q))
        .map(app => ({
          ...app,
          label: app.name,
          isGroup: true,
          category: 'Integrations'
        }));

      return [...staticMatches, ...subActionMatches, ...platformMatches].sort((a, b) => {
        const aLabel = (a as any).label || (a as any).name || '';
        const bLabel = (b as any).label || (b as any).name || '';
        const aExact = aLabel.toLowerCase() === q;
        const bExact = bLabel.toLowerCase() === q;
        if (aExact && !bExact) return -1;
        if (bExact && !aExact) return 1;
        return aLabel.toLowerCase().startsWith(q) ? -1 : 1;
      });
    }

    // 2. If viewing a platform's actions (drill-down)
    if (activePlatform && activePlatform !== '__integrations_view__') {
       return platformTools.map(tool => ({
        name: tool.name,
        key: tool.key,
        description: tool.description,
      }));
    }

    return [];
  }, [query, activePlatform, platformTools, pipedreamApps, combinedRegistry, socketType]);

  const toggle = (cat: string) =>
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  return (
    <aside
      className={`fixed top-14 left-0 h-[calc(100vh-3.5rem)] bg-background border-r border-border transition-all duration-300 z-40 flex flex-col ${
        isOpen ? 'w-80' : 'w-0 overflow-hidden border-none'
      }`}
    >
      {/* Search Header */}
      <div className="p-4 flex flex-col gap-2 border-b border-border/50 bg-background/50 backdrop-blur-md">
        <div className="flex items-center justify-between h-5">
           <h2 className="text-[10px] font-black text-muted uppercase tracking-tighter opacity-50 flex items-center gap-1.5">
             <LayoutPanelLeft size={10} />
             {activePlatform ? `${selectedPlatformName} Actions` : 'Tool Registry'}
           </h2>
           <button onClick={onToggle} className="text-muted hover:text-foreground transition-colors">
              <X size={14} />
           </button>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-foreground group-focus-within:scale-110 transition-all" size={14} />
          <input
            type="text"
            placeholder={activePlatform ? (activePlatform === '__integrations_view__' ? 'Search platforms...' : 'Search actions...') : 'Search platforms...'}
            className="w-full bg-foreground/[0.03] border border-border/20 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:bg-background transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        {/* UNIFIED SEARCH RESULTS VIEW */}
        {query.trim() && (
           <div className="space-y-1">
             {filtered.length === 0 && !isLoadingApps && (
               <div className="p-10 text-center opacity-30">
                 <Search size={32} className="mx-auto mb-3" />
                 <p className="text-[10px] font-black uppercase tracking-widest">No matching units found</p>
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
                        setSelectedPlatformName(tool.name);
                        setQuery(''); // Clear search on selection
                      } else {
                        onAddTool(toolId, { label: toolLabel, icon: tool.icon });
                      }
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group"
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${toolBg}`}>
                      {typeof tool.icon === 'string' ? (
                        <img src={tool.icon} alt={toolLabel} className="w-5 h-5 object-contain" />
                      ) : (
                        <Icon size={16} className={toolColor} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12.5px] font-bold text-foreground truncate leading-tight">{toolLabel}</p>
                      {tool.category && (
                        <p className="text-[9px] uppercase font-black tracking-widest text-muted/40 mt-0.5">{tool.category}</p>
                      )}
                    </div>
                    {tool.isGroup ? (
                      <ChevronRight size={14} className="text-muted transition-transform group-hover:translate-x-1" />
                    ) : (
                      <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
                    )}
                  </button>
                );
             })}
             {isLoadingApps && (
               <div className="p-4 flex items-center justify-center gap-2 text-muted/40">
                 <Loader2 size={12} className="animate-spin" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Scanning Integrations...</span>
               </div>
             )}
           </div>
        )}

        {/* STANDARD CATEGORY / PLATFORM NAVIGATION */}
        {!query.trim() && (
          <>
            {activePlatform === '__integrations_view__' ? (
              // SHOW ALL PLATFORMS
              <div>
                <button
                  onClick={() => {
                    setActivePlatform(null);
                    setSelectedPlatformName('');
                  }}
                  className="w-full flex items-center gap-2 mb-4 p-2 rounded-lg hover:bg-foreground/[0.04] text-[11px] font-bold text-muted transition-all group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Tools
                </button>

                {isLoadingApps && pipedreamApps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-12 text-muted/40">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Initialising Matrix...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {pipedreamApps.map((app) => (
                      <button
                        key={app.id}
                        onClick={() => {
                          setActivePlatform(app.id);
                          setSelectedPlatformName(app.name);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border/20 bg-indigo-500/10">
                          <img src={app.icon} alt={app.name} className="w-5 h-5 object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-foreground truncate leading-tight">{app.name}</p>
                        </div>
                        <ChevronRight size={14} className="text-muted transition-transform group-hover:translate-x-1" />
                      </button>
                    ))}

                    {hasMore && (
                      <button
                        onClick={() => setPage(p => p + 1)}
                        className="w-full py-4 text-[10px] font-black uppercase text-indigo-500/60 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all text-center rounded-xl"
                      >
                        {isLoadingApps ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Sync More Units'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : activePlatform ? (
              // SHOW ACTIONS FOR SELECTED PLATFORM
              <div>
                <button
                  onClick={() => setActivePlatform('__integrations_view__')}
                  className="w-full flex items-center gap-2 mb-4 p-2 rounded-lg hover:bg-foreground/[0.04] text-[11px] font-bold text-muted transition-all group"
                >
                  <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                  Back to Integrations
                </button>

                {isLoadingTools ? (
                  <div className="flex flex-col items-center justify-center gap-3 p-12 text-muted/40">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Loading Protocol...</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {platformTools.map((tool) => {
                      const platform = pipedreamApps.find(a => a.id === activePlatform);
                      return (
                        <button
                          key={tool.name}
                          onClick={() => {
                            const toolId = `pd:${activePlatform}:${tool.name.toLowerCase().replace(/\s+/g, '_')}`;
                            onAddTool(toolId, {
                              label: `${platform?.name} - ${tool.name}`,
                              icon: platform?.icon,
                              appSlug: activePlatform,
                              actionName: tool.key,
                              platformName: platform?.name
                            });
                          }}
                          className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group border border-transparent hover:border-border/20"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-foreground truncate leading-tight">{tool.name}</p>
                            {tool.description && (
                              <p className="text-[10px] text-muted/60 truncate mt-0.5">{tool.description}</p>
                            )}
                          </div>
                          <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-1" />
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
                  className="w-full flex items-center justify-between p-3 mb-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all group"
                >
                  <span className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-500/20">
                      <ChevronRight size={16} className="text-indigo-500" />
                    </div>
                    <span className="text-[12px] font-bold text-indigo-500">Integrations</span>
                  </span>
                  <ChevronRight size={14} className="text-indigo-500/60 group-hover:translate-x-1 transition-transform" />
                </button>

                {categories.map(cat => {
                  const items = combinedRegistry.filter(t => (t as any).category === cat);
                  if (items.length === 0) return null;
                  const isCollapsed = collapsed[cat];

                  return (
                    <div key={cat} className="mb-2">
                      <button
                        onClick={() => toggle(cat)}
                        className="w-full flex items-center justify-between p-2 mb-1 rounded-lg hover:bg-foreground/[0.02] text-muted transition-all group"
                      >
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-60 group-hover:opacity-100">{cat}</span>
                        <ChevronDown size={12} className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-1 mt-1 px-1">
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
                                  } else {
                                    onAddTool(tool.id, { label: toolLabel, icon: tool.icon });
                                  }
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group"
                              >
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${tool.bg || 'bg-indigo-500/10'}`}>
                                  {typeof tool.icon === 'string' ? (
                                    <img src={tool.icon} alt={toolLabel} className="w-5 h-5 object-contain" />
                                  ) : (
                                    <Icon size={16} className={tool.color || 'text-indigo-500'} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12.5px] font-bold text-foreground truncate leading-tight">{toolLabel}</p>
                                </div>
                                {tool.isGroup ? (
                                  <ChevronRight size={14} className="text-muted transition-transform group-hover:translate-x-1" />
                                ) : (
                                  <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
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
