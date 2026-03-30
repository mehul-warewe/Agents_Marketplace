'use client';
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Plus, LayoutPanelLeft, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { TOOL_REGISTRY, TOOL_CATEGORIES } from './toolRegistry';

interface ToolSidebarProps {
  onAddTool: (toolId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  socketType?: string | null;
}

export default function ToolSidebar({ onAddTool, isOpen, onToggle, socketType }: ToolSidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [activePlatform, setActivePlatform] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    let cleanRegistry = TOOL_REGISTRY.filter(t => !t.id.startsWith('ai.') && t.category !== 'AI');
    
    // Filter by socket compatibility if provided
    if (socketType) {
      cleanRegistry = cleanRegistry.filter(t => 
        t.inputs.some((inp: any) =>
          inp.type === socketType ||
          inp.type === 'any' ||
          (socketType === 'data' && (inp.type === 'json' || inp.type === 'string')) ||
          (socketType === 'json' && inp.type === 'data') ||
          (socketType === 'string' && inp.type === 'data')
        )
      );
    }
    
    // If we have an active platform and no search, we show its sub-actions in a focused view
    if (activePlatform && !q) {
      const tool = TOOL_REGISTRY.find(t => t.id === activePlatform);
      if (!tool || !tool.subActions) return [];
      return tool.subActions.map(sub => ({
        ...tool,
        id: sub.id,
        label: sub.label,
        isGroup: false,
        subActions: [],
      }));
    }

    // Flatten for search
    const searchable = cleanRegistry.flatMap(t => {
       const items = [t];
       if (t.isGroup && t.subActions) {
         t.subActions.forEach(sub => {
            items.push({ ...t, id: sub.id, label: `${t.label} - ${sub.label}`, isGroup: false });
         });
       }
       return items;
    });

    if (!q) return searchable.filter(s => !s.id.includes(':'));
    
    // In search mode, ONLY show functional actions (no groups)
    return searchable.filter(
      t =>
        !t.isGroup &&
        (t.label.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)),
    );
  }, [query, activePlatform]);

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
             {activePlatform ? 'Service Actions' : 'Tool Registry'}
           </h2>
           <button onClick={onToggle} className="text-muted hover:text-foreground transition-colors">
              <X size={14} />
           </button>
        </div>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/50 group-focus-within:text-foreground group-focus-within:scale-110 transition-all" size={14} />
          <input
            type="text"
            placeholder="Search actions..."
            className="w-full bg-foreground/[0.03] border border-border/20 rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-foreground/20 focus:bg-background transition-all"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
        {/* DRILL-DOWN VIEW */}
        {activePlatform && !query ? (
          <div>
            <button 
              onClick={() => setActivePlatform(null)}
              className="w-full flex items-center gap-2 mb-4 p-2 rounded-lg hover:bg-foreground/[0.04] text-[11px] font-bold text-muted transition-all group"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Back to Platforms
            </button>
            <div className="space-y-1">
              {filtered.map(tool => {
                const Icon = tool.icon as any;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onAddTool(tool.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group border border-transparent hover:border-border/20"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${tool.bg}`}>
                      {typeof tool.icon === 'string' ? (
                        <img src={tool.icon} alt={tool.label} className="w-4 h-4 object-contain" />
                      ) : (
                         <Icon size={14} className={tool.color} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-foreground truncate leading-tight">{tool.label}</p>
                    </div>
                    <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : query ? (
          /* SEARCH RESULTS VIEW */
          <div className="space-y-1">
            {filtered.map(tool => {
              const Icon = tool.icon as any;
              return (
                <button
                  key={tool.id}
                  onClick={() => tool.isGroup ? setActivePlatform(tool.id) : onAddTool(tool.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${tool.bg}`}>
                    {typeof tool.icon === 'string' ? (
                      <img src={tool.icon} alt={tool.label} className="w-4 h-4 object-contain" />
                    ) : (
                       <Icon size={14} className={tool.color} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground truncate leading-tight">{tool.label}</p>
                  </div>
                  {tool.isGroup ? <ChevronRight size={14} className="text-muted" /> : <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100" />}
                </button>
              );
            })}
          </div>
        ) : (
          /* CATEGORIZED TOP-LEVEL VIEW */
          TOOL_CATEGORIES.map(cat => {
            const items = TOOL_REGISTRY.filter(t => t.category === cat && !t.id.startsWith('ai.') && t.category !== 'AI');
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
                      const Icon = tool.icon as any;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            if (tool.isGroup) {
                              setActivePlatform(tool.id);
                            } else {
                              onAddTool(tool.id);
                            }
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.04] transition-all text-left group"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${tool.bg}`}>
                            {typeof tool.icon === 'string' ? (
                              <img src={tool.icon} alt={tool.label} className="w-5 h-5 object-contain" />
                            ) : (
                              <Icon size={16} className={tool.color} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12.5px] font-bold text-foreground truncate leading-tight">{tool.label}</p>
                          </div>
                          {tool.isGroup ? <ChevronRight size={14} className="text-muted transition-transform group-hover:translate-x-1" /> : <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
