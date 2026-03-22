'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Trash2, CheckSquare, Info, Link2, ChevronDown, Settings2, Database, Terminal, ShieldCheck, Activity, SlidersHorizontal, Copy, Check, Search, Globe, Loader2, Play, Zap, LogIn } from 'lucide-react';
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
              <div className="px-3 py-4 text-center text-[10px] text-muted italic">No matches found</div>
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
    // For tools WITHOUT operationFields, load configFields normally
    if (!(tool as any).operationFields) {
      (tool.configFields as any).forEach((f: any) => { base[f.key] = cfg[f.key] ?? ''; });
    }
    return base;
  });

  // Multi-step operations state (for Google tools with operationFields)
  const [operations, setOperations] = useState<Record<string, any>[]>(() => {
    const cfg = (node.data.config as Record<string, any>) ?? {};
    if (!(tool as any).operationFields) return [];
    // New format: array
    if (Array.isArray(cfg.operations) && cfg.operations.length > 0) return cfg.operations;
    // Legacy format: single flat operation
    if (cfg.operation) {
      const opDefs = ((tool as any).operationFields as Record<string, any[]>)[cfg.operation] ?? [];
      const entry: Record<string, any> = { op: cfg.operation };
      opDefs.forEach((f: any) => { if (cfg[f.key] !== undefined) entry[f.key] = cfg[f.key]; });
      return [entry];
    }
    return [{ op: '' }];
  });

  useEffect(() => {
    const cfg = (node.data.config as Record<string, any>) ?? {};
    const base: Record<string, any> = {
      label:        node.data.label ?? '',
      description:  node.data.description ?? '',
      credentialId: cfg.credentialId ?? '',
    };
    if (!(tool as any).operationFields) {
      (tool.configFields as any).forEach((f: any) => { base[f.key] = cfg[f.key] ?? ''; });
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
  }, [node.id, tool]);

  // Fetch dynamic models when credential changes
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
        console.error('Failed to fetch models:', err);
        setDynamicModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    if (tool.category === 'Models') {
      fetchModels();
    }
  }, [values.credentialId, tool.category]);

  const set = (key: string, val: any) =>
    setValues(prev => ({ ...prev, [key]: val }));

  const handleSave = useCallback(() => {
    const { label, description, ...rest } = values;
    const config: Record<string, any> = { ...rest };
    if ((tool as any).operationFields) {
      // Multi-step format: save operations array, drop any legacy flat fields
      config.operations = operations.filter(o => o.op); // skip empty steps
    }
    onUpdate({ ...node.data, label, description, config });
    onClose();
  }, [values, operations, tool, node.data, onUpdate, onClose]);

  const handleAddCred = async () => {
    if (!newCredName || !tool.credentialTypes?.[0]) return;
    
    try {
      const res = await createCredential.mutateAsync({
        name: newCredName,
        type: tool.credentialTypes[0],
        data: newCredData
      });
      
      if (res && res.id) {
        set('credentialId', res.id);
        setIsAddingCred(false);
        setNewCredName('');
        setNewCredData({});
        await refetchCreds();
      }
    } catch (err) {
      console.error('Failed to add credential:', err);
      alert('Error saving credentials. Please try again.');
    }
  };

  const allowedTypes = (tool as any).credentialTypes as string[] | undefined;
  const filteredCreds = allCredentials?.filter((c: any) => 
    allowedTypes?.includes(c.type)
  );

  const authState = useAuthStore();
  
  const handleConnectOAuth = (type: string) => {
    const token = authState.token;
    if (!token) return alert('You must be logged in to connect accounts.');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    let url = '';
    
    if (type.startsWith('google_')) {
      url = `${baseUrl}/credentials/oauth/google?token=${token}&toolId=${tool.id}`;
    } else if (type.startsWith('slack_')) {
      url = `${baseUrl}/credentials/oauth/slack?token=${token}`;
    }

    if (url) {
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.outerHeight - height / 2; // Adjusted top calculation
      
      const popup = window.open(
        url,
        'Connect Account',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      // Poll for closure to refresh creds and auto-select the new credential
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
            const newest = matching[0];
            if (newest && !values.credentialId) {
              set('credentialId', newest.id);
            }
          }
        }
      }, 1000);
    }
  };

  return (
    <div className="w-[450px] shrink-0 bg-background border-l border-border flex flex-col h-full font-inter z-50">

      {/* Panel header */}
      <div className="flex flex-col border-b border-border/60">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
           <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tool.bg}`}>
                {typeof tool.icon === 'string' ? (
                  <img src={tool.icon} alt={tool.label} className="w-4 h-4 object-contain" />
                ) : (
                  <Icon size={16} className={tool.color} />
                )}
              </div>
              <span className="text-[12px] font-bold text-foreground">{values.label || tool.label}</span>
              {node.data.status === 'running' && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md animate-pulse">
                  <Loader2 size={10} className="text-blue-500 animate-spin" />
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Executing</span>
                </div>
              )}
           </div>
           <div className="flex items-center gap-2">
             <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-foreground text-background rounded-lg text-[10px] font-black uppercase tracking-wider hover:opacity-90 transition-all"
            >
              Save
            </button>
             <button
              onClick={onClose}
              className="p-1.5 text-muted hover:text-foreground transition-all"
            >
              <X size={18} />
            </button>
           </div>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-4 overflow-x-auto no-scrollbar">
          {(['input', 'parameters', 'output', 'settings'] as TabType[])
            .filter(t => t !== 'input' || tool.inputs.length > 0)
            .map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all
                ${activeTab === tab 
                  ? 'border-foreground text-foreground' 
                  : 'border-transparent text-muted opacity-40 hover:opacity-100 hover:border-border'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="p-6">
          {activeTab === 'input' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                <LogIn size={12} />
                Incoming Data Sources
              </div>
              
              {(() => {
                const incoming = edges.filter(e => e.target === node.id)
                  .map(e => ({ edge: e, src: nodes.find(n => n.id === e.source) }))
                  .filter(x => x.src);

                if (incoming.length === 0) {
                  return (
                    <div className="p-8 border border-dashed border-border/40 rounded-2xl text-center">
                       <Database size={24} className="mx-auto text-muted/20 mb-3" />
                       <p className="text-[11px] text-muted/60 font-medium">No active connections found.</p>
                       <p className="text-[9px] text-muted/40 mt-1 uppercase tracking-widest font-bold">Connect a node to see its output here</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    {incoming.map(({ edge, src }, idx) => (
                      <div key={idx} className="p-4 bg-foreground/[0.015] border border-border/40 rounded-xl space-y-3">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                               <div className="w-5 h-5 rounded bg-foreground/5 flex items-center justify-center text-[10px] font-mono">
                                  {idx + 1}
                               </div>
                               <span className="text-[11px] font-bold text-foreground">{src.data.label}</span>
                               <span className="text-[9px] px-1.5 py-0.5 bg-muted/10 rounded border border-border/20 text-muted/60 uppercase font-black tracking-tighter">
                                  {edge.targetHandle || 'input'}
                               </span>
                            </div>
                            <span className="text-[9px] font-bold text-muted/40 uppercase tracking-widest">
                               From {edge.sourceHandle || 'output'}
                            </span>
                         </div>

                         {src.data.result ? (
                           <div className="p-3 bg-black/40 rounded-lg border border-white/5 max-h-[200px] overflow-y-auto no-scrollbar">
                              <pre className="text-[10px] text-emerald-500/90 font-mono leading-relaxed whitespace-pre-wrap">
                                 {JSON.stringify(src.data.result, null, 2)}
                              </pre>
                           </div>
                         ) : (
                           <div className="p-3 bg-foreground/[0.02] rounded-lg border border-border/20 text-center">
                              <span className="text-[9px] font-bold text-muted/40 uppercase tracking-widest italic">Waiting for execution...</span>
                           </div>
                         )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'parameters' && (
            <div className="space-y-8">
              {/* Identity Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                  <Activity size={12} />
                  Node Information
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">Label</label>
                    <input
                      value={values.label ?? ''}
                      onChange={e => set('label', e.target.value)}
                      className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] font-medium outline-none focus:border-foreground/40 transition-all"
                      placeholder="Enter node label..."
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Config Fields */}
              <div className="flex items-center justify-between pt-6 border-t border-border/40">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                  <SlidersHorizontal size={12} />
                  Parameters
                </div>
                {onTrigger && (
                  <button
                    onClick={() => onTrigger(node.id)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-[#f04e3a] text-white rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-[#ff5d4a] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg shadow-[#f04e3a]/20"
                  >
                    <Play size={10} fill="currentColor" />
                    Execute step
                  </button>
                )}
              </div>
              
              <div className="space-y-6">
                {allowedTypes && allowedTypes.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-bold text-muted/60 uppercase">Authentication</label>
                      {!isAddingCred && (
                        <button 
                          onClick={() => setIsAddingCred(true)}
                          className="text-[9px] font-black text-foreground hover:underline uppercase tracking-widest"
                        >
                          + Connect New
                        </button>
                      )}
                    </div>

                    {isAddingCred ? (
                      <div className="p-4 bg-foreground/[0.03] border border-dashed border-border/60 rounded-xl space-y-4 animate-in slide-in-from-top-2 duration-300">
                        {tool.credentialTypes?.[0]?.startsWith('google_') || tool.credentialTypes?.[0]?.startsWith('slack_') ? (
                          <div className="space-y-4 py-2">
                            <p className="text-[10px] text-muted font-medium text-center px-4">
                              You'll be redirected to {tool.credentialTypes[0].includes('google') ? 'Google' : 'Slack'} to securely authorize Aether.
                            </p>
                            <button
                              onClick={() => {
                                if (tool.credentialTypes && tool.credentialTypes[0]) {
                                  handleConnectOAuth(tool.credentialTypes[0]);
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-xl text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-all"
                            >
                              <Globe size={14} />
                              Continue with {tool.credentialTypes[0].includes('google') ? 'Google' : 'Slack'}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Account Display Name</label>
                                <input
                                  type="text"
                                  value={newCredName}
                                  onChange={e => setNewCredName(e.target.value)}
                                  placeholder="e.g. My Production DB"
                                  className="w-full px-3 py-2 bg-background border border-border/40 rounded-xl text-[11px] outline-none focus:border-foreground/40 transition-all font-bold"
                                />
                              </div>

                              {/* Schema-aware fields */}
                              {(() => {
                                const type = tool.credentialTypes?.[0];
                                if (!type) return null;

                                // OAuth Logic
                                if (type.includes('oauth')) {
                                  const provider = type.includes('google') ? 'google' : 'slack';
                                  return (
                                    <button 
                                      onClick={() => {
                                        const width = 600;
                                        const height = 700;
                                        const left = window.screenX + (window.outerWidth - width) / 2;
                                        const top = window.screenY + (window.outerHeight - height) / 2;
                                        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                                        
                                        window.open(
                                          `${apiBase}/credentials/oauth/${provider}`,
                                          `Connect ${provider}`,
                                          `width=${width},height=${height},left=${left},top=${top}`
                                        );
                                        
                                        // Auto close and refresh after a delay (simulating successful OAuth flow)
                                        setTimeout(() => {
                                          refetchCreds();
                                          setIsAddingCred(false);
                                        }, 4000);
                                      }}
                                      className="w-full flex items-center justify-center gap-3 py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all"
                                    >
                                      <LogIn size={14} strokeWidth={3} />
                                      Authorize with {provider === 'google' ? 'Google' : 'Slack'}
                                    </button>
                                  );
                                }

                                // Standard Fields
                                const schema = credentialSchemas?.[type];
                                if (!schema) {
                                  // Fallback to single API Key if schema not loaded or defined
                                  return (
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Secret Key</label>
                                      <input
                                        type="password"
                                        value={newCredData.apiKey || ''}
                                        onChange={e => setNewCredData({ ...newCredData, apiKey: e.target.value })}
                                        placeholder="API Key (sk-...)"
                                        className="w-full px-3 py-2 bg-background border border-border/40 rounded-xl text-[11px] outline-none focus:border-foreground/40 transition-all font-medium"
                                      />
                                    </div>
                                  );
                                }

                                return schema.fields.map((f: any) => (
                                  <div key={f.key} className="space-y-1.5">
                                    <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">{f.label}</label>
                                    <input
                                      type={f.type === 'password' || f.key.toLowerCase().includes('key') || f.key.toLowerCase().includes('secret') ? 'password' : 'text'}
                                      value={newCredData[f.key] || ''}
                                      onChange={e => setNewCredData({ ...newCredData, [f.key]: e.target.value })}
                                      placeholder={f.placeholder || `Enter ${f.label.toLowerCase()}...`}
                                      className="w-full px-3 py-2 bg-background border border-border/40 rounded-xl text-[11px] outline-none focus:border-foreground/40 transition-all font-medium"
                                    />
                                  </div>
                                ));
                              })()}
                            </div>
                            
                            {tool.credentialTypes?.[0] && !tool.credentialTypes[0]?.includes('oauth') && (
                              <div className="flex items-center gap-2 pt-2">
                                <button
                                  onClick={handleAddCred}
                                  disabled={createCredential.isPending}
                                  className="flex-1 py-3 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-40 transition-all shadow-xl shadow-foreground/5"
                                >
                                  {createCredential.isPending ? 'Validating...' : 'Verify & Establish_Link'}
                                </button>
                              </div>
                            )}
                          </>
                        )}
                        <div className="pt-1 border-t border-border/20">
                          <button
                            onClick={() => setIsAddingCred(false)}
                            className="w-full py-2 text-[10px] font-black uppercase text-muted hover:text-foreground transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <CustomSelect
                        value={values.credentialId ?? ''}
                        onChange={val => set('credentialId', val)}
                        options={(filteredCreds || []).map((c: any) => ({ id: c.id, label: c.name }))}
                        placeholder="Select a credential..."
                      />
                    )}
                    
                    {!isAddingCred && (!filteredCreds || filteredCreds.length === 0) && (
                      <div className="px-4 py-3 bg-red-500/5 border border-red-500/10 rounded-xl">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight">
                          No {tool.label} accounts linked. Please connect one to proceed.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Multi-step operations (Google tools) ── */}
                {(tool as any).operationFields ? (() => {
                  const allOpOptions = (tool.configFields.find((f: any) => f.key === 'operation') as any)?.options ?? [];
                  const opFieldMap = (tool as any).operationFields as Record<string, any[]>;
                  return (
                    <div className="space-y-3">
                      {/* Template variable hint */}
                      <div className="px-3 py-2.5 bg-foreground/[0.02] border border-border/30 rounded-xl">
                        <p className="text-[9px] text-muted/50 font-mono leading-relaxed">
                          Use <span className="text-foreground/40 font-bold">{'{{ nodes.NodeLabel.field }}'}</span> to pass data from other nodes.<br />
                          e.g. <span className="text-foreground/30">{'{{ nodes.Agent.email_to }}'}</span> · <span className="text-foreground/30">{'{{ incoming.message }}'}</span>
                        </p>
                      </div>

                      {operations.map((opState, idx) => (
                        <div key={idx} className="rounded-xl border border-border/40 bg-foreground/[0.015] p-4 space-y-3">
                          {/* Step header */}
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted/40">
                              Step {idx + 1}
                            </span>
                            {operations.length > 1 && (
                              <button
                                onClick={() => setOperations(ops => ops.filter((_, i) => i !== idx))}
                                className="text-muted/40 hover:text-red-400 transition-colors p-0.5"
                              >
                                <X size={11} />
                              </button>
                            )}
                          </div>

                          {/* Resource selector (if defined in tool) */}
                          {(() => {
                            const resField = tool.configFields.find((f: any) => f.key === 'resource');
                            if (!resField) return null;
                            return (
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">Resource</label>
                                <CustomSelect
                                  value={opState.resource || (resField.options?.[0] || '')}
                                  onChange={val => setOperations(ops => ops.map((o, i) =>
                                    i === idx ? { ...o, resource: val } : o
                                  ))}
                                  options={(resField.options || []).map((o: any) => 
                                    typeof o === 'string' ? { id: o, label: o } : { id: o.value, label: o.label }
                                  )}
                                  placeholder="Select resource..."
                                />
                              </div>
                            );
                          })()}

                          {/* Operation selector */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">Operation</label>
                            <CustomSelect
                              value={opState.op || ''}
                              onChange={val => setOperations(ops => ops.map((o, i) =>
                                i === idx ? { ...o, op: val } : o
                              ))}
                              options={allOpOptions.map((o: any) => 
                                typeof o === 'string' ? { id: o, label: o } : { id: o.value, label: o.label }
                              )}
                              placeholder="Select operation..."
                            />
                          </div>

                          {/* Operation-specific fields */}
                          {opState.op && (opFieldMap[opState.op] || []).map((field: any) => (
                            <div key={field.key} className="space-y-1.5">
                              <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">{field.label}</label>
                              {field.type === 'select' ? (
                                <CustomSelect
                                  value={opState[field.key] ?? ''}
                                  onChange={val => setOperations(ops => ops.map((o, i) =>
                                    i === idx ? { ...o, [field.key]: val } : o
                                  ))}
                                  options={(field.options || []).map((o: any) => 
                                    typeof o === 'string' ? { id: o, label: o } : { id: o.value, label: o.label }
                                  )}
                                  placeholder={`Select ${field.label}...`}
                                />
                              ) : field.type === 'textarea' ? (
                                <textarea
                                  value={opState[field.key] ?? ''}
                                  onChange={e => setOperations(ops => ops.map((o, i) =>
                                    i === idx ? { ...o, [field.key]: e.target.value } : o
                                  ))}
                                  rows={4}
                                  placeholder={field.placeholder}
                                  className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] font-mono outline-none focus:border-foreground/40 transition-all resize-none leading-relaxed"
                                />
                              ) : (
                                <input
                                  value={opState[field.key] ?? ''}
                                  onChange={e => setOperations(ops => ops.map((o, i) =>
                                    i === idx ? { ...o, [field.key]: e.target.value } : o
                                  ))}
                                  placeholder={field.placeholder || 'Enter value or {{ nodes.NodeLabel.field }}...'}
                                  className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] font-medium outline-none focus:border-foreground/40 transition-all"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}

                      <button
                        onClick={() => setOperations(ops => [...ops, { op: '' }])}
                        className="w-full py-2.5 border border-dashed border-border/40 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground hover:border-border/80 transition-all"
                      >
                        + Add Operation Step
                      </button>
                    </div>
                  );
                })() : (
                  /* ── Regular configFields (Agent, Models, Triggers) ── */
                  (tool.configFields as any).map((field: any) => (
                    <div key={field.key} className="space-y-2">
                       {field.type !== 'notice' && (
                        <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">{field.label}</label>
                      )}
                      {field.type === 'select' ? (
                        <CustomSelect
                          value={values[field.key] ?? ''}
                          onChange={val => set(field.key, val)}
                          isLoading={isLoadingModels && field.key === 'model'}
                          disabled={isLoadingModels && field.key === 'model'}
                          placeholder={isLoadingModels ? 'Loading models...' : `Select ${field.label}...`}
                          options={
                            field.key === 'model'
                              ? [
                                  ...(values[field.key] && !dynamicModels.find(m => m.id === values[field.key])
                                    ? [{ id: values[field.key], label: values[field.key] }]
                                    : []),
                                  ...dynamicModels
                                ]
                              : (field.options || []).map((o: any) => 
                                  typeof o === 'string' ? { id: o, label: o } : { id: o.value, label: o.label }
                                )
                          }
                        />
                      ) : field.type === 'textarea' ? (
                        <textarea
                          value={values[field.key] ?? ''}
                          onChange={e => set(field.key, e.target.value)}
                          rows={5}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] font-mono outline-none focus:border-foreground/40 transition-all resize-none leading-relaxed"
                        />
                      ) : field.type === 'boolean' ? (
                        <div 
                          onClick={() => set(field.key, !values[field.key])}
                          className="flex items-center justify-between px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl cursor-pointer hover:bg-foreground/[0.05] transition-all"
                        >
                          <span className="text-[11px] text-muted/80">{field.label}</span>
                          <div className={`w-8 h-4 rounded-full p-1 transition-all ${values[field.key] ? 'bg-accent' : 'bg-muted/20'}`}>
                            <div className={`w-2 h-2 rounded-full bg-white transition-all ${values[field.key] ? 'translate-x-4' : 'translate-x-0'}`} />
                          </div>
                        </div>
                      ) : field.type === 'filter' ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-border/20 pb-2">
                             <label className="text-[10px] font-bold text-muted/60 uppercase ml-1">{field.label}</label>
                             <div className="flex bg-foreground/[0.05] rounded-lg p-0.5 pointer-events-auto">
                               {['and', 'or'].map(m => (
                                 <button
                                   key={m}
                                   onClick={() => set(field.key, { ...values[field.key], combine: m })}
                                   className={`px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${values[field.key]?.combine === m ? 'bg-background shadow-xs text-foreground' : 'text-muted/40 hover:text-muted'}`}
                                 >
                                   {m}
                                 </button>
                               ))}
                             </div>
                          </div>

                          <div className="space-y-3">
                            {((values[field.key] as any)?.conditions || []).map((cond: any, cIdx: number) => (
                              <div key={cIdx} className="p-4 bg-foreground/[0.01] border border-border/20 rounded-xl space-y-4 relative group/cond border-l-2 border-l-foreground/10 transition-all hover:bg-foreground/[0.03]">
                                <div className="flex items-center justify-between mb-2">
                                   <span className="text-[9px] font-black uppercase text-muted/30 tracking-widest">
                                     Condition {cIdx + 1}
                                   </span>
                                   <button 
                                      onClick={() => {
                                        const newConds = [...(values[field.key].conditions)];
                                        newConds.splice(cIdx, 1);
                                        set(field.key, { ...values[field.key], conditions: newConds });
                                      }}
                                      className="p-1.5 text-muted/30 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                  {/* Left and Operator Row */}
                                  <div className="grid grid-cols-5 gap-3">
                                    <div className="col-span-3 space-y-1.5">
                                      <label className="text-[9px] font-bold text-muted/40 uppercase ml-0.5">Value 1</label>
                                      <input
                                        value={cond.leftValue || ''}
                                        onChange={e => {
                                          const newConds = [...(values[field.key].conditions)];
                                          newConds[cIdx] = { ...newConds[cIdx], leftValue: e.target.value };
                                          set(field.key, { ...values[field.key], conditions: newConds });
                                        }}
                                        placeholder="{{ $json.field }}"
                                        className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-[11px] outline-none focus:border-foreground/40 transition-all"
                                      />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                      <label className="text-[9px] font-bold text-muted/40 uppercase ml-0.5">Operator</label>
                                      <CustomSelect
                                        value={cond.operator || 'equal'}
                                        onChange={val => {
                                          const newConds = [...(values[field.key].conditions)];
                                          newConds[cIdx] = { ...newConds[cIdx], operator: val };
                                          set(field.key, { ...values[field.key], conditions: newConds });
                                        }}
                                        options={[
                                          { id: 'equal', label: '==' },
                                          { id: 'notEqual', label: '!=' },
                                          { id: 'contains', label: 'Contains' },
                                          { id: 'notContains', label: '!Contains' },
                                          { id: 'startsWith', label: 'Starts' },
                                          { id: 'gt', label: 'Greater' },
                                          { id: 'lt', label: 'Less' },
                                          { id: 'isEmpty', label: 'Empty' },
                                          { id: 'isNotEmpty', label: '!Empty' },
                                        ]}
                                      />
                                    </div>
                                  </div>
                                  
                                  {/* Right Value Box */}
                                  {!['isEmpty', 'isNotEmpty'].includes(cond.operator) && (
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-bold text-muted/40 uppercase ml-0.5">Value 2</label>
                                      <input
                                        value={cond.rightValue || ''}
                                        onChange={e => {
                                          const newConds = [...(values[field.key].conditions)];
                                          newConds[cIdx] = { ...newConds[cIdx], rightValue: e.target.value };
                                          set(field.key, { ...values[field.key], conditions: newConds });
                                        }}
                                        placeholder="Compare to..."
                                        className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg text-[11px] outline-none focus:border-foreground/40 transition-all"
                                      />
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const current = values[field.key] || { conditions: [], combine: 'and' };
                                const newConds = [...(current.conditions || []), { leftValue: '', operator: 'equal', rightValue: '' }];
                                set(field.key, { ...current, conditions: newConds });
                              }}
                              className="w-full py-2.5 bg-foreground/5 hover:bg-foreground/10 border border-border/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted/70 hover:text-foreground transition-all flex items-center justify-center gap-2"
                            >
                              + Add Boolean Condition
                            </button>
                          </div>
                        </div>
                      ) : field.type === 'chat_test' ? (
                        <div className="space-y-4 pt-2">
                           <div className="flex items-center justify-between mb-1 px-1">
                             <label className="text-[10px] font-bold text-muted/60 uppercase">Manual Trigger Input</label>
                             <div className="text-[9px] text-accent/80 font-bold px-2 py-0.5 bg-accent/10 rounded-full border border-accent/20">Active Session</div>
                           </div>
                           <div className="relative group/chatbox">
                             <textarea
                               value={values[field.key] || ''}
                               onChange={e => set(field.key, e.target.value)}
                               rows={4}
                               placeholder="Type a message to test the workflow..."
                               className="w-full px-4 py-4 bg-foreground/[0.03] border border-border/40 rounded-2xl text-[12px] font-medium outline-none focus:border-accent/40 focus:ring-4 focus:ring-accent/5 transition-all resize-none shadow-sm group-hover/chatbox:border-border/60"
                             />
                             <div className="absolute bottom-3 right-3">
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   onTrigger?.(node.id, { message: values[field.key] });
                                 }}
                                 className="flex items-center gap-1.5 px-4 py-1.5 bg-accent text-white rounded-full text-[11px] font-black hover:bg-accent-light hover:scale-105 active:scale-95 transition-all shadow-lg"
                               >
                                 <Play size={10} fill="currentColor" />
                                 Execute workflow
                               </button>
                             </div>
                           </div>
                           <p className="text-[9px] text-muted/50 px-2 flex items-center gap-1.5">
                             <Zap size={10} className="text-accent" />
                             Entering text and clicking execute will simulate a live chat event.
                           </p>
                        </div>
                      ) : (
                        <input
                          type={field.type === 'password' ? 'password' : 'text'}
                          value={values[field.key] ?? ''}
                          onChange={e => set(field.key, e.target.value)}
                          placeholder={field.placeholder || 'Enter value...'}
                          className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] font-medium outline-none focus:border-foreground/40 transition-all font-mono"
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'output' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {node.data.result ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                      <Terminal size={12} />
                      Last Execution Data
                    </div>
                    <button 
                      onClick={() => {
                        const text = typeof node.data.result === 'object' 
                          ? JSON.stringify(node.data.result, null, 2) 
                          : String(node.data.result);
                        navigator.clipboard.writeText(text);
                        const btn = document.getElementById(`copy-btn-${node.id}`);
                        if (btn) {
                          const originalInner = btn.innerHTML;
                          btn.innerHTML = 'COPIED';
                          btn.classList.add('text-emerald-500');
                          setTimeout(() => {
                            btn.innerHTML = originalInner;
                            btn.classList.remove('text-emerald-500');
                          }, 2000);
                        }
                      }}
                      id={`copy-btn-${node.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground/[0.03] hover:bg-foreground/[0.08] text-muted hover:text-foreground rounded-lg text-[9px] font-black uppercase transition-all border border-border/40 group"
                    >
                      COPY_DATA
                    </button>
                  </div>
                  <div className="bg-[#0a0a0a] rounded-xl p-6 border border-white/5 font-mono text-[11px] overflow-auto max-h-[500px] no-scrollbar shadow-2xl relative group">
                    <pre className="text-emerald-400/90 leading-relaxed break-words whitespace-pre-wrap uppercase selection:bg-emerald-500/20">
                      {typeof node.data.result === 'object' 
                        ? JSON.stringify(node.data.result, null, 2) 
                        : String(node.data.result)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center animate-pulse">
                  <div className="w-12 h-12 rounded-full border border-border/40 flex items-center justify-center mb-4 text-muted opacity-40">
                    <Database size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40">Ready for data ingestion</p>
                  <p className="text-[9px] font-medium mt-1 text-muted opacity-20 uppercase">Execute workflow to see live pulse</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-[10px] font-black text-muted uppercase tracking-widest opacity-40">
                  <ShieldCheck size={12} />
                  Reliability Protocols
                </div>
              <div className="p-6 rounded-xl border border-dashed border-border/60 text-center">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted opacity-40">Advanced_Settings</p>
                 <p className="text-[9px] font-medium mt-1 text-muted opacity-20 uppercase italic">Error handling & retry logic coming soon</p>
              </div>

              <div className="pt-6 border-t border-border/40">
                <button
                  onClick={onDelete}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/5 transition-all text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={12} /> Purge This Node
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
