'use client';
import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, Plus, LayoutPanelLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { TOOL_REGISTRY, TOOL_CATEGORIES } from './toolRegistry';

interface ToolSidebarProps {
  onAddTool: (toolId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function ToolSidebar({ onAddTool, isOpen, onToggle }: ToolSidebarProps) {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return TOOL_REGISTRY;
    return TOOL_REGISTRY.filter(
      t =>
        t.label.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [query]);

  const toggle = (cat: string) =>
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  if (!isOpen) {
    return (
      <aside className="w-12 shrink-0 bg-background border-r border-border flex flex-col items-center py-3 gap-2 overflow-hidden">
        {/* Expand button */}
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-foreground/[0.06] transition-all text-muted hover:text-foreground"
          title="Open modules panel"
        >
          <ChevronRight size={16} />
        </button>

        <div className="w-6 h-px bg-border/40 my-1" />

        {/* Category icon strip */}
        {TOOL_CATEGORIES.map(cat => {
          const items = TOOL_REGISTRY.filter(t => t.category === cat);
          if (items.length === 0) return null;
          const firstTool = items[0];
          if (!firstTool) return null;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const Icon = firstTool.icon as React.ComponentType<any>;
          return (
            <button
              key={cat}
              onClick={() => { onToggle(); }}
              title={cat}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-foreground/[0.06] transition-all"
            >
              {typeof firstTool.icon === 'string' ? (
                <img src={firstTool.icon} alt={cat} className="w-4 h-4 object-contain opacity-50 hover:opacity-100" />
              ) : (
                <Icon size={14} className={`${firstTool.color} opacity-50`} />
              )}
            </button>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-72 shrink-0 bg-background border-r border-border flex flex-col overflow-hidden font-inter">
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border/60">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <LayoutPanelLeft size={16} className="text-foreground/60" />
            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em] opacity-60">Modules</span>
          </div>
          {/* Collapse button */}
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-foreground/[0.06] transition-all text-muted hover:text-foreground"
            title="Collapse panel"
          >
            <ChevronLeft size={14} />
          </button>
        </div>

        {/* Modern Search */}
        <div className="relative group">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted opacity-30 group-focus-within:text-foreground group-focus-within:opacity-100 transition-all" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search modules..."
            className="w-full bg-foreground/[0.03] border border-border/40 rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold placeholder:text-muted/30 outline-none focus:bg-background focus:border-foreground/40 transition-all"
          />
        </div>
      </div>

      {/* Tool List Viewport */}
      <div className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
        {query ? (
          // Search Results
          <div className="space-y-1">
            {filtered.map(tool => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const Icon = tool.icon as React.ComponentType<any>;
              return (
                <button
                  key={tool.id}
                  onClick={() => onAddTool(tool.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.03] transition-all text-left group"
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${tool.bg}`}>
                    {typeof tool.icon === 'string' ? (
                      <img src={tool.icon} alt={tool.label} className="w-5 h-5 object-contain" />
                    ) : (
                      <Icon size={16} className={tool.color} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-foreground truncate leading-tight">{tool.label}</p>
                  </div>
                  <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
                </button>
              );
            })}
          </div>
        ) : (
          // Categorized Tools
          TOOL_CATEGORIES.map(cat => {
            const items = TOOL_REGISTRY.filter(t => t.category === cat);
            if (items.length === 0) return null;
            const isCollapsed = collapsed[cat];
            return (
              <div key={cat} className="mb-2">
                <button
                  onClick={() => toggle(cat)}
                  className="w-full h-10 flex items-center justify-between px-4 hover:bg-foreground/5 rounded-lg transition-all text-left group"
                >
                  <span className="text-[10px] font-black text-muted uppercase tracking-wider opacity-60 group-hover:opacity-100">
                    {cat}
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-muted transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`}
                  />
                </button>

                {!isCollapsed && (
                  <div className="space-y-1 mt-1">
                    {items.map(tool => {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      const Icon = tool.icon as React.ComponentType<any>;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => onAddTool(tool.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-foreground/[0.03] transition-all text-left group"
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-border/20 ${tool.bg}`}>
                            {typeof tool.icon === 'string' ? (
                              <img src={tool.icon} alt={tool.label} className="w-5 h-5 object-contain" />
                            ) : (
                              <Icon size={16} className={tool.color} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-foreground truncate leading-tight">{tool.label}</p>
                          </div>
                          <Plus size={14} className="text-muted opacity-0 group-hover:opacity-100 transition-all" />
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
