'use client';

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { 
  X, Database, Settings2, Terminal, Play, Loader2, Info, LogIn, 
  AlertCircle, SlidersHorizontal, CheckCircle, ShieldCheck, 
  ChevronDown, Type, AlignLeft, Hash, FileJson, CheckSquare, 
  Table, FileUp, List, Key, Trash2, Layout, Bot,
  Plus, ChevronRight,
  Zap,
  Lock,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getToolById } from './toolRegistry';
import DynamicParameterForm, { SelectField, CheckboxField } from './DynamicParameterForm';
import SmartInput from '@/components/builder/SmartInput';
import PipedreamNodeSettings from './PipedreamNodeSettings';
import ManualCredentialSettings from './ManualCredentialSettings';
import { usePipedreamTools } from '@/hooks/usePipedreamApps';
import { cn, formatLabel } from '@/components/ui/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InputParam {
  id: string;
  name: string;
  type: string; 
  description: string;
  required: boolean;
  defaultValue?: any;
  metadata?: Record<string, any>;
}

/**
 * Intelligent JSON Editor with real-time validation and formatting
 */
function JsonEditor({ value, onChange, onTriggerPicker }: { 
  value: string, 
  onChange: (val: string) => void,
  onTriggerPicker?: (pos: { x: number; y: number }, cursorPos: number) => void
}) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setError(null);
      return;
    }
    try {
      JSON.parse(value);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [value]);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
    } catch (err) {}
  };

  return (
    <div className="space-y-2">
      <div className="relative group/json">
        <SmartInput 
          value={value}
          onChange={onChange}
          onTriggerPicker={onTriggerPicker}
          placeholder='{ "key": "value" }'
          textarea
          mono
          className={cn(
            "w-full text-[12px] font-mono leading-relaxed transition-all",
            error ? "border-red-500/50 bg-red-500/[0.02]" : "focus-within:border-indigo-500/40"
          )}
        />
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <button 
            onClick={handleFormat}
            className="p-1 rounded bg-secondary/50 text-[8px] font-bold uppercase tracking-widest text-muted-foreground/40 hover:text-indigo-500 transition-colors"
            title="Prettify JSON"
          >
            Format
          </button>
          <div className={cn("transition-all pointer-events-none", error ? "text-red-500 opacity-100" : "text-muted-foreground/10 opacity-40")}>
            {error ? <AlertCircle size={14} /> : <FileJson size={14} />}
          </div>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-1.5 px-2 animate-in slide-in-from-top-1">
          <span className="text-[9px] font-bold text-red-500/60 uppercase tracking-tight italic">
            Syntax Error: {error.replace('JSON.parse: ', '')}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Component: Tool Contract Editor ──────────────────────────────────────

interface ContractEditorProps {
  mode: 'INPUT' | 'OUTPUT' | 'BOTH';
  inputSchema: InputParam[];
  outputDescription: string;
  onChange: (schema: InputParam[], outputDesc: string) => void;
  onTriggerPicker?: (pos: { x: number; y: number }, cursorPos: number) => void;
}

function ContractEditor({ mode, inputSchema, outputDescription, onChange, onTriggerPicker }: ContractEditorProps) {
  const [params, setParams] = useState<InputParam[]>(inputSchema || []);
  const [outDesc, setOutDesc] = useState(outputDescription || '');
  
  // Sync state with props
  useEffect(() => { setParams(inputSchema || []); }, [inputSchema]);
  useEffect(() => { setOutDesc(outputDescription || ''); }, [outputDescription]);

  const addParam = (type: string = 'string') => {
    const newParam: InputParam = {
      id: Math.random().toString(36).substr(2, 9),
      name: `variable_${params.length + 1}`,
      type,
      description: '',
      required: true,
    };
    const next = [...params, newParam];
    setParams(next);
    onChange(next, outDesc);
  };

  const updateParam = (id: string, updates: Partial<InputParam>) => {
    const next = params.map(p => p.id === id ? { ...p, ...updates } : p);
    setParams(next);
    onChange(next, outDesc);
  };

  const removeParam = (id: string) => {
    const next = params.filter(p => p.id !== id);
    setParams(next);
    onChange(next, outDesc);
  };

  const inputTypes = [
    { type: 'string', label: 'Text', icon: Type },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'json', label: 'JSON', icon: FileJson },
    { type: 'list', label: 'List', icon: List },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Input Section */}
      {(mode === 'INPUT' || mode === 'BOTH') && (
        <section className="space-y-4">
          <div className="space-y-1 px-1">
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 leading-none">
                INPUT_SCHEMA
               </h3>
               <div className="flex-1 h-px bg-border/40" />
            </div>
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Input Configuration</h4>
            <p className="text-[9px] text-muted-foreground font-medium italic leading-none">Define the data structure for this skill</p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {inputTypes.map(t => (
              <button
                key={t.type}
                onClick={() => addParam(t.type)}
                className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-secondary/30 border border-border/40 hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-all group/type shadow-sm"
                title={`Add ${t.label} Parameter`}
              >
                <t.icon size={12} className="text-muted-foreground group-hover/type:text-indigo-500 transition-colors" />
                <span className="text-[7px] font-black uppercase tracking-widest text-muted-foreground/60 group-hover/type:text-indigo-500 transition-colors">{t.label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-3 p-3 bg-secondary border border-border/60 rounded-2xl shadow-inner min-h-[80px]">
            {params.length === 0 ? (
              <div className="py-12 border border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center text-center px-8">
                <div className="w-10 h-10 bg-secondary border border-border/40 rounded-lg flex items-center justify-center text-muted-foreground/20 mb-3">
                  <Database size={18} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 italic">No parameters configured</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Information Callout */}
                <div className="p-3 bg-indigo-500/[0.02] border border-indigo-500/10 rounded-lg flex items-start gap-3">
                   <Info size={14} className="text-indigo-500/40 shrink-0 mt-0.5" />
                   <p className="text-[9px] font-medium text-muted-foreground/60 leading-relaxed italic">
                      Map these variables in subsequent steps using double brackets. Example: <span className="text-indigo-500 font-bold">{'{{ variable_name }}'}</span>.
                   </p>
                </div>

                {params.map((p) => (
                  <div key={p.id} className="p-4 bg-card border border-border shadow-md rounded-xl hover:border-indigo-500/60 hover:shadow-lg transition-all group relative overflow-hidden">
                    <div className="flex flex-col gap-4">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <input 
                            value={p.name}
                            onChange={(e) => updateParam(p.id, { name: e.target.value })}
                            className="bg-transparent border-none text-[12px] font-bold text-foreground outline-none w-2/3 placeholder:text-muted-foreground/20 uppercase tracking-widest"
                            placeholder="VARIABLE_ID..."
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-widest leading-none">Req</span>
                            <button 
                              onClick={() => updateParam(p.id, { required: !p.required })}
                              className={`w-6 h-3 rounded-full transition-all relative ${p.required ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'bg-secondary'}`}
                            >
                              <div className={`absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all ${p.required ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                          </div>
                          <button onClick={() => removeParam(p.id)} className="text-muted-foreground/20 hover:text-red-500 transition-colors">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Description Area */}
                      <textarea 
                        value={p.description}
                        onChange={(e) => updateParam(p.id, { description: e.target.value })}
                        placeholder="Instructions for this parameter..."
                        className="w-full bg-transparent border-none text-[10px] font-medium text-muted-foreground/60 outline-none resize-none leading-relaxed placeholder:text-muted-foreground/10"
                        rows={1}
                      />

                      {/* Default Value Input - Specialized UI by Type */}
                      <div className="relative group/val">
                        {p.type === 'number' ? (
                          <div className="relative">
                            <input 
                              type="number"
                              value={p.defaultValue ?? ''}
                              onChange={(e) => updateParam(p.id, { defaultValue: e.target.value === '' ? undefined : Number(e.target.value) })}
                              placeholder="0.00"
                              className="w-full px-3 py-2.5 bg-foreground/[0.02] border border-border/40 rounded-xl text-[12px] font-bold text-foreground outline-none focus:border-indigo-500/40 focus:bg-background transition-all"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500/20">
                              <Hash size={14} />
                            </div>
                          </div>
                        ) : p.type === 'list' ? (
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(p.defaultValue) ? p.defaultValue : []).map((item: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-indigo-500/5 border border-indigo-500/20 rounded-lg animate-in zoom-in-95">
                                  <span className="text-[10px] font-bold text-indigo-500/80">{item}</span>
                                  <button 
                                    onClick={() => {
                                      const nextList = [...(p.defaultValue || [])];
                                      nextList.splice(idx, 1);
                                      updateParam(p.id, { defaultValue: nextList });
                                    }}
                                    className="text-indigo-500/30 hover:text-red-500 transition-colors"
                                  >
                                    <X size={10} />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input 
                                id={`list-input-${p.id}`}
                                placeholder="New entry..."
                                className="flex-1 px-3 py-2 bg-foreground/[0.02] border border-border/40 rounded-lg text-[11px] text-foreground outline-none focus:border-indigo-500/40 transition-all"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val) {
                                      updateParam(p.id, { defaultValue: [...(p.defaultValue || []), val] });
                                      (e.target as HTMLInputElement).value = '';
                                    }
                                  }
                                }}
                              />
                              <button 
                                onClick={() => {
                                  const input = document.getElementById(`list-input-${p.id}`) as HTMLInputElement;
                                  const val = input.value.trim();
                                  if (val) {
                                    updateParam(p.id, { defaultValue: [...(p.defaultValue || []), val] });
                                    input.value = '';
                                  }
                                }}
                                className="px-3 bg-indigo-500/10 text-indigo-500 rounded-lg hover:bg-indigo-500/20 transition-all"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        ) : p.type === 'json' ? (
                          <JsonEditor 
                            value={typeof p.defaultValue === 'object' ? JSON.stringify(p.defaultValue, null, 2) : (p.defaultValue || '')}
                            onChange={(val) => updateParam(p.id, { defaultValue: val })}
                            onTriggerPicker={onTriggerPicker}
                          />
                        ) : (
                          <div className="relative group/text">
                            <SmartInput 
                              value={p.defaultValue || ''}
                              onChange={(val) => updateParam(p.id, { defaultValue: val })}
                              onTriggerPicker={onTriggerPicker}
                              placeholder="Describe the default value..."
                              className="w-full text-[12px]"
                            />
                            <div className="absolute top-2 right-2 text-muted-foreground/10 group-focus-within/text:text-indigo-500/40 transition-all pointer-events-none">
                              <AlignLeft size={14} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Indicator Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                         <div className="flex items-center gap-2 text-indigo-500/40">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-500/60">{formatLabel(p.name || 'UNBOUND')}</span>
                         </div>
                         <div className="flex items-center gap-2 relative group/type">
                             <button className="flex items-center gap-2 hover:bg-muted p-1 rounded transition-all">
                                {React.createElement(inputTypes.find(t => t.type === p.type)?.icon || Type, { size: 10, className: "text-indigo-500/60" })}
                                <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{inputTypes.find(t => t.type === p.type)?.label || 'String'}</span>
                                <ChevronDown size={8} className="text-muted-foreground/20" />
                             </button>

                             <div className="absolute bottom-full right-0 mb-1 w-32 bg-card border border-border/40 rounded-lg shadow-2xl py-1 z-50 hidden group-hover/type:block animate-in fade-in slide-in-from-bottom-1">
                                {inputTypes.map(t => (
                                  <button
                                    key={t.type}
                                    onClick={() => updateParam(p.id, { type: t.type })}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted text-left transition-colors ${p.type === t.type ? 'bg-indigo-500/5' : ''}`}
                                  >
                                    <t.icon size={10} className={p.type === t.type ? 'text-indigo-500' : 'text-muted-foreground/40'} />
                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${p.type === t.type ? 'text-indigo-500' : 'text-muted-foreground'}`}>{t.label}</span>
                                  </button>
                                ))}
                             </div>
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Output Section */}
      {(mode === 'OUTPUT' || mode === 'BOTH') && (
        <section className="space-y-4">
          <div className="space-y-1.5 px-1">
            <div className="flex items-center gap-2">
               <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
               <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 leading-none">
                OUTPUT_SIGNATURE
               </h3>
               <div className="flex-1 h-px bg-border/40" />
            </div>
            <h4 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Return Signature</h4>
            <p className="text-[9px] text-muted-foreground font-medium italic">Describe the return signature for this node</p>
          </div>
          <div className="p-3 bg-secondary border border-border/60 rounded-2xl shadow-inner">
            <div className="relative group/out">
              <div className="absolute top-3 left-3 text-emerald-500/30 group-focus-within/out:text-emerald-500/50 transition-colors">
                 <Bot size={18} />
              </div>
              <textarea 
                value={outDesc}
                onChange={(e) => onChange(inputSchema, e.target.value)}
                placeholder="e.g. Optimized JSON object containing structured research analysis..."
                className="w-full pl-10 pr-4 py-3 bg-card border border-border shadow-md rounded-xl text-[12px] font-medium text-foreground outline-none focus:border-emerald-500/30 min-h-[100px] resize-none leading-relaxed placeholder:text-muted-foreground/20 hover:border-emerald-500/10 transition-all font-inter"
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ─── Sub-Component: Variable Picker ──────────────────────────────────────────

interface VariablePickerProps {
  node?: any;
  variables: { nodeId: string; nodeLabel: string; vars: string[] }[];
  onSelect: (nodeId: string, varName: string) => void;
  onClose: () => void;
  position?: { x: number, y: number };
}

export const VariablePicker = ({ 
  node,
  variables, 
  onSelect, 
  onClose, 
  position 
}: VariablePickerProps) => {
  const [search, setSearch] = useState('');
  const [activePath, setActivePath] = useState<{ nodeId: string, path: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  // Build Hierarchical Tree from flat dot-notation variables
  const treeData = useMemo(() => {
    return variables.map(node => {
      const root: any = { name: node.nodeLabel || node.nodeId, id: node.nodeId, children: {} };
      
      node.vars.forEach(v => {
        const parts = v.split('.');
        let current = root.children;
        parts.forEach((part, i) => {
          if (!current[part]) {
            current[part] = { 
              name: part, 
              fullPath: parts.slice(0, i + 1).join('.'),
              isLeaf: i === parts.length - 1,
              children: {} 
            };
          }
          current = current[part].children;
        });
      });

      return root;
    });
  }, [variables]);

  // Opaque, pinned flyout beside sidebar
  const style: React.CSSProperties = { 
    position: 'fixed', 
    right: '435px', 
    top: position?.y ? Math.min(window.innerHeight - 500, Math.max(80, position.y - 120)) : '100px', 
    zIndex: 9999,
    width: '580px', // Wider for 2-column layout
    height: '480px'
  };

  const renderTree = (nodes: any, nodeId: string, depth = 0) => {
    return Object.values(nodes).map((node: any) => {
      const isSelected = activePath?.nodeId === nodeId && activePath?.path === node.fullPath;
      const hasChildren = Object.keys(node.children).length > 0;
      
      return (
        <div key={`${nodeId}-${node.fullPath}`} className="relative">
          {/* Hierarchical Trace Line */}
          {depth > 0 && (
            <div 
              className="absolute left-[-12px] top-0 bottom-0 w-px bg-border/40" 
              style={{ left: `${(depth - 1) * 12 + 10}px` }}
            />
          )}
          
          <div style={{ paddingLeft: `${depth * 12}px` }}>
            <button
              onMouseEnter={() => setActivePath({ nodeId, path: node.fullPath })}
              onClick={() => onSelect(nodeId, node.fullPath)}
              className={cn(
                "w-full flex items-center justify-between py-2 px-3 rounded-xl transition-all group/item mb-1 relative overflow-hidden",
                isSelected 
                  ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                  : "hover:bg-muted border border-transparent shadow-sm"
              )}
            >
              <div className="flex items-center gap-3 min-w-0 relative z-10">
                 {hasChildren ? (
                   <ChevronDown size={11} className={cn("transition-transform", isSelected ? "text-white/80" : "text-muted-foreground/40")} />
                 ) : (
                   <div className="w-2.5" />
                 )}
                 <div className={cn(
                   "size-6 rounded-lg flex items-center justify-center shrink-0 border transition-all",
                   isSelected ? "bg-white/20 border-white/20" : "bg-secondary border-border group-hover/item:border-indigo-500/30"
                 )}>
                   {hasChildren ? (
                     <Database size={12} className={isSelected ? "text-white" : "text-indigo-500"} />
                   ) : (
                     <Zap size={11} className={isSelected ? "text-white" : "text-emerald-500"} />
                   )}
                 </div>
                 <span className={cn(
                   "text-[11px] font-bold tracking-tight truncate leading-none",
                   isSelected ? "text-white" : "text-foreground/80 group-hover/item:text-foreground"
                 )}>
                   {node.name}
                 </span>
              </div>
              <span className={cn(
                "text-[7px] font-black uppercase tracking-widest leading-none opacity-0 group-hover/item:opacity-100 transition-opacity",
                isSelected ? "text-white/40" : "text-muted-foreground/20"
              )}>
                {hasChildren ? 'OBJECT' : 'SIGNAL'}
              </span>
            </button>
          </div>
          {hasChildren && renderTree(node.children, nodeId, depth + 1)}
        </div>
      );
    });
  };

  return (
    <motion.div 
      ref={containerRef}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      style={style}
      className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* ── Sidebar Title ── */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
             <SlidersHorizontal size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 leading-none">COMPONENT_EDITOR</span>
            <span className="text-[12px] font-black italic tracking-tighter text-foreground uppercase mt-1">
              {formatLabel(node?.data.label || 'Node')}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all border border-transparent hover:border-border">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* ── Left Pane: Navigator ── */}
        <div className="w-[240px] border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/40" size={12} />
              <input 
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search variables..."
                className="w-full bg-secondary border border-border rounded-lg py-2 pl-9 pr-3 text-[10px] font-medium text-foreground outline-none focus:border-indigo-500/40 transition-all placeholder:text-muted-foreground/40"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">
            {treeData.map(group => (
              <div key={group.id} className="space-y-2">
                <div className="flex items-center gap-3 px-1 mb-2">
                   <div className="h-px flex-1 bg-border" />
                   <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{group.name}</span>
                   <div className="h-px w-4 bg-border" />
                </div>
                {renderTree(group.children, group.id)}
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Pane: Inspector ── */}
        <div className="flex-1 bg-secondary flex flex-col">
          {activePath ? (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
               {/* Selection Title */}
               <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap size={14} className="text-emerald-500" />
                      <span className="text-[14px] font-black text-foreground tracking-tight uppercase">
                        {activePath.path.split('.').pop()}
                      </span>
                    </div>
                    <div className="inline-flex items-center px-2 py-0.5 rounded bg-muted border border-border">
                      <span className="text-[9px] font-mono text-muted-foreground">{activePath.path}</span>
                    </div>
                  </div>

                  {/* Variable Reference Card */}
                  <div className="bg-card border border-border rounded-2xl p-6 space-y-4 shadow-xl">
                     <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Protocol Signature</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                           <Database size={8} className="text-indigo-500" />
                           <span className="text-[7px] font-black text-indigo-500 uppercase tracking-widest leading-none">Dynamic Link</span>
                        </div>
                     </div>
                     <div className="p-4 bg-muted border border-border rounded-xl font-mono text-[13px] text-emerald-600 dark:text-emerald-400 group relative">
                        <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="opacity-40">{"{{"}</span>
                        <span className="px-1">{activePath.nodeId === 'skill_input' ? 'input' : activePath.nodeId}</span>
                        <span className="text-emerald-500/40">.</span>
                        <span>{activePath.path}</span>
                        <span className="opacity-40 ml-1">{"}}"}</span>
                     </div>
                  </div>

                  {/* Context Info */}
                  <div className="space-y-4 pt-4 border-t border-border">
                     <div className="flex items-center gap-3">
                        <Info size={14} className="text-muted-foreground/40" />
                        <span className="text-[10px] font-medium text-muted-foreground/60 italic">
                          Selecting this will map the live output of 
                          <span className="text-foreground font-bold px-1 uppercase tracking-tight">
                            {variables.find(v => v.nodeId === activePath.nodeId)?.nodeLabel || 'node'}
                          </span>
                          directly into this operative instance.
                        </span>
                     </div>
                  </div>
               </div>

               {/* Action Footer */}
               <div className="mt-auto p-8 bg-card border-t border-border shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-20">
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Target Mapping</span>
                        <span className="text-[11px] font-bold text-foreground truncate max-w-[150px]">{activePath.path}</span>
                     </div>
                     <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
                        <ShieldCheck size={18} />
                     </div>
                  </div>
                  <button 
                    onClick={() => onSelect(activePath.nodeId, activePath.path)}
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 rounded-[1.25rem] text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-[0.98] group/btn"
                  >
                    Save Selection
                    <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                  </button>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-30">
               <div className="size-16 rounded-2xl border border-dashed border-border flex items-center justify-center text-muted-foreground mb-4">
                  <Database size={32} />
               </div>
               <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]">Inspecting_Mesh...</p>
                  <p className="text-[9px] font-medium italic">Hover over available protocols to analyze data signature</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component: Unified Sidebar ───────────────────────────────────────

interface UnifiedSidebarProps {
  context: 'SKILL' | 'AGENT' | 'NODE';
  node?: any;
  nodes: any[];
  edges: any[];
  onClose: () => void;
  onUpdateNode: (data: any) => void;
  onDeleteNode: () => void;
  onTriggerNode?: (nodeId: string) => void;
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  inputSchema: InputParam[];
  onInputSchemaChange: (val: InputParam[]) => void;
  outputDescription: string;
  onOutputDescriptionChange: (val: string) => void;
  upstreamVariables?: { nodeId: string; nodeLabel: string; vars: string[] }[];
}

type TabType = 'setup' | 'settings' | 'debug';

export default function UnifiedSidebar({
  node,
  nodes,
  edges,
  onClose,
  onUpdateNode,
  onDeleteNode,
  onTriggerNode,
  name,
  onNameChange,
  description,
  onDescriptionChange,
  inputSchema,
  onInputSchemaChange,
  outputDescription,
  onOutputDescriptionChange,
  upstreamVariables = []
}: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('setup');
  
  const tool = useMemo(() => node ? getToolById(node.data.toolId) : null, [node]);
  const { data: pipedreamToolsData } = usePipedreamTools(
    node?.data.config?.appSlug,
    !!node?.data.config?.appSlug
  );

  const [nodeValues, setNodeValues] = useState<Record<string, any>>(() => {
    if (!node) return {};
    const cfg = node.data.config ?? {};
    return { label: node.data.label ?? '', ...cfg };
  });

  useEffect(() => {
    if (node) {
      const cfg = node.data.config ?? {};
      setNodeValues({ label: node.data.label ?? '', ...cfg });
    }
  }, [node]);

  const [showPicker, setShowPicker] = useState<{ 
    field: string; 
    type: 'textarea' | 'input'; 
    x?: number; 
    y?: number; 
    cursorPos?: number; 
  } | null>(null);

  useEffect(() => {
    setShowPicker(null);
  }, [node?.id]);

  const handleVariableSelect = (nodeId: string, varName: string) => {
    if (!showPicker) return;
    const { field, cursorPos } = showPicker;
    const currentVal = nodeValues[field] || '';
    
    // Normalize skill_input to 'input' for cleaner variable tags
    const displayNodeId = nodeId === 'skill_input' ? 'input' : nodeId;
    const variableTag = `{{${displayNodeId}.${varName}}}`;
    
    let combined: string;
    if (typeof cursorPos === 'number') {
      const prefix = currentVal.substring(0, Math.max(0, cursorPos - 2));
      const suffix = currentVal.substring(cursorPos);
      let finalSuffix = suffix;
      if (suffix.startsWith('}}')) {
        finalSuffix = suffix.substring(2);
      }
      combined = prefix + '{{ ' + nodeId + '.' + varName + ' }}' + finalSuffix;
    } else {
      combined = typeof currentVal === 'string' ? currentVal + variableTag : variableTag;
    }

    handleUpdate({ [field]: combined });
    setShowPicker(null);
  };

  const selectedTool = pipedreamToolsData?.find((t: any) => t.key === nodeValues.actionName || t.name === nodeValues.actionName);
  const toolSchema = selectedTool?.inputSchema || null;

  const handleUpdate = useCallback((updates: any) => {
    setNodeValues(prev => ({ ...prev, ...updates }));
    onUpdateNode(updates);
  }, [onUpdateNode]);

  const isPipedreamNode = node?.data.executionKey === 'pipedream_action';
  const isPreconfigured = isPipedreamNode && nodeValues.appSlug && nodeValues.actionName;
  const isSkillInput = node?.data.toolId === 'skill.input' || node?.id === 'skill_input' || node?.data.executionKey === 'trigger_manual';
  const isSkillOutput = node?.data.toolId === 'skill.output' || node?.id === 'skill_output' || node?.data.executionKey === 'skill_output';

  const isGateway = isSkillInput || isSkillOutput;
  const tabs = [
    { id: 'setup' as TabType, label: 'Protocol', icon: SlidersHorizontal },
    ... (isGateway ? [] : [
      { id: 'settings' as TabType, label: 'Authenticate', icon: ShieldCheck },
      { id: 'debug' as TabType, label: 'Execution', icon: Terminal }
    ])
  ];
  if (!node) return null;

  return (
    <div className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-[420px] bg-card border-l border-border/40 shadow-xl z-40 flex flex-col animate-in slide-in-from-right duration-500 overflow-visible font-inter">
      
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border/40 bg-card">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
             <SlidersHorizontal size={18} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 leading-none">COMPONENT_EDITOR</span>
            <span className="text-[12px] font-black italic tracking-tighter text-foreground uppercase mt-1">
              {formatLabel(node.data.label)}
            </span>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-all border border-transparent hover:border-border">
          <X size={16} className="text-muted-foreground" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-6 gap-6 bg-card border-b border-border/40">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative py-4 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2
              ${activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/60'}
            `}
          >
            <tab.icon size={14} strokeWidth={activeTab === tab.id ? 2.5 : 2} className={activeTab === tab.id ? 'text-indigo-500' : ''} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeSideTab"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              />
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-background/50">
        <div className="p-4 space-y-6">
          
          {/* Main Content Areas */}

        {activeTab === 'setup' && (
          <div className="p-4 pb-20 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {isSkillInput ? (
              <ContractEditor 
                mode="INPUT"
                inputSchema={inputSchema} 
                outputDescription={outputDescription}
                onChange={(s, o) => { onInputSchemaChange(s); onOutputDescriptionChange(o); }}
                // Genesis node: has no upstream variables to pick from
              />
            ) : isSkillOutput ? (
              <ContractEditor 
                mode="OUTPUT"
                inputSchema={inputSchema} 
                outputDescription={outputDescription}
                onChange={(s, o) => { onInputSchemaChange(s); onOutputDescriptionChange(o); }}
                onTriggerPicker={(pos, cursor) => setShowPicker({ field: 'output_description', type: 'input', ...pos, cursorPos: cursor })}
              />
            ) : (
              <div className="space-y-6">
                  {/* Header */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                       <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">NODE_CONFIG</span>
                       <div className="flex-1 h-px bg-border/40" />
                    </div>
                    <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Execution Parameters</h3>
                    <p className="text-[9px] text-muted-foreground font-medium italic">Configure node processing behavior</p>
                  </div>

                  {isPreconfigured ? (
                    <div className="bg-secondary/10 border border-border/40 rounded-xl p-5">
                      <DynamicParameterForm
                        schema={toolSchema || {}}
                        values={nodeValues}
                        onChange={handleUpdate}
                        onTriggerPicker={(fieldKey, pos, cursor) => setShowPicker({ field: fieldKey, type: 'input', ...pos, cursorPos: cursor })}
                      />
                    </div>
                  ) : isPipedreamNode ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-8 border border-dashed border-border rounded-2xl bg-secondary/30 shadow-inner">
                      <div className="w-12 h-12 rounded-xl bg-card border border-border/60 flex items-center justify-center text-muted-foreground/30 mb-6 shadow-sm">
                        <Lock size={20} />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-bold leading-relaxed italic px-6">
                        Registry authorization required. Activate credentials in the <span className="text-indigo-500 font-black tracking-widest uppercase ml-1">Registry</span> tab to unlock protocol parameters
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {tool?.configFields?.filter(f => !['notice', 'hidden'].includes(f.type)).map(field => (
                        <div key={field.key} className="space-y-2 relative group/field">
                          <div className="flex items-center justify-between px-1">
                            <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">{field.label}</label>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowPicker(showPicker?.field === field.key ? null : { field: field.key, type: (field.type === 'textarea' ? 'textarea' : 'input') });
                              }}
                              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 text-[8px] font-bold uppercase tracking-widest text-indigo-500 transition-all opacity-0 group-hover/field:opacity-100"
                            >
                              <Database size={8} />
                              Variable
                            </button>
                          </div>
                          
 
                          {field.type === 'textarea' ? (
                            <SmartInput
                              textarea
                              rows={4}
                              value={nodeValues[field.key] || ''}
                              onChange={(val) => handleUpdate({ [field.key]: val })}
                              variables={upstreamVariables}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              onTriggerPicker={(pos, cursor) => setShowPicker({ field: field.key, type: 'textarea', ...pos, cursorPos: cursor })}
                            />
                          ) : field.type === 'select' ? (
                            <SelectField 
                              value={nodeValues[field.key] || ''}
                              options={field.options || []}
                              onChange={(val) => handleUpdate({ [field.key]: val })}
                              placeholder={`Select ${field.label.toLowerCase()}...`}
                            />
                          ) : field.type === 'boolean' ? (
                             <CheckboxField 
                               value={nodeValues[field.key]}
                               label={field.label}
                               onChange={(val) => handleUpdate({ [field.key]: val })}
                             />
                          ) : (
                            <SmartInput
                              value={nodeValues[field.key] || ''}
                              onChange={(val) => handleUpdate({ [field.key]: val })}
                              variables={upstreamVariables}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              onTriggerPicker={(pos, cursor) => setShowPicker({ field: field.key, type: 'input', ...pos, cursorPos: cursor })}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="space-y-6">
                {/* Entity Identity */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                       <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                       <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest leading-none">ENTITY_ID</span>
                       <div className="flex-1 h-px bg-border/40" />
                    </div>
                    <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Identity Signature</h3>
                    <p className="text-[9px] text-muted-foreground/40 font-medium italic">Customise operative's visual heartbeat</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40 px-1">Protocol Label</label>
                    <SmartInput 
                      value={nodeValues.label || ''}
                      onChange={(val) => handleUpdate({ label: val })}
                      variables={upstreamVariables}
                      placeholder="Enter label..."
                      onTriggerPicker={(pos, cursor) => setShowPicker({ field: 'label', type: 'input', ...pos, cursorPos: cursor })}
                    />
                  </div>
                </div>

                {/* Security / Authentication */}
                {tool && (tool.category === 'Integrations' || ['Logic', 'Core', 'Data', 'Models'].includes(tool.category)) && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">AUTHENTICATE</span>
                        <div className="flex-1 h-px bg-emerald-500/10" />
                      </div>
                      <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Protocol Authentication</h3>
                      <p className="text-[9px] text-muted-foreground/40 font-medium italic">Grant access to internal platform data</p>
                    </div>
                    <div className="bg-emerald-500/[0.02] border border-emerald-500/20 rounded-xl p-5">
                      {isPipedreamNode ? (
                        <PipedreamNodeSettings
                          appSlug={nodeValues.appSlug || ''}
                          platformName={nodeValues.platformName}
                          actionName={nodeValues.actionName}
                          credentialId={nodeValues.credentialId}
                          onCredentialSelect={(credentialId) => handleUpdate({ credentialId })}
                        />
                      ) : (
                        <ManualCredentialSettings
                          type={
                            tool?.id === 'llm.gemini' ? 'google_api_key' :
                            tool?.id === 'llm.openai' ? 'openai_api_key' :
                            tool?.id === 'llm.claude' ? 'anthropic_api_key' : 
                            tool?.id === 'llm.openrouter' ? 'openrouter_api_key' : 
                            'http_bearer'
                          }
                          label={tool?.label || 'Protocol'}
                          credentialId={nodeValues.credentialId}
                          onCredentialSelect={(credentialId) => handleUpdate({ credentialId })}
                        />
                      )}
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="p-6 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <div className="space-y-6">
                <div className="space-y-1.5">
                   <div className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest leading-none">XEC_RUNTIME</span>
                      <div className="flex-1 h-px bg-emerald-500/10" />
                   </div>
                   <h3 className="text-[11px] font-bold text-foreground uppercase tracking-wider">Execution Stream</h3>
                   <p className="text-[9px] text-muted-foreground/40 font-medium italic">Real-time telemetry and data mirroring</p>
                </div>
                
                {onTriggerNode && (
                  <button
                    onClick={() => onTriggerNode(node.id)}
                    className="w-full h-11 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500 transition-all flex items-center justify-center gap-3 group/debug active:scale-[0.98]"
                  >
                    <div className="relative">
                      <Play size={14} fill="currentColor" className="group-hover/debug:scale-110 transition-transform relative z-10" />
                      <div className="absolute inset-0 bg-emerald-500/40 blur-md rounded-full opacity-0 group-hover/debug:opacity-100 transition-opacity" />
                    </div>
                    Test Logic Protocol
                  </button>
                )}

                {node.data.result ? (
                  <div className="space-y-3">
                    <div className="bg-secondary border border-border rounded-xl p-6 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 shadow-xl relative group overflow-hidden">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 blur-2xl" />
                       <div className="flex items-center justify-between mb-4 relative z-10">
                          <div className="flex items-center gap-2">
                             <div className="size-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                             <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">Live Output Mirror</span>
                          </div>
                          <CheckCircle size={12} className="text-emerald-500/40" />
                       </div>
                       <pre className="whitespace-pre-wrap break-words leading-relaxed overflow-x-auto custom-scrollbar relative z-10">
                          {JSON.stringify(node.data.result, null, 2)}
                       </pre>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-center gap-4 bg-foreground/[0.01] border border-dashed border-border/40 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/5 flex items-center justify-center text-indigo-500/10 relative">
                       <Zap size={24} />
                       <div className="absolute inset-0 rounded-xl border border-indigo-500/10 animate-pulse" />
                    </div>
                    <div className="space-y-1">
                       <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Waiting for Signal</p>
                       <p className="text-[9px] text-muted-foreground/20 font-medium italic">Telemetry data will materialize upon trigger</p>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}
      </div>
    </div>

      <AnimatePresence mode="wait">
        {showPicker && (
          <VariablePicker 
            key={showPicker.field}
            node={node}
            variables={upstreamVariables} 
            onSelect={handleVariableSelect} 
            onClose={() => setShowPicker(null)} 
            position={showPicker.x ? { x: showPicker.x, y: showPicker.y! } : undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
