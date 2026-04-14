'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  X, Database, Settings2, Terminal, Play, Loader2, Info, LogIn, 
  AlertCircle, SlidersHorizontal, CheckCircle, ShieldCheck, 
  ChevronDown, Type, AlignLeft, Hash, FileJson, CheckSquare, 
  Table, FileUp, List, Key, Trash2, Layout, Bot,
  Plus, ChevronRight,
  CreditCard,
  MessageSquare,
  Globe,
  Lock,
  Zap
} from 'lucide-react';
import { getToolById } from './toolRegistry';
import DynamicParameterForm from './DynamicParameterForm';
import PipedreamNodeSettings from './PipedreamNodeSettings';
import { usePipedreamTools } from '@/hooks/usePipedreamApps';
import { useCredentials } from '@/hooks/useApi';

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

// ─── Sub-Component: Tool Contract Editor ──────────────────────────────────────

interface ContractEditorProps {
  mode: 'INPUT' | 'OUTPUT' | 'BOTH';
  inputSchema: InputParam[];
  outputDescription: string;
  onChange: (schema: InputParam[], outputDesc: string) => void;
}

function ContractEditor({ mode, inputSchema, outputDescription, onChange }: ContractEditorProps) {
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
    { type: 'text', label: 'Long text', icon: AlignLeft },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'json', label: 'JSON', icon: FileJson },
    { type: 'file', label: 'File to URL', icon: FileUp },
    { type: 'table', label: 'Table', icon: Table },
    { type: 'list', label: 'Text list', icon: List },
    { type: 'json_list', label: 'JSON list', icon: FileJson },
    { type: 'api_key', label: 'API key', icon: Key },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Input Section */}
      {(mode === 'INPUT' || mode === 'BOTH') && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="space-y-1">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Input Parameters
              </h3>
              <p className="text-[10px] text-muted/50 font-medium">Define your Skill's incoming data</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Primary Types */}
            {inputTypes.slice(0, 6).map(t => (
              <button
                key={t.type}
                onClick={() => addParam(t.type)}
                className="flex items-center gap-2 px-3 py-1.5 bg-foreground/[0.03] border border-border/40 rounded-lg hover:bg-foreground/[0.06] hover:border-foreground/20 transition-all group"
              >
                <t.icon size={12} className="text-muted/40 group-hover:text-indigo-500 transition-colors" />
                <span className="text-[10px] font-semibold text-muted/80">{t.label}</span>
              </button>
            ))}

            {/* More Dropdown */}
            <div className="relative group/more">
              <button className="flex items-center gap-2 px-3 py-1.5 bg-foreground/[0.03] border border-border/40 rounded-lg hover:bg-foreground/[0.06] hover:border-foreground/20 transition-all text-muted/40 font-semibold group">
                <span className="text-[10px] font-bold text-muted/80">More</span>
                <ChevronDown size={10} className="group-hover:translate-y-0.5 transition-transform" />
              </button>
              
              <div className="absolute top-full left-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-50 hidden group-hover/more:block animate-in fade-in slide-in-from-top-1">
                 {inputTypes.slice(6).map(t => (
                   <button
                     key={t.type}
                     onClick={() => addParam(t.type)}
                     className="w-full flex items-center gap-3 px-4 py-2 hover:bg-white/5 text-left transition-colors group"
                   >
                     <t.icon size={12} className="text-muted/40 group-hover:text-indigo-500" />
                     <span className="text-[10px] font-bold text-muted/60 group-hover:text-white uppercase tracking-widest">{t.label}</span>
                   </button>
                 ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 mt-6">
            {params.length === 0 ? (
              <div className="py-12 border border-dashed border-border/40 rounded-2xl flex flex-col items-center justify-center text-center px-6">
                <div className="w-10 h-10 bg-muted/5 rounded-2xl flex items-center justify-center text-muted/20 mb-3">
                  <Database size={20} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted/40 italic">No inputs defined yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Information Callout */}
                <div className="p-4 bg-foreground/[0.03] border border-border/40 rounded-2xl flex items-start gap-3">
                   <Info size={16} className="text-muted/40 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-medium text-muted/40 leading-relaxed italic">
                      Access these in your tool steps by wrapping the variable in brackets - eg. <span className="text-foreground font-bold">{'{{ list }}'}</span>.
                   </p>
                </div>

                {/* Error Banner if missing names */}
                {params.some(p => !p.name) && (
                   <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-orange-500">Missing required values for:</p>
                        <ul className="list-disc list-inside text-[10px] text-orange-500/70 font-medium">
                           {params.filter(p => !p.name).map((p, i) => <li key={i}>variable_{i+1}</li>)}
                        </ul>
                      </div>
                   </div>
                )}

                {params.map((p, index) => (
                  <div key={p.id} className="p-6 bg-foreground/[0.02] border border-border/40 rounded-3xl hover:border-indigo-500/40 transition-all group relative">
                    <div className="flex flex-col gap-4">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <input 
                            value={p.name}
                            onChange={(e) => updateParam(p.id, { name: e.target.value })}
                            className="bg-transparent border-none text-[14px] font-bold text-foreground outline-none w-2/3 placeholder:text-muted/20"
                            placeholder="Type name of input for..."
                          />
                          {!p.name && (
                            <span className="px-2 py-0.5 bg-orange-500/10 text-orange-500 text-[9px] font-bold rounded-full flex items-center gap-1 shrink-0">
                               <Info size={10} /> Missing
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">Required</span>
                            <button 
                              onClick={() => updateParam(p.id, { required: !p.required })}
                              className={`w-8 h-4 rounded-full transition-all relative ${p.required ? 'bg-indigo-500' : 'bg-muted/20'}`}
                            >
                              <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${p.required ? 'right-0.5' : 'left-0.5'}`} />
                            </button>
                          </div>
                          <Settings2 size={14} className="text-muted/20 hover:text-foreground cursor-pointer transition-colors" />
                          <button onClick={() => removeParam(p.id)} className="text-muted/20 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Description Area */}
                      <textarea 
                        value={p.description}
                        onChange={(e) => updateParam(p.id, { description: e.target.value })}
                        placeholder="Type how input is described to agent..."
                        className="w-full bg-transparent border-none text-[12px] font-medium text-muted/60 outline-none resize-none leading-relaxed placeholder:text-muted/20"
                        rows={1}
                      />

                      {/* Type-Specific Setup Interface */}
                      <div className="mt-2">
                        {p.type === 'number' && (
                          <div className="relative group/input">
                            <input 
                              type="number" 
                              value={p.defaultValue || ''}
                              onChange={(e) => updateParam(p.id, { defaultValue: Number(e.target.value) })}
                              placeholder="Enter number..." 
                              className="w-full bg-foreground/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[12px] outline-none group-hover/input:border-white/20 focus:border-indigo-500/40 transition-all font-mono" 
                            />
                            {p.defaultValue === undefined && (
                               <button className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-foreground/[0.05] hover:bg-foreground/[0.1] rounded-lg text-[9px] font-black uppercase tracking-widest text-muted/60 flex items-center gap-2 border border-white/5">
                                 <Database size={10} /> Set as default
                               </button>
                            )}
                          </div>
                        )}

                        {(p.type === 'json' || p.type === 'json_list') && (
                          <div className="space-y-4">
                            <div className="relative group/json">
                                <div className="bg-[#070708] border border-white/5 rounded-2xl p-4 font-mono text-[12px] text-emerald-500/60 relative group/json ring-1 ring-white/5 min-h-[120px]">
                                  <textarea 
                                    value={typeof p.defaultValue === 'string' ? p.defaultValue : JSON.stringify(p.defaultValue ?? {}, null, 2)}
                                    onChange={(e) => updateParam(p.id, { defaultValue: e.target.value })}
                                    className="w-full h-full bg-transparent border-none outline-none resize-none custom-scrollbar"
                                    spellCheck={false}
                                  />
                                  <div className="absolute bottom-2 right-4 text-[8px] font-bold text-muted/20 uppercase tracking-widest group-hover/json:text-indigo-500/40 transition-colors pointer-events-none">JSON_EDITOR</div>
                                </div>
                            </div>
                            {p.type === 'json_list' && (
                              <button className="w-full py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted/60 flex items-center justify-center gap-2 transition-all">
                                <Plus size={12} /> Add new object to array
                              </button>
                            )}
                          </div>
                        )}

                        {p.type === 'file' && (
                          <div className="space-y-3">
                            <div className="py-10 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-3 bg-foreground/[0.01] hover:bg-indigo-500/[0.03] hover:border-indigo-500/20 transition-all group/drop">
                              <div className="w-10 h-10 rounded-2xl bg-muted/5 flex items-center justify-center text-muted/20 group-hover/drop:text-indigo-500 group-hover/drop:bg-indigo-500/10 transition-all">
                                <FileUp size={20} />
                              </div>
                              <p className="text-[11px] font-medium text-muted/40">
                                Drag & Drop your files or <span className="text-indigo-500 font-bold cursor-pointer hover:underline">Browse</span>
                              </p>
                            </div>
                            <div className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-xl flex items-center gap-2">
                               <Info size={12} className="text-orange-500/60" />
                               <span className="text-[10px] font-bold text-orange-500/60 italic leading-none">This variable references the file URL, not file contents.</span>
                            </div>
                          </div>
                        )}

                        {p.type === 'table' && (
                          <div className="space-y-3">
                             <div className="grid grid-cols-2 gap-3">
                                {(Array.isArray(p.defaultValue?.columns) ? p.defaultValue.columns : ['Column 1', 'Column 2']).map((col: string, i: number) => (
                                  <div key={i} className="space-y-2">
                                     <div className="flex items-center justify-between px-1">
                                        <label className="text-[10px] font-bold text-muted/60">Header {i + 1}</label>
                                        <Trash2 
                                          size={10} 
                                          className="text-muted/20 hover:text-red-500 cursor-pointer" 
                                          onClick={() => {
                                            const cols = [...(p.defaultValue?.columns || ['Column 1', 'Column 2'])];
                                            cols.splice(i, 1);
                                            updateParam(p.id, { defaultValue: { ...(p.defaultValue || {}), columns: cols } });
                                          }}
                                        />
                                     </div>
                                     <input 
                                       value={col}
                                       onChange={(e) => {
                                         const cols = [...(p.defaultValue?.columns || ['Column 1', 'Column 2'])];
                                         cols[i] = e.target.value;
                                         updateParam(p.id, { defaultValue: { ...(p.defaultValue || {}), columns: cols } });
                                       }}
                                       placeholder="Header name..." 
                                       className="w-full bg-foreground/[0.03] border border-white/5 rounded-xl px-4 py-2.5 text-[11px] outline-none focus:border-indigo-500/40" 
                                     />
                                  </div>
                                ))}
                             </div>
                             <button 
                               onClick={() => {
                                  const cols = [...(p.defaultValue?.columns || ['Column 1', 'Column 2']), `Column ${(p.defaultValue?.columns?.length || 2) + 1}`];
                                  updateParam(p.id, { defaultValue: { ...(p.defaultValue || {}), columns: cols } });
                               }}
                               className="w-full py-2 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-500 text-[18px] flex items-center justify-center transition-all"
                             >+</button>
                          </div>
                        )}

                        {p.type === 'list' && (
                          <div className="space-y-4">
                            <div className="space-y-3">
                               {(Array.isArray(p.defaultValue) ? p.defaultValue : ['']).map((item: string, i: number) => (
                                 <div key={i} className="relative group/list-item">
                                   <input 
                                     value={item}
                                     onChange={(e) => {
                                        const next = [...(p.defaultValue || [''])];
                                        next[i] = e.target.value;
                                        updateParam(p.id, { defaultValue: next });
                                     }}
                                     placeholder="Type value..." 
                                     className="w-full bg-foreground/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[12px] outline-none focus:border-indigo-500/20 transition-all pr-12" 
                                   />
                                   <X 
                                     size={12} 
                                     className="absolute right-4 top-1/2 -translate-y-1/2 text-muted/20 hover:text-red-500 cursor-pointer" 
                                     onClick={() => {
                                        const next = [...(p.defaultValue || [])];
                                        next.splice(i, 1);
                                        updateParam(p.id, { defaultValue: next });
                                     }}
                                   />
                                 </div>
                               ))}
                            </div>
                            <button 
                              onClick={() => updateParam(p.id, { defaultValue: [...(p.defaultValue || []), ''] })}
                              className="w-full py-2.5 bg-foreground/[0.03] hover:bg-foreground/[0.06] border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-muted/60 flex items-center justify-center gap-2 transition-all"
                            >
                              <Plus size={12} /> New item
                            </button>
                          </div>
                        )}

                        {p.type === 'api_key' && (
                          <div className="space-y-4">
                             <div className="relative group/api">
                                <input 
                                  type="password" 
                                  value={p.defaultValue || ''} 
                                  onChange={(e) => updateParam(p.id, { defaultValue: e.target.value })}
                                  placeholder="Type or paste your API key..."
                                  className="w-full bg-foreground/[0.03] border border-indigo-500/40 rounded-xl px-4 py-3 text-[12px] outline-none font-mono focus:border-indigo-500" 
                                />
                                <Lock size={12} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500/40 pointer-events-none" />
                             </div>
                             <div className="space-y-1 pl-1">
                                <p className="text-[10px] text-muted/40 font-medium leading-relaxed">
                                  Sensitive keys are encrypted. Reference via <span className="text-indigo-400 font-bold">{`{{secrets.chains_${p.name || 'api_key'}}}`}</span>.
                                </p>
                             </div>
                          </div>
                        )}

                        {(p.type === 'string' || p.type === 'text') && (
                          <div className="relative">
                            <input 
                              value={p.defaultValue || ''}
                              onChange={(e) => updateParam(p.id, { defaultValue: e.target.value })}
                              placeholder="Type here..." 
                              className="w-full bg-foreground/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[12px] outline-none hover:border-white/10 focus:border-indigo-500/40 transition-all font-medium" 
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/20">
                               <Database size={14} />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Metadata */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/20">
                         <div className="flex items-center gap-2 text-indigo-500/40">
                            <ChevronRight size={14} />
                            <span className="px-2 py-1 bg-indigo-500/5 text-indigo-500/60 text-[9px] font-black rounded-md uppercase tracking-[0.2em]">{p.name || 'variable'}</span>
                         </div>
                         <div className="px-3 py-1 bg-foreground/[0.05] rounded-l-md rounded-r-2xl flex items-center gap-2">
                            {React.createElement(inputTypes.find(t => t.type === p.type)?.icon || Type, { size: 10, className: "text-muted/40" })}
                            <span className="text-[10px] font-bold text-muted/40 uppercase tracking-widest">{inputTypes.find(t => t.type === p.type)?.label || 'String'}</span>
                            <div className="h-2 w-px bg-muted/20 mx-1" />
                            <span className="text-[9px] font-black text-muted/20 uppercase tracking-widest">{p.type === 'list' || p.type === 'json_list' ? 'Array' : 'String'}</span>
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
          <div className="space-y-1 px-1">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Outcome Format
            </h3>
            <p className="text-[10px] text-muted/50 font-medium">Explain what is returned via Skill Output</p>
          </div>
          <div className="relative">
            <div className="absolute top-3 left-3 text-emerald-500/20">
               <Bot size={18} />
            </div>
            <textarea 
              value={outDesc}
              onChange={(e) => onChange(inputSchema, e.target.value)}
              placeholder="e.g. A list of recent emails from the query person with summaries..."
              className="w-full pl-10 pr-4 py-4 bg-foreground/[0.03] border border-border/40 rounded-2xl text-[11px] font-medium text-foreground outline-none focus:border-emerald-500/40 min-h-[100px] resize-none leading-relaxed"
            />
          </div>
        </section>
      )}

      {/* API Preview */}
      {(mode === 'INPUT' || mode === 'BOTH') && (
        <div className="bg-indigo-500/[0.03] border border-indigo-500/10 rounded-[2rem] p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl" />
          <div className="flex items-center gap-3 mb-4">
             <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Key size={14} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/80">Input Signature</span>
          </div>
          <div className="space-y-1.5 font-mono">
             <p className="text-[10px] text-indigo-400/60 font-bold break-all">
               invoke_tool({'{'}
             </p>
             {params.map(p => (
               <p key={p.id} className="text-[10px] text-indigo-300 ml-4 font-bold">
                 "{p.name}": 
                 <span className="text-indigo-400/40 italic ml-1">&lt;{p.type}&gt;</span>
                 <span className="text-white/20">,</span>
               </p>
             ))}
             <p className="text-[10px] text-indigo-400/60 font-bold break-all">
               {'}'}) → <span className="text-emerald-400/60">{'<any>'}</span>
             </p>
          </div>
        </div>
      )}
    </div>
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
  // Global settings
  name: string;
  onNameChange: (val: string) => void;
  description: string;
  onDescriptionChange: (val: string) => void;
  inputSchema: InputParam[];
  onInputSchemaChange: (val: InputParam[]) => void;
  outputDescription: string;
  onOutputDescriptionChange: (val: string) => void;
}

type TabType = 'setup' | 'settings' | 'debug';

export default function UnifiedSidebar({
  context,
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
  onOutputDescriptionChange
}: UnifiedSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>(context === 'NODE' ? 'setup' : 'settings');
  
  // -- Node Selection Logic --
  const tool = useMemo(() => node ? getToolById(node.data.toolId) : null, [node]);
  const { data: allCredentials = [] } = useCredentials();

  const { data: pipedreamToolsData } = usePipedreamTools(
    node?.data.config?.appSlug,
    !!node?.data.config?.appSlug
  );

  const [nodeValues, setNodeValues] = useState<Record<string, any>>(() => {
    if (!node) return {};
    const cfg = node.data.config ?? {};
    return {
      label: node.data.label ?? '',
      ...cfg
    };
  });

  useEffect(() => {
    if (node) {
      const cfg = node.data.config ?? {};
      setNodeValues({
        label: node.data.label ?? '',
        ...cfg
      });
    }
  }, [node]);

  const selectedTool = pipedreamToolsData?.find((t: any) => t.key === nodeValues.actionName || t.name === nodeValues.actionName);
  const toolSchema = selectedTool?.inputSchema || null;

  const handleUpdate = useCallback((updates: any) => {
    setNodeValues(prev => ({ ...prev, ...updates }));
    onUpdateNode(updates);
  }, [onUpdateNode]);

  // -- Derived Content Info --
  const isPipedreamNode = node?.data.executionKey === 'pipedream_action';
  const isPreconfigured = isPipedreamNode && nodeValues.appSlug && nodeValues.actionName;
  const isSkillInput = node?.data.toolId === 'skill.input' || node?.id === 'skill_input';
  const isSkillOutput = node?.data.toolId === 'skill.output' || node?.id === 'skill_output';

  // Tabs for Unified Sidebar
  const isGateway = isSkillInput || isSkillOutput;
  const tabs = [
    { id: 'setup' as TabType, label: 'Configure', icon: SlidersHorizontal },
    ...(isGateway ? [] : [
      { id: 'settings' as TabType, label: 'Settings', icon: Settings2 },
      ...(context === 'NODE' ? [{ id: 'debug' as TabType, label: 'Debug', icon: Terminal }] : []),
    ]),
  ];

  // Auto-switch to Configure tab for gateways
  useEffect(() => {
    if (isGateway && activeTab !== 'setup') {
      setActiveTab('setup');
    }
  }, [isGateway, activeTab]);

  if (!node) return null;

  return (
    <div className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-[480px] bg-card/95 backdrop-blur-xl border-l border-white/5 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] z-40 flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden font-inter">
      
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="p-8 border-b border-white/5 bg-[#0c0c0e]/80 backdrop-blur-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1 min-w-0">
             <div className="flex items-center gap-2 mb-2">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${node.data.bg || 'bg-indigo-500/10'}`}>
                    {tool ? (
                      typeof tool.icon === 'string' ? (
                        <img src={tool.icon} alt={node.data.label} className="w-5 h-5 object-contain" />
                      ) : (
                        <tool.icon size={18} className={node.data.color || 'text-indigo-500'} />
                      )
                    ) : (
                      <Layout size={18} className="text-indigo-500" />
                    )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted/30 font-mono leading-none mb-1">
                    {isSkillInput ? 'SKILL_GATEWAY' : 'ACTION_STEP'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-indigo-500/40" />
                    <span className="text-[10px] font-bold text-muted/50 uppercase tracking-widest">{node.id}</span>
                  </div>
                </div>
             </div>
             <h2 className="text-2xl font-black text-foreground tracking-tighter italic leading-tight uppercase truncate mt-2">
               {node.data.label}
             </h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-foreground/[0.03] border border-white/5 flex items-center justify-center hover:bg-foreground/[0.08] hover:scale-110 active:scale-95 transition-all text-muted/40 hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Global Action: Context Switcher / Action Button */}
        <div className="flex items-center gap-3">
            {(!isSkillInput && !isSkillOutput) ? (
              <button
                onClick={onDeleteNode}
                className="flex-1 px-4 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500/80 transition-all flex items-center justify-center gap-2 group"
              >
                <Trash2 size={12} className="group-hover:rotate-12 transition-transform" />
                Delete Step
              </button>
            ) : (
              <div className="flex-1 px-4 py-3 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-2.5">
                 <ShieldCheck size={14} className="text-indigo-500" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80">Permanent Step</span>
              </div>
            )}
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex px-6 pt-4 gap-2 bg-[#0c0c0e]/40 backdrop-blur-sm border-b border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative px-5 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5 rounded-t-xl
              ${activeTab === tab.id ? 'text-foreground bg-foreground/[0.03] border border-white/5 border-b-transparent' : 'text-muted/40 hover:text-muted/60'}
            `}
          >
            <tab.icon size={13} strokeWidth={activeTab === tab.id ? 3 : 2} className={activeTab === tab.id ? 'text-indigo-500' : ''} />
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            )}
          </button>
        ))}
      </div>

      {/* ── CONTENT ───────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
        
        {/* SETUP TAB */}
        {activeTab === 'setup' && (
          <div className="p-8 pb-32">
            {isSkillInput ? (
              <ContractEditor 
                mode="INPUT"
                inputSchema={inputSchema} 
                outputDescription={outputDescription}
                onChange={(s, o) => {
                  onInputSchemaChange(s);
                  onOutputDescriptionChange(o);
                }}
              />
            ) : isSkillOutput ? (
              <ContractEditor 
                mode="OUTPUT"
                inputSchema={inputSchema} 
                outputDescription={outputDescription}
                onChange={(s, o) => {
                  onInputSchemaChange(s);
                  onOutputDescriptionChange(o);
                }}
              />
            ) : (
              <div className="space-y-6">
                 <div className="space-y-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Logic Parameters
                    </h3>
                    <p className="text-[10px] text-muted/50 font-medium">Configure how this step processes data</p>
                 </div>
                 {isPreconfigured ? (
                    <DynamicParameterForm
                      schema={toolSchema || {}}
                      values={nodeValues}
                      onChange={handleUpdate}
                    />
                 ) : isPipedreamNode ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-6 border border-dashed border-border/40 rounded-3xl">
                       <Lock size={24} className="text-muted/20 mb-4" />
                       <p className="text-[11px] text-muted/60 font-medium leading-relaxed">
                         Activate authentication in the <span className="text-foreground font-black">SETTINGS</span> tab to unlock step parameters
                       </p>
                    </div>
                 ) : (
                    <div className="space-y-4">
                      {tool?.configFields?.filter(f => !['notice', 'hidden'].includes(f.type)).map(field => (
                        <div key={field.key} className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-muted/60 pl-1">{field.label}</label>
                          {field.type === 'textarea' ? (
                            <textarea
                              value={nodeValues[field.key] || ''}
                              onChange={(e) => handleUpdate({ [field.key]: e.target.value })}
                              className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-2xl text-[11px] font-medium outline-none focus:border-foreground/40 resize-none min-h-[100px]"
                              placeholder={field.placeholder}
                            />
                          ) : (
                            <input
                              type="text"
                              value={nodeValues[field.key] || ''}
                              onChange={(e) => handleUpdate({ [field.key]: e.target.value })}
                              className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-2xl text-[11px] font-medium outline-none focus:border-foreground/40"
                              placeholder={field.placeholder}
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

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="p-8 space-y-10 pb-32">
            <div className="space-y-8">
              {/* Visual Identity */}
              <div className="space-y-4">
                <div className="space-y-1 pl-1">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">Visual Identity</h3>
                  <p className="text-[10px] text-muted/50 font-medium italic">Customise step appearance</p>
                </div>
                <div className="space-y-3">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-muted/60">Step Title</label>
                     <input 
                       value={nodeValues.label || ''}
                       onChange={(e) => handleUpdate({ label: e.target.value })}
                       className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-2xl text-[11px] font-black uppercase tracking-widest text-foreground outline-none"
                     />
                  </div>
                </div>
              </div>

              {/* Authentication (Pipedream Only) */}
              {isPipedreamNode && (
                <div className="space-y-4">
                  <div className="space-y-1 pl-1">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-500">Security Credentials</h3>
                    <p className="text-[10px] text-muted/50 font-medium italic">Grant access to internal platform data</p>
                  </div>
                  <PipedreamNodeSettings
                    appSlug={nodeValues.appSlug}
                    platformName={nodeValues.platformName}
                    actionName={nodeValues.actionName}
                    credentialId={nodeValues.credentialId}
                    onCredentialSelect={(credentialId) => handleUpdate({ credentialId })}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* DEBUG TAB */}
        {activeTab === 'debug' && (
          <div className="p-8 space-y-8 pb-32">
             <div className="space-y-1 pl-1">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-500">Execution Stream</h3>
                <p className="text-[10px] text-muted/50 font-medium italic">Real-time step output mapping</p>
             </div>
             
             {onTriggerNode && (
                <button
                  onClick={() => onTriggerNode(node.id)}
                  className="w-full px-4 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 transition-all flex items-center justify-center gap-3 group"
                >
                  <Play size={14} fill="currentColor" className="group-hover:scale-125 transition-transform" />
                  Execute Logic Step
                </button>
             )}

             {node.data.result ? (
                <div className="p-6 bg-[#070708] border border-white/5 rounded-3xl font-mono text-[10px] text-emerald-400/80 shadow-inner group relative">
                   <div className="absolute top-2 right-4 text-[8px] font-bold text-emerald-500/40 uppercase tracking-widest">JSON_RAW</div>
                   <pre className="whitespace-pre-wrap break-words leading-relaxed overflow-x-auto">
                    {JSON.stringify(node.data.result, null, 2)}
                  </pre>
                </div>
             ) : (
                <div className="py-20 flex flex-col items-center justify-center text-center gap-4 bg-foreground/[0.02] border border-dashed border-border/40 rounded-3xl">
                   <div className="w-12 h-12 rounded-2xl bg-muted/5 flex items-center justify-center text-muted/20">
                      <Zap size={24} />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase tracking-widest text-muted/40">Waiting for trigger...</p>
                      <p className="text-[9px] text-muted/20 font-medium italic">Execution results will appear here</p>
                   </div>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
