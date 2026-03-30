'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, CheckSquare, Info, Link2, ChevronDown, Settings2, Database, Terminal, ShieldCheck, Activity, SlidersHorizontal, Copy, Check, Search, Globe, Loader2, Play, Zap, LogIn, ChevronLeft } from 'lucide-react';
import { getToolByExecutionKey, TOOL_REGISTRY, getToolById } from './toolRegistry';
import { useCredentials, useCreateCredential, useCredentialSchemas } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';

interface NodeConfigPanelProps {
  node: any;
  nodes: any[];
  edges: any[];
  onUpdate: (data: any) => void;
  onClose: () => void;
  onDelete: () => void;
  onTrigger?: (nodeId: string, inputOverride?: any) => void;
}

type TabType = 'input' | 'parameters' | 'output' | 'settings';

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const CustomSelect = ({ value, onChange, options, placeholder = 'Select...', disabled, isLoading }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o => 
    o.label.toLowerCase().includes(search.toLowerCase()) || 
    o.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] font-medium transition-all group cursor-pointer
          ${isOpen ? 'border-foreground/40 ring-2 ring-foreground/5' : 'hover:border-border/80'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className={!selectedOption ? 'text-muted/60' : 'text-foreground'}>
          {isLoading ? 'Loading...' : (selectedOption ? selectedOption.label : placeholder)}
        </span>
        <ChevronDown size={14} className={`text-muted transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-card border border-border/60 rounded-xl shadow-2xl p-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/40" size={12} />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full pl-8 pr-3 py-2 bg-foreground/[0.02] border border-border/20 rounded-lg text-[11px] outline-none focus:border-foreground/20"
            />
          </div>
          <div className="max-h-[200px] overflow-y-auto no-scrollbar space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.id}
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all text-[11px]
                    ${opt.id === value ? 'bg-foreground text-background font-bold' : 'hover:bg-foreground/[0.04] text-foreground/80'}
                  `}
                >
                  <span className="truncate pr-4">{opt.label}</span>
                  {opt.id === value && <Check size={12} />}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-[10px] text-muted italic">
                {placeholder || "No matches found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function NodeConfigPanel({ node, nodes, edges, onUpdate, onClose, onDelete, onTrigger }: NodeConfigPanelProps) {
  const tool = node.data.toolId 
    ? getToolById(node.data.toolId)
    : getToolByExecutionKey(node.data.executionKey);
  
  if (!tool) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = tool.icon as React.ComponentType<any>;
  const { data: allCredentials, refetch: refetchCreds } = useCredentials();
  const { data: credentialSchemas } = useCredentialSchemas();
  const createCredential = useCreateCredential();
  const [activeTab, setActiveTab] = useState<TabType>('parameters');

  // Inline Credential State
  const [isAddingCred, setIsAddingCred] = useState(false);
  const [newCredName, setNewCredName] = useState('');
  const [newCredData, setNewCredData] = useState<Record<string, string>>({});

  // Dynamic Models State
  const [dynamicModels, setDynamicModels] = useState<{id: string, label: string}[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const [values, setValues] = useState<Record<string, any>>(() => {
    const cfg = (node.data.config as Record<string, any>) ?? {};
    const base: Record<string, any> = {
      label:        node.data.label ?? '',
      description:  node.data.description ?? '',
      credentialId: cfg.credentialId ?? '',
    };
    if (!(tool as any).operationFields) {
      (tool.configFields as any).forEach((f: any) => { base[f.key] = cfg[f.key] ?? ''; });
      const selectedOperation = cfg.operation;
      if (selectedOperation && (tool as any).operationInputs) {
        const operationSchema = (tool as any).operationInputs[selectedOperation];
        if (operationSchema) {
          operationSchema.forEach((f: any) => { 
            if (cfg[f.key] !== undefined) base[f.key] = cfg[f.key];
            else if (f.default !== undefined) base[f.key] = f.default;
            else base[f.key] = '';
          });
        }
      }
    }
    return base;
  });

  const [operations, setOperations] = useState<Record<string, any>[]>(() => {
    const cfg = (node.data.config as Record<string, any>) ?? {};
    if (!(tool as any).operationFields) return [];
    if (Array.isArray(cfg.operations) && cfg.operations.length > 0) return cfg.operations;
    if (cfg.operation) {
      const opDefs = ((tool as any).operationFields as Record<string, any[]>)[cfg.operation] ?? [];
      const entry: Record<string, any> = { op: cfg.operation };
      opDefs.forEach((f: any) => { if (cfg[f.key] !== undefined) entry[f.key] = cfg[f.key]; });
      return [entry];
    }
    return [{ op: '' }];
  });

  const loadedNodeIdRef = useRef<string>(node.id);
  const lastSavedConfigJsonRef = useRef<string>(JSON.stringify(node.data.config));

  useEffect(() => {
    const currentConfigJson = JSON.stringify(node.data.config);
    const isNewNode = loadedNodeIdRef.current !== node.id;
    const isExternalUpdate = !isNewNode && lastSavedConfigJsonRef.current !== currentConfigJson;

    if (!isNewNode && !isExternalUpdate) return;
    
    loadedNodeIdRef.current = node.id;
    lastSavedConfigJsonRef.current = currentConfigJson;
    const cfg = (node.data.config as Record<string, any>) ?? {};
    const base: Record<string, any> = {
      label:        node.data.label ?? '',
      description:  node.data.description ?? '',
      credentialId: cfg.credentialId ?? '',
    };
    
    if (!(tool as any).operationFields) {
      (tool.configFields as any).forEach((f: any) => { base[f.key] = cfg[f.key] ?? ''; });
      const selectedOperation = cfg.operation;
      if (selectedOperation && (tool as any).operationInputs) {
        const operationSchema = (tool as any).operationInputs[selectedOperation];
        if (operationSchema) {
          operationSchema.forEach((f: any) => { 
            if (cfg[f.key] !== undefined) base[f.key] = cfg[f.key];
            else if (f.default !== undefined) base[f.key] = f.default;
            else base[f.key] = '';
          });
        }
      }
    }
    setValues(base);

    if ((tool as any).operationFields) {
      if (Array.isArray(cfg.operations) && cfg.operations.length > 0) {
        setOperations(cfg.operations);
      } else if (cfg.operation) {
        const opDefs = ((tool as any).operationFields as Record<string, any[]>)[cfg.operation] ?? [];
        const entry: Record<string, any> = { op: cfg.operation };
        opDefs.forEach((f: any) => { if (cfg[f.key] !== undefined) entry[f.key] = cfg[f.key]; });
        setOperations([entry]);
      } else {
        setOperations([{ op: '' }]);
      }
    }
  }, [node.id, tool, node.data.config]);

  useEffect(() => {
    const fetchModels = async () => {
      if (!values.credentialId) {
        setDynamicModels([]);
        return;
      }
      setIsLoadingModels(true);
      try {
        const apiModule = await import('@/lib/api');
        const api = apiModule.default || (apiModule as any).api;
        const { data } = await api.get(`/credentials/proxy/models?credentialId=${values.credentialId}`);
        setDynamicModels(data);
      } catch (err) {
        setDynamicModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };
    if (tool.category === 'Models' || tool.id.includes('llm')) fetchModels();
  }, [values.credentialId, tool.id, tool.category]);

  const set = (key: string, val: any) =>
    setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = useCallback((currentValues = values, currentOps = operations) => {
    const { label, description, ...rest } = currentValues;
    const config: Record<string, any> = { ...rest };
    if ((tool as any).operationFields) {
      config.operations = currentOps.filter(o => o.op);
    }
    lastSavedConfigJsonRef.current = JSON.stringify(config);
    onUpdate({ ...node.data, label, description, config });
  }, [tool, node.data, onUpdate, values, operations]);

  useEffect(() => {
    const timer = setTimeout(() => handleSave(), 800);
    return () => clearTimeout(timer);
  }, [values, operations, handleSave]);

  const allowedTypes = (tool as any).credentialTypes as string[] | undefined;
  const filteredCreds = allCredentials?.filter((c: any) => allowedTypes?.includes(c.type));
  const authState = useAuthStore();
  
  const handleConnectOAuth = (type: string) => {
    const token = authState.token;
    if (!token) return alert('You must be logged in to connect accounts.');
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    let url = '';
    if (type.startsWith('google_')) url = `${baseUrl}/credentials/oauth/google?token=${token}&toolId=${tool.id}`;
    else if (type.startsWith('slack_')) url = `${baseUrl}/credentials/oauth/slack?token=${token}`;
    
    if (url) {
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.outerHeight - height / 2;
      const popup = window.open(url, 'Connect Account', `width=${width},height=${height},left=${left},top=${top}`);
      const timer = setInterval(async () => {
        if (popup?.closed) {
          clearInterval(timer);
          setIsAddingCred(false);
          const result = await refetchCreds();
          if (result.data) {
            const freshCreds = result.data as any[];
            const matching = freshCreds
              .filter((c: any) => allowedTypes?.includes(c.type))
              .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            if (matching[0] && !values.credentialId) set('credentialId', matching[0].id);
          }
        }
      }, 1000);
    }
  };

  return (
    <aside className="w-[450px] shrink-0 bg-background border-l border-border flex flex-col h-full font-inter z-50 shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex flex-col border-b border-border/60 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
           <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-border/40 ${tool.bg}`}>
                {typeof tool.icon === 'string' ? (
                  <img src={tool.icon} alt={tool.label} className="w-5 h-5 object-contain" />
                ) : (
                  <Icon size={18} className={tool.color} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-foreground leading-none">{values.label || tool.label}</span>
                <span className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 opacity-40">{tool.category} Node</span>
              </div>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={onClose} className="p-2 text-muted hover:text-foreground hover:bg-foreground/5 rounded-full transition-all">
                <X size={20} />
             </button>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-4 overflow-x-auto no-scrollbar scroll-smooth">
          {(['input', 'parameters', 'output', 'settings'] as TabType[])
            .filter(t => {
              if (tool.isTrigger) {
                return t === 'parameters' || t === 'output';
              }
              if (t === 'input') return tool.inputs.length > 0;
              return true;
            })
            .map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all shrink-0
                ${activeTab === tab 
                  ? 'border-foreground text-foreground' 
                  : 'border-transparent text-muted opacity-40 hover:opacity-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          {activeTab === 'input' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">
                <LogIn size={12} />
                Incoming References
              </div>
              {(() => {
                const incoming = edges.filter(e => e.target === node.id)
                  .map(e => ({ edge: e, src: nodes.find(n => n.id === e.source) }))
                  .filter(x => x.src);
                if (incoming.length === 0) return (
                  <div className="p-10 border border-dashed border-border/40 rounded-2xl text-center">
                     <Database size={24} className="mx-auto text-muted/20 mb-3" />
                     <p className="text-[11px] text-muted/50 font-medium">No active connections.</p>
                  </div>
                );
                return (
                  <div className="space-y-4">
                    {incoming.map(({ src }, idx) => (
                      <div key={idx} className="p-4 bg-foreground/[0.015] border border-border/40 rounded-xl">
                         <div className="flex items-center gap-2 mb-3">
                            <span className="text-[11px] font-bold text-foreground">{src.data.label} (Output)</span>
                         </div>
                         <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-emerald-400">
                            {src.data.result ? JSON.stringify(src.data.result, null, 2) : 'Waiting for execution...'}
                         </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-6">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">
                    <SlidersHorizontal size={12} />
                    Pipeline Inputs
                  </div>
                  {onTrigger && tool.executionKey !== 'sticky_note' && (
                    <button onClick={() => onTrigger(node.id)} className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white rounded-lg text-[10px] font-black hover:opacity-90 transition-all shadow-lg">
                      <Play size={10} fill="currentColor" /> RUN STEP
                    </button>
                  )}
               </div>

               <div className="space-y-6">
                  {/* Global Notices */}
                  {tool.configFields.filter((f: any) => f.type === 'notice').map((f: any) => (
                    <div key={f.key} className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3 italic">
                      <Info size={16} className="text-blue-500 shrink-0" />
                      <p className="text-[11px] text-blue-500/80 font-medium">{f.label}</p>
                    </div>
                  ))}

                  {/* Multi-step / Operation Fields */}
                  {(tool as any).operationFields ? operations.map((opState, idx) => (
                    <div key={idx} className="space-y-4">
                      {/* Operational Inputs Only */}
                      {opState.op && (((tool as any).operationFields as any)[opState.op] || []).map((field: any) => (
                         <div key={field.key} className="space-y-2">
                           <label className="text-[10px] font-bold text-muted/60 uppercase ml-1 flex items-center gap-1">
                             {field.label}
                             {field.required ? (
                               <span className="text-red-500 font-black ml-0.5">*</span>
                             ) : (
                               <span className="text-muted/30 font-medium ml-1 text-[8px] lowercase">(optional)</span>
                             )}
                           </label>
                           {field.type === 'textarea' ? (
                             <textarea value={opState[field.key] ?? ''} onChange={e => setOperations(ops => ops.map((o,i) => i === idx ? {...o, [field.key]: e.target.value} : o))} rows={4} className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none" placeholder={field.placeholder || `Enter ${field.label}...`} />
                           ) : (
                             <input value={opState[field.key] ?? ''} onChange={e => setOperations(ops => ops.map((o,i) => i === idx ? {...o, [field.key]: e.target.value} : o))} className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none" placeholder={field.placeholder || `Enter ${field.label}...`} />
                           )}
                         </div>
                      ))}
                    </div>
                  )) : (() => {
                    const fields = [...(tool.configFields as any)];
                    const selectedOp = values.operation;
                    if (selectedOp && (tool as any).operationInputs?.[selectedOp]) {
                      (tool as any).operationInputs[selectedOp].forEach((f: any) => {
                        if (!fields.find(cf => cf.key === f.key)) fields.push(f);
                      });
                    }
                    return fields
                      .filter((f: any) => !['notice', 'hidden', 'operation', 'resource', 'width', 'height'].includes(f.key))
                      .map(field => {
                        // SPECIAL: For Model nodes, use dynamic options if available
                        let options = field.options || [];
                        if (field.key === 'model' && dynamicModels.length > 0) {
                           options = dynamicModels;
                        }

                        return (
                          <div key={field.key} className="space-y-2">
                            <label className="text-[10px] font-bold text-muted/60 uppercase ml-1 flex items-center gap-1">
                              {field.label}
                              {field.required ? (
                                <span className="text-red-500 font-black ml-0.5">*</span>
                              ) : (
                                <span className="text-muted/30 font-medium ml-1 text-[8px] lowercase">(optional)</span>
                              )}
                              {field.key === 'model' && isLoadingModels && <Loader2 size={10} className="animate-spin ml-2 text-blue-500" />}
                            </label>
                            {field.type === 'textarea' || field.type === 'chat_test' ? (
                              <textarea 
                                value={values[field.key] ?? ''} 
                                onChange={e => set(field.key, e.target.value)} 
                                rows={4} 
                                className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none focus:border-foreground/20 transition-all font-medium custom-scrollbar" 
                                placeholder={field.placeholder || `Enter ${field.label}...`} 
                              />
                            ) : field.type === 'boolean' ? (
                              <button
                                onClick={() => set(field.key, !values[field.key])}
                                className={`
                                  flex items-center gap-3 w-full px-4 py-3 border rounded-xl transition-all
                                  ${values[field.key] 
                                    ? 'bg-foreground/5 border-foreground/20 text-foreground' 
                                    : 'bg-transparent border-border/40 text-muted/60 hover:border-border/80'}
                                `}
                              >
                                <div className={`w-10 h-5 rounded-full relative transition-all ${values[field.key] ? 'bg-foreground' : 'bg-muted/20'}`}>
                                  <div className={`absolute top-1 w-3 h-3 bg-background rounded-full transition-all ${values[field.key] ? 'right-1' : 'left-1'}`} />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest leading-none mt-0.5">
                                  {values[field.key] ? 'Enabled' : 'Disabled'}
                                </span>
                              </button>
                            ) : (field.type === 'select' || (field.key === 'model')) ? (
                                !values.credentialId && field.key === 'model' ? (
                                  <button 
                                    onClick={() => setActiveTab('settings')}
                                    className="w-full px-4 py-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] font-black uppercase text-blue-500 flex items-center justify-center gap-2 transition-all group"
                                  >
                                    <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                                    Link API Key to Load Models
                                  </button>
                                ) : (
                                  <CustomSelect 
                                    value={values[field.key] ?? ''} 
                                    onChange={val => set(field.key, val)} 
                                    placeholder={isLoadingModels && field.key === 'model' ? "Loading models..." : (field.placeholder || `Select ${field.label.toLowerCase()}...`)}
                                    options={(options || []).map((o: any) => {
                                      const id = typeof o === 'string' ? o : (o.value || o.id);
                                      const lab = typeof o === 'string' ? o : (o.label || o.name || id);
                                      return { id, label: lab };
                                    })} 
                                  />
                                )
                            ) : (
                              <input value={values[field.key] ?? ''} onChange={e => set(field.key, e.target.value)} className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none" placeholder={field.placeholder || `Enter ${field.label}...`} />
                            )}
                          </div>
                        );
                      });
                  })()}
               </div>
               
               {/* Identity & Danger for Triggers (since Settings tab is hidden) */}
               {tool.isTrigger && (
                 <div className="pt-10 space-y-10 border-t border-border/40 mt-10">
                   <div className="space-y-4">
                     <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                       <Activity size={12} />
                       Node Information
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">Visible Label</label>
                       <input value={values.label ?? ''} onChange={e => set('label', e.target.value)} className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none focus:border-foreground/40 transition-all font-bold" />
                     </div>
                   </div>
                   
                   <button onClick={onDelete} className="w-full py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Remove Trigger</button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'output' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">
                <Terminal size={12} />
                Live Response data
              </div>
              {node.data.result ? (
                <div className="bg-[#0a0a0a] rounded-xl p-6 border border-white/5 font-mono text-[11px] overflow-auto max-h-[500px]">
                  <pre className="text-emerald-400/90 leading-relaxed whitespace-pre-wrap">
                    {JSON.stringify(node.data.result, null, 2)}
                  </pre>
                </div>
              ) : <div className="p-20 text-center text-[10px] font-bold text-muted opacity-30 uppercase tracking-widest">Execute step to see results</div>}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {/* Identity */}
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                    <Activity size={12} />
                    Node Information
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">Visible Label</label>
                      <input value={values.label ?? ''} onChange={e => set('label', e.target.value)} className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none focus:border-foreground/40 transition-all font-bold" />
                    </div>
                  </div>
               </div>

               {/* Auth */}
               <div className="space-y-4 border-t border-border/40 pt-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                    <ShieldCheck size={12} />
                    Authentication
                  </div>
                  <div className="p-4 bg-foreground/[0.01] border border-border/40 rounded-xl space-y-4">
                    {(() => {
                      const firstType = tool.credentialTypes?.[0];
                      const isOAuth = !!(firstType?.includes('_oauth'));
                      return isAddingCred ? (
                        <div className="space-y-4">
                          {isOAuth ? (
                            <button 
                              onClick={() => handleConnectOAuth(firstType!)} 
                              className="w-full py-3 bg-foreground text-background rounded-xl text-[11px] font-black uppercase shadow-lg shadow-foreground/10 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                              Authorize via OAuth
                            </button>
                          ) : (
                            <div className="space-y-4 pt-2">
                              {/* Name it */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-bold text-muted/60 uppercase ml-1">Key Label (Internal)</label>
                                <input 
                                  value={newCredName} 
                                  onChange={e => setNewCredName(e.target.value)} 
                                  placeholder="e.g. My OpenAI Key"
                                  className="w-full px-4 py-2.5 bg-foreground/[0.03] border border-border/40 rounded-xl text-[11px] outline-none"
                                />
                              </div>
                              
                              {/* Inputs from schema */}
                              {firstType && credentialSchemas?.[firstType]?.fields.map((f: any) => (
                                <div key={f.key} className="space-y-1.5">
                                  <label className="text-[9px] font-bold text-muted/60 uppercase ml-1">{f.label}</label>
                                  <input 
                                    type={f.type === 'password' ? 'password' : 'text'}
                                    value={newCredData[f.key] ?? ''} 
                                    onChange={e => setNewCredData(prev => ({ ...prev, [f.key]: e.target.value }))} 
                                    placeholder={f.placeholder}
                                    className="w-full px-4 py-2.5 bg-foreground/[0.03] border border-border/40 rounded-xl text-[11px] outline-none focus:border-foreground/20 transition-colors"
                                  />
                                </div>
                              ))}

                              <button 
                                onClick={async () => {
                                  if (!newCredName || !firstType) return;
                                  await createCredential.mutateAsync({
                                    name: newCredName,
                                    type: firstType,
                                    data: newCredData
                                  });
                                  setIsAddingCred(false);
                                  setNewCredName('');
                                  setNewCredData({});
                                  refetchCreds();
                                }}
                                disabled={createCredential.isPending}
                                className="w-full py-2.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                              >
                                {createCredential.isPending ? 'Saving...' : 'Save Credential'}
                              </button>
                            </div>
                          )}
                          <button onClick={() => setIsAddingCred(false)} className="w-full text-center text-[10px] text-muted italic hover:text-foreground transition-colors">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <CustomSelect 
                           value={values.credentialId} 
                           onChange={val => set('credentialId', val)} 
                           options={filteredCreds?.map((c: any) => ({ id: c.id, label: c.name })) || []} 
                           placeholder="Select credential..."
                          />
                          <button onClick={() => setIsAddingCred(true)} className="text-[10px] font-black text-foreground/40 hover:text-foreground uppercase text-center">+ Add New Credential</button>
                        </div>
                      );
                    })()}
                  </div>
               </div>

               {/* Danger */}
               <div className="pt-10 border-t border-border/40">
                  <button onClick={onDelete} className="w-full py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Remove Node from canvas</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
