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

        // Recursive Field Discovery from REAL DATA
        if (result && typeof result === 'object') {
           const discover = (obj: any, path: string): any[] => {
              if (!obj || typeof obj !== 'object' || path.split('.').length > 4) return [];
              
              if (Array.isArray(obj)) {
                 if (obj.length === 0) return [];
                 // Discover from first item for array templates
                 return discover(obj[0], `${path}[0]`);
              }

              return Object.entries(obj).flatMap(([k, v]) => {
                 const fullK = path ? `${path}.${k}` : k;
                 
                 // Skip very large objects or functions
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

                 // If it's a small object, recurse one more level
                 if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length < 15) {
                    return [self, ...discover(v, fullK)];
                 }

                 return [self];
              });
           };
           fields = discover(result, '');
        }
         
         // Fallback to schema if no real data fields found (or for Triggers without recent test data)
         // Only show if it's a trigger or we explicitly want to allow pre-execution mapping
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

        // --- SPECIAL CASE: Skill Input ---
        // If this is the Skill Input node, we also inject the Skill Contract variables
        if (node.data.toolId === 'skill.input') {
          const currentContract = node.data.inputSchema || [];
          if (currentContract.length > 0) {
            const contractFields = currentContract.map((f: any) => ({
              key: f.name,
              label: f.name,
              type: f.type,
              preview: f.description,
              fullPath: `input.${f.name}`
            }));
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
    <div className="flex flex-col bg-card/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] w-80 max-h-[400px] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-white/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2 mb-3">
           <Zap size={10} className="text-emerald-500 fill-emerald-500" />
           <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">Active Variable Context</h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" size={12} />
          <input
            autoFocus
            type="text"
            className="w-full pl-8 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-[11px] outline-none focus:border-emerald-500/40 focus:bg-black/60 transition-all text-white placeholder:text-white/10"
            placeholder="Search fields or nodes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar min-h-0 bg-black/20">
        {filteredGroups.length > 0 ? (
          filteredGroups.map(group => {
            const Icon = group.icon as any;
            return (
              <div key={group.id} className="space-y-1">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center border border-white/10 ${group.bg}`}>
                    {typeof group.icon === 'string' ? (
                       <img src={group.icon} className="w-3 h-3 grayscale opacity-70" />
                    ) : (
                       <Icon size={10} className={group.color} />
                    )}
                  </div>
                  <span className="text-[10px] font-black text-white/90 truncate uppercase tracking-wider">{group.label}</span>
                  {group.hasRealData && (
                    <span className="ml-auto flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/30 rounded text-[7px] font-black text-emerald-400 tracking-tighter animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>

                <div className="space-y-0.5 mt-1">
                  {group.fields.map(field => (
                    <button
                      key={field.key}
                      onClick={() => onSelect(field.fullPath)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-500/10 transition-all group text-left border border-transparent hover:border-emerald-500/20"
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                           <span className="text-[11px] font-bold text-white/80 group-hover:text-emerald-400 transition-colors">{field.label}</span>
                           {field.preview && (
                             <span className="text-[9px] text-emerald-500/40 font-normal truncate italic pb-0.5">
                               = {field.preview}
                             </span>
                           )}
                        </div>
                        <span className="text-[9px] text-white/20 font-mono scale-[0.9] origin-left truncate group-hover:text-white/40 transition-colors uppercase tracking-widest">{field.fullPath}</span>
                      </div>
                      <PlusIcon />
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center space-y-4">
             <div className="flex justify-center opacity-10">
                <Zap size={48} className="text-emerald-500 fill-emerald-500" />
             </div>
             <div className="space-y-1">
               <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">No Active Vectors</p>
               <p className="text-[9px] text-white/20 italic">Upstream nodes must be executed to expose data</p>
             </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
         <div className="flex items-center gap-2 px-2">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest">Neural Sync Active</span>
         </div>
         <button onClick={onClose} className="px-3 py-1 hover:bg-white/[0.05] rounded-xl text-[9px] font-black uppercase text-white/30 hover:text-white transition-all tracking-tighter">
            Close Panel
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
