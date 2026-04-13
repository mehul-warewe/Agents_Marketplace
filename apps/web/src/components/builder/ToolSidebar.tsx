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
    const staticFilter = TOOL_REGISTRY.filter(t =>
      !t.id.startsWith('ai.') &&
      t.category !== 'AI' &&
      (t.label.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q))
    );

    let cleanRegistry = [...staticFilter, ...pipedreamApps];

    if (socketType) {
      cleanRegistry = cleanRegistry.filter(t => {
        // PipedreamApps don't have inputs, so include all of them
        if (t.isGroup) return true;

        return (t as any).inputs?.some((inp: any) =>
          inp.type === socketType ||
          inp.type === 'any' ||
          (socketType === 'data' && (inp.type === 'json' || inp.type === 'string')) ||
          (socketType === 'json' && inp.type === 'data') ||
          (socketType === 'string' && inp.type === 'data')
        );
      });
    }

    // If viewing a platform's actions, show those
    if (activePlatform && !q) {
      return platformTools.map(tool => ({
        name: tool.name,
        key: tool.key,
        description: tool.description,
      }));
    }

    const searchable = cleanRegistry.flatMap(t => {
       const items = [t];
       if (t.isGroup && (t as any).subActions) {
         (t as any).subActions.forEach((sub: any) => {
            items.push({ ...t, id: sub.id, label: `${(t as any).label} - ${sub.label}`, isGroup: false });
         });
       }
       return items;
    });

    if (!q) return searchable.filter(s => !(s as any).id?.includes(':'));

    return searchable.filter(
      t =>
        !t.isGroup &&
        ((t as any).label?.toLowerCase().includes(q) ||
        (t as any).category?.toLowerCase().includes(q) ||
        (t as any).description?.toLowerCase().includes(q)),
    );
  }, [query, activePlatform, platformTools]);

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
            placeholder={activePlatform ? 'Search actions...' : 'Search platforms...'}
            className="w-full bg-foreground/[0.03] border border-border/20 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:bg-background transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        {/* SHOWING PLATFORMS OR ACTIONS */}
        {activePlatform === '__integrations_view__' ? (
          // SHOW ALL PLATFORMS
          <div>
            {/* BACK BUTTON */}
            <button
              onClick={() => {
                setActivePlatform(null);
                setSelectedPlatformName('');
                setQuery('');
              }}
              className="w-full flex items-center gap-2 mb-4 p-2 rounded-lg hover:bg-foreground/[0.04] text-[11px] font-bold text-muted transition-all group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Tools
            </button>

            {/* PLATFORMS LIST */}
            {isLoadingApps ? (
              <div className="flex items-center justify-center gap-2 p-8 text-muted/40">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Loading Integrations...</span>
              </div>
            ) : pipedreamApps.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[10px] text-muted/40 font-medium">No integrations available</p>
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
                    className="w-full py-4 text-[10px] font-black uppercase text-indigo-500/60 hover:text-indigo-500 hover:bg-indigo-500/5 transition-all text-center rounded-xl animate-in fade-in duration-700"
                  >
                    {isLoadingApps ? <Loader2 size={12} className="animate-spin mx-auto" /> : 'Load More Integrations'}
                  </button>
                )}
              </div>
            )}
          </div>
        ) : activePlatform ? (
          // SHOW ACTIONS FOR SELECTED PLATFORM
          <div>
            {/* BACK BUTTON */}
            <button
              onClick={() => {
                setActivePlatform('__integrations_view__');
                setSelectedPlatformName('');
              }}
              className="w-full flex items-center gap-2 mb-4 p-2 rounded-lg hover:bg-foreground/[0.04] text-[11px] font-bold text-muted transition-all group"
            >

              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Integrations
            </button>

            {isLoadingTools ? (
              <div className="flex items-center justify-center gap-2 p-8 text-muted/40">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Loading Actions...</span>
              </div>
            ) : platformTools.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-[10px] text-muted/40 font-medium">No actions available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {platformTools.map((tool) => (
                  <button
                    key={tool.name}
                    onClick={() => {
                      // For any platform/action, use generic 'pipedream_action' execution key
                      // Store the platform and action in the node config
                      const platform = pipedreamApps.find(a => a.id === activePlatform);
                      const toolId = `pd:${activePlatform}:${tool.name.toLowerCase().replace(/\s+/g, '_')}`;

                      onAddTool(toolId, {
                        label: `${platform?.name} - ${tool.name}`,
                        icon: platform?.icon,
                        appSlug: activePlatform,
                        actionName: tool.key, // Use the technical key for exact MCP tool identification
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
                    <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* MAIN REGISTRY VIEW WITH INTEGRATIONS BUTTON */
          <>
            {/* INTEGRATIONS BUTTON */}
            <button
              onClick={() => {
                setActivePlatform('__integrations_view__');
                setQuery('');
              }}
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

            {/* REGULAR CATEGORIES */}
            {categories.map(cat => {
            const items = combinedRegistry.filter(t =>
              (t as any).category === cat && !(t as any).id?.startsWith('ai.') && (t as any).category !== 'AI'
            );

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
                    {items.map(tool => {
                      const Icon = (tool as any).icon as any;
                      const toolLabel = (tool as any).label || (tool as any).name;
                      const toolBg = (tool as any).bg || 'bg-indigo-500/10';
                      const toolColor = (tool as any).color || 'text-indigo-500';
                      const toolId = (tool as any).id;

                      return (
                        <button
                          key={toolId}
                          onClick={() => {
                            if (tool.isGroup) {
                              setActivePlatform(toolId);
                              setSelectedPlatformName(toolLabel);
                            } else {
                              onAddTool(toolId, { label: toolLabel, icon: (tool as any).icon as string });
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${toolBg}`}>
                            {typeof (tool as any).icon === 'string' ? (
                              <img src={(tool as any).icon} alt={toolLabel} className="w-5 h-5 object-contain" />
                            ) : (
                              <Icon size={16} className={toolColor} />
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
      </div>
    </aside>
  );
}
