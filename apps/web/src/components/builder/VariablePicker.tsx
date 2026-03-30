'use client';
import React, { useMemo, useState } from 'react';
import { Search, ChevronRight, ChevronDown, Database, Cpu, Bolt, Zap, Terminal, Globe, MousePointer2 } from 'lucide-react';
import { getToolById } from './toolRegistry';

interface VariablePickerProps {
  nodes: any[];
  edges: any[];
  currentNodeId: string;
  onSelect: (variable: string) => void;
  onClose: () => void;
}

export default function VariablePicker({ nodes, edges, currentNodeId, onSelect, onClose }: VariablePickerProps) {
  const [search, setSearch] = useState('');

  // 1. Find all upstream nodes (ancestors)
  const ancestors = useMemo(() => {
    const upstreamIds = new Set<string>();
    const queue = [currentNodeId];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const incomingEdges = edges.filter(e => e.target === current);
      incomingEdges.forEach(e => {
        if (e.source !== currentNodeId) {
          upstreamIds.add(e.source);
          queue.push(e.source);
        }
      });
    }
    return nodes.filter(n => upstreamIds.has(n.id));
  }, [nodes, edges, currentNodeId]);

  // 2. Map nodes to their available fields
  const sourceGroups = useMemo(() => {
    return ancestors
      .filter(node => node.data?.result || node.data?.isTrigger) // Only executed Action nodes or any Trigger
      .map(node => {
        const tool = getToolById(node.data.toolId);
        const result = node.data.result;
        
        let fields: { key: string; label: string; type: string; preview?: string; fullPath: string }[] = [];

        // Derived Fields from REAL DATA if available
        if (result && typeof result === 'object' && !Array.isArray(result)) {
           fields = Object.keys(result).map(k => {
             const val = result[k];
             let preview = '';
             if (val !== null && val !== undefined) {
               preview = typeof val === 'object' ? JSON.stringify(val).substring(0, 30) : String(val);
             }
             return {
               key: k,
               label: k,
               type: typeof val,
               preview: preview,
               fullPath: tool.isTrigger ? `{{ ${k} }}` : `{{ ${node.id}.${k} }}`
             };
           });
        } 
        
        // Fallback to schema if no real data fields found (or for Triggers without recent test data)
        if (fields.length === 0) {
          const outputSchema = tool.outputSchema || [];
          const operationOutputs = (tool as any).operationOutputs;
          const selectedOp = node.data.config?.operation;

          let schemaFields: { key: string; label: string; type: string }[] = [];

          if (tool.isTrigger) {
             schemaFields = outputSchema.length > 0 
               ? outputSchema.map(f => ({ key: f.key, label: f.key, type: f.type })) 
               : [{ key: 'message', label: 'Message', type: 'string' }];
          } else if (selectedOp && operationOutputs && operationOutputs[selectedOp]) {
             schemaFields = operationOutputs[selectedOp].map((f: any) => ({ key: f.key, label: f.key, type: f.type }));
          } else if (outputSchema.length > 0) {
             schemaFields = outputSchema.map(f => ({ key: f.key, label: f.key, type: f.type }));
          } else {
             schemaFields = [{ key: 'result', label: 'Output Result', type: 'string' }];
          }

          fields = schemaFields.map(f => ({
            ...f,
            fullPath: tool.isTrigger ? `{{ ${f.key} }}` : `{{ ${node.id}.${f.key} }}`
          }));
        }

        return {
          id: node.id,
          label: node.data.label || tool.label,
          toolId: node.data.toolId,
          icon: tool.icon,
          color: tool.color,
          bg: tool.bg,
          isTrigger: tool.isTrigger,
          hasRealData: !!result,
          fields
        };
      }).filter(group => group.fields.length > 0);
  }, [ancestors]);

  const filteredGroups = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return sourceGroups;
    return sourceGroups.map(g => ({
       ...g,
       fields: g.fields.filter(f => 
         f.label.toLowerCase().includes(q) || 
         f.key.toLowerCase().includes(q) || 
         g.label.toLowerCase().includes(q)
       )
    })).filter(g => g.fields.length > 0);
  }, [sourceGroups, search]);

  return (
    <div className="flex flex-col bg-card border border-border/60 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] w-80 max-h-[400px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="p-3 border-b border-border/40 bg-foreground/[0.02]">
        <div className="flex items-center gap-2 mb-2">
           <Database size={10} className="text-muted" />
           <h3 className="text-[10px] font-black uppercase tracking-widest text-muted opacity-60">Global Variable Search</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" size={12} />
          <input
            autoFocus
            type="text"
            className="w-full pl-8 pr-3 py-2 bg-foreground/[0.02] border border-border/20 rounded-xl text-[11px] outline-none focus:border-foreground/20 focus:bg-background transition-all"
            placeholder="Type field name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar min-h-0">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const Icon = group.icon as any;
            return (
              <div key={group.id} className="space-y-1">
                <div className="flex items-center gap-2 px-2 py-1">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border border-border/10 ${group.bg}`}>
                    {typeof group.icon === 'string' ? (
                       <img src={group.icon} className="w-3 h-3 grayscale opacity-70" />
                    ) : (
                       <Icon size={10} className={group.color} />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-foreground/70 truncate">{group.label}</span>
                  {group.isTrigger && <Zap size={8} className="text-amber-500 fill-amber-500" />}
                  {group.hasRealData && (
                    <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[7px] font-black text-emerald-500 tracking-tighter">
                      LIVE
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 ml-7">
                  {group.fields.map(field => (
                    <button
                      key={field.key}
                      onClick={() => onSelect(field.fullPath)}
                      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-foreground/[0.04] transition-all group text-left border border-transparent hover:border-border/10"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] font-medium text-foreground group-hover:text-foreground active:translate-x-0.5 transition-transform">{field.label}</span>
                           {field.preview && (
                             <span className="text-[9px] text-muted/40 font-normal truncate italic pb-0.5">
                               = {field.preview}
                             </span>
                           )}
                        </div>
                        <span className="text-[9px] text-muted opacity-60 font-mono scale-[0.9] origin-left truncate">{field.fullPath}</span>
                      </div>
                      <PlusIcon />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-8 text-center space-y-2">
             <div className="flex justify-center opacity-10">
                <Database size={32} />
             </div>
             <p className="text-[10px] text-muted italic">No variables found in upstream nodes</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-border/40 bg-foreground/[0.01] flex items-center justify-between">
         <div className="flex items-center gap-1.5 px-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-muted uppercase tracking-tight">System Ready</span>
         </div>
         <button onClick={onClose} className="px-3 py-1 hover:bg-foreground/[0.05] rounded-md text-[9px] font-black uppercase text-muted hover:text-foreground transition-all">
            Dismiss
         </button>
      </div>
    </div>
  );
}

const PlusIcon = () => (
   <div className="w-4 h-4 rounded-md border border-border/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
      <span className="text-[10px] font-bold">+</span>
   </div>
);
