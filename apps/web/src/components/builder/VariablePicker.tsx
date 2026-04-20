'use client';
import React, { useMemo, useState } from 'react';
import { Search, Zap, Variable } from 'lucide-react';
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

  const sourceGroups = useMemo(() => {
    return ancestors
      .filter(node => node.data?.result || node.data?.isTrigger)
      .map(node => {
        const tool = getToolById(node.data.toolId);
        const result = node.data.result;
        
        let fields: { key: string; label: string; type: string; preview?: string; fullPath: string }[] = [];

        if (result && typeof result === 'object') {
           const discover = (obj: any, path: string): any[] => {
              if (!obj || typeof obj !== 'object' || path.split('.').length > 4) return [];
              
              if (Array.isArray(obj)) {
                 if (obj.length === 0) return [];
                 return discover(obj[0], `${path}[0]`);
              }

              return Object.entries(obj).flatMap(([k, v]) => {
                 const fullK = path ? `${path}.${k}` : k;
                 if (typeof v === 'function') return [];
                 
                 let preview = '';
                 if (v !== null && v !== undefined) {
                    preview = typeof v === 'object' ? (Array.isArray(v) ? '[...]' : '{...}') : String(v).substring(0, 40);
                 }

                 const self = {
                    key: fullK,
                    label: fullK,
                    type: typeof v,
                    preview,
                    fullPath: tool.isTrigger ? fullK : `${node.id}.${fullK}`
                 };

                 if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length < 15) {
                    return [self, ...discover(v, fullK)];
                 }

                 return [self];
              });
           };
           fields = discover(result, '');
        }
         
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
          }

          fields = schemaFields.map(f => ({
            ...f,
            fullPath: tool.isTrigger ? f.key : `${node.id}.${f.key}`
          }));
        }

        if (node.data.toolId === 'skill.input') {
          const currentContract = node.data.inputSchema || [];
          if (currentContract.length > 0) {
            const discoverNested = (obj: any, path: string): any[] => {
              if (!obj || typeof obj !== 'object' || path.split('.').length > 5) return [];
              return Object.entries(obj).flatMap(([k, v]) => {
                const fullK = `${path}.${k}`;
                const self = {
                  key: fullK,
                  label: fullK,
                  type: typeof v,
                  preview: typeof v === 'object' ? (Array.isArray(v) ? '[...]' : '{...}') : String(v).substring(0, 40),
                  fullPath: fullK
                };
                if (v && typeof v === 'object' && !Array.isArray(v)) {
                  return [self, ...discoverNested(v, fullK)];
                }
                return [self];
              });
            };

            const contractFields = currentContract.flatMap((f: any) => {
              const self = {
                key: f.name,
                label: f.name,
                type: f.type,
                preview: f.description,
                fullPath: `input.${f.name}`
              };

              if (f.type === 'json' && f.defaultValue) {
                try {
                  const parsed = typeof f.defaultValue === 'string' ? JSON.parse(f.defaultValue) : f.defaultValue;
                  if (parsed && typeof parsed === 'object') {
                    return [self, ...discoverNested(parsed, `input.${f.name}`)];
                  }
                } catch (e) {}
              }
              return [self];
            });
            fields = [...fields, ...contractFields];
          }
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
    <div className="flex flex-col bg-card border border-border/10 rounded-xl shadow-2xl w-80 max-h-[400px] overflow-hidden z-50">
      {/* Header */}
      <div className="p-3 border-b border-border/10 bg-secondary/5">
        <div className="flex items-center gap-2 mb-2.5">
           <Variable size={12} className="text-primary" />
           <h3 className="text-[9px] font-bold uppercase tracking-widest text-primary">Variables</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/20" size={12} />
          <input
            autoFocus
            type="text"
            className="w-full pl-8 pr-3 py-1.5 bg-secondary/50 border border-border/10 rounded-lg text-[11px] outline-none focus:border-primary/40 transition-all placeholder:text-foreground/10"
            placeholder="Search fields..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0 no-scrollbar">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const Icon = group.icon as any;
            return (
              <div key={group.id} className="space-y-0.5">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-secondary/30 border border-border/10">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border border-border/10 ${group.bg}`}>
                    {typeof group.icon === 'string' ? (
                       <img src={group.icon} className="w-3 h-3 grayscale opacity-70" />
                    ) : (
                       <Icon size={10} className={group.color} />
                    )}
                  </div>
                  <span className="text-[9px] font-bold text-foreground/70 truncate uppercase tracking-wider">{group.label}</span>
                  {group.hasRealData && (
                    <span className="ml-auto px-1.5 py-0.5 bg-primary/10 border border-primary/20 rounded text-[7px] font-bold text-primary tracking-widest">
                      LIVE
                    </span>
                  )}
                </div>

                <div className="space-y-0.5">
                  {group.fields.map(field => (
                    <button
                      key={field.key}
                      onClick={() => onSelect(field.fullPath)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-primary/5 transition-all group text-left border border-transparent hover:border-primary/10"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[10px] font-bold text-foreground/70 group-hover:text-primary transition-colors truncate">{field.label}</span>
                           {field.preview && (
                             <span className="text-[9px] text-foreground/20 font-medium truncate italic">
                               = {field.preview}
                             </span>
                           )}
                        </div>
                        <span className="text-[8px] text-foreground/20 font-mono truncate group-hover:text-foreground/40 transition-colors">{field.fullPath}</span>
                      </div>
                      <PlusIcon />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-10 text-center space-y-3">
             <div className="flex justify-center opacity-10">
                <Zap size={32} className="text-primary" />
             </div>
             <div className="space-y-1">
               <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest">No variables available</p>
               <p className="text-[8px] text-foreground/20 italic">Run upstream nodes to expose output data</p>
             </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border/10 bg-secondary/5 flex items-center justify-between">
         <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            <span className="text-[8px] font-bold text-primary/40 uppercase tracking-widest">Context Loaded</span>
         </div>
         <button onClick={onClose} className="px-2 py-1 hover:bg-foreground/5 rounded-lg text-[8px] font-bold uppercase text-foreground/20 hover:text-foreground transition-all tracking-widest">
            Close
         </button>
      </div>
    </div>
  );
}

const PlusIcon = () => (
   <div className="w-4 h-4 rounded-md border border-border/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
      <span className="text-[10px] font-bold text-foreground/40">+</span>
   </div>
);
