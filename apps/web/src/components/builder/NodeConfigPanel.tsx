'use client';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Trash2, CheckSquare, Info, Link2, ChevronDown, Settings2, Database, Terminal, ShieldCheck, Activity, SlidersHorizontal, Copy, Check, Search, Globe, Loader2, Play, Zap, LogIn, ChevronLeft, ExternalLink, AlertCircle } from 'lucide-react';
import { getToolByExecutionKey, TOOL_REGISTRY, getToolById } from './toolRegistry';
import VariablePicker from './VariablePicker';
import { useCredentials, useCreateCredential, useCredentialSchemas } from '@/hooks/useApi';
import { useAuthStore } from '@/store/authStore';
import PipedreamConfigSection from './PipedreamConfigSection';
import PipedreamNodeSettings from './PipedreamNodeSettings';
import DynamicParameterForm from './DynamicParameterForm';
import { CustomSelect } from './CustomSelect';

import { usePipedreamTools } from '@/hooks/usePipedreamApps';

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

const RichTextarea = ({ value, onChange, placeholder, rows = 4, className }: any) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleScroll = () => {
    if (backdropRef.current && textareaRef.current) {
       backdropRef.current.scrollTop = textareaRef.current.scrollTop;
       backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const highlighted = useMemo(() => {
    const stringValue = String(value ?? '');
    if (!stringValue) return '';
    // Highlight {{ variable.path }} or {{ variable }}
    // Use an approach that strictly replaces only the matches to preserve alignment
    const parts = stringValue.split(/(\{\{\s*[\s\S]+?\s*\}\})/g);
    return parts.map((part: string) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        return `<span style="background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; font-weight: bold; border-radius: 4px; padding: 0px 1px;">${part}</span>`;
      }
      return part;
    }).join('').replace(/\n/g, '<br/>');
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const pos = e.currentTarget.selectionStart;
    const endPos = e.currentTarget.selectionEnd;
    const target = e.currentTarget;

    // 1. Backspace: remove whole variable if cursor is at the end or inside
    if (e.key === 'Backspace' && pos === endPos) {
       const textBefore = value.substring(0, pos);
       const textAfter = value.substring(pos);

       // Check if we are at the end of a variable: foo {{var}}|
       if (textBefore.endsWith('}}')) {
          const startIdx = textBefore.lastIndexOf('{{');
          if (startIdx !== -1) {
             e.preventDefault();
             const newVal = value.substring(0, startIdx) + textAfter;
             onChange({ target: { value: newVal, selectionStart: startIdx, getBoundingClientRect: () => target.getBoundingClientRect() } } as any);
             return;
          }
       }
       // Check if we are inside a variable: {{v|ar}}
       const lastStart = textBefore.lastIndexOf('{{');
       const lastEnd = textBefore.lastIndexOf('}}');
       const nextEnd = textAfter.indexOf('}}');
       const nextStart = textAfter.indexOf('{{');

       if (lastStart > lastEnd && nextEnd !== -1 && (nextStart === -1 || nextEnd < nextStart)) {
          // We are inside!
          e.preventDefault();
          const newVal = value.substring(0, lastStart) + value.substring(pos + nextEnd + 2);
          onChange({ target: { value: newVal, selectionStart: lastStart, getBoundingClientRect: () => target.getBoundingClientRect() } } as any);
          return;
       }
    }

    // 2. Auto-close: {{ -> {{}}
    if (e.key === '{') {
       const { value: val } = e.currentTarget;
       if (val.charAt(pos - 1) === '{') {
          e.preventDefault();
          const newVal = val.substring(0, pos) + '{}}' + val.substring(pos);
          onChange({ target: { value: newVal, selectionStart: pos + 1, getBoundingClientRect: () => target.getBoundingClientRect() } } as any);
          setTimeout(() => {
             if (textareaRef.current) {
                textareaRef.current.selectionStart = pos + 1;
                textareaRef.current.selectionEnd = pos + 1;
             }
          }, 0);
       }
    }
  };

  return (
    <div className="relative w-full group overflow-hidden">
      <div 
        ref={backdropRef}
        aria-hidden="true"
        className={`absolute inset-0 px-4 py-3 text-[12px] font-medium pointer-events-none whitespace-pre-wrap break-words overflow-auto no-scrollbar scroll-smooth antialiased ${className}`}
        style={{ 
          color: 'white', 
          lineHeight: '1.5',
          fontFamily: 'inherit',
          letterSpacing: 'normal',
          wordBreak: 'break-word'
        }}
        dangerouslySetInnerHTML={{ __html: highlighted + '<br/>' }}
      />
      <textarea
        ref={textareaRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        rows={rows}
        placeholder={placeholder}
        className={`relative w-full px-4 py-3 bg-foreground/[0.01] border border-border/40 rounded-xl text-[12px] outline-none focus:border-foreground/20 transition-all font-medium custom-scrollbar antialiased ${className}`}
        style={{ 
          background: 'transparent',
          color: 'transparent',
          lineHeight: '1.5',
          fontFamily: 'inherit',
          resize: 'none',
          caretColor: 'white',
          wordBreak: 'break-word'
        }}
      />
    </div>
  );
};

/**
 * Check if this is a Pipedream integration node
 */
const isPipedreamNode = (node: any): boolean => {
  const executionKey = node.data?.executionKey;
  const toolId = node.data?.toolId;
  
  // Explicitly exclude core non-Pipedream nodes
  const coreNodes = [
    'llm_run', 'logic_if', 'logic_code', 
    'trigger_manual', 'trigger_chat', 'trigger_webhook', 
    'sticky_note'
  ];
  
  return (
    toolId?.startsWith('pd:') || 
    executionKey === 'pipedream_action' || 
    (executionKey && executionKey.includes('_') && !coreNodes.includes(executionKey) && !executionKey.startsWith('ai.'))
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

  // Variable Picker State
  const [pickerState, setPickerState] = useState<{
    show: boolean;
    x: number;
    y: number;
    targetKey: string;
    isOpField?: boolean;
    opIdx?: number;
    cursorPos: number;
  }>({
    show: false,
    x: 0,
    y: 0,
    targetKey: '',
    cursorPos: 0
  });
  

  // Pipedream Dynamic State
  const [pipedreamActionSchema, setPipedreamActionSchema] = useState<any>(null);

  const isPd = isPipedreamNode(node);
  const appSlug = node.data.config.appSlug || (isPd && node.data.executionKey !== 'pipedream_action' ? node.data.executionKey.split('_')[0] : '');
  const actionName = node.data.config.actionName || (isPd && node.data.executionKey !== 'pipedream_action' ? node.data.executionKey.split('_').slice(1).join('_') : '');
  
  const { data: pipedreamToolsData, isLoading: isLoadingPdTools, isError: isPdToolsError } = usePipedreamTools(appSlug, isPd && !!appSlug);
  const pipedreamTools = pipedreamToolsData || [];


  useEffect(() => {
    if (isPd && actionName && pipedreamTools.length > 0) {
      const selected = pipedreamTools.find(t => t.name === actionName);
      if (selected) {
        setPipedreamActionSchema(selected.inputSchema);
      }
    }
  }, [isPd, actionName, pipedreamTools]);


  const handleTextChange = (e: React.ChangeEvent<any>, key: string, isOp: boolean = false, opIdx?: number) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    
    // Update value
    if (isOp && typeof opIdx === 'number') {
      setOperations(ops => ops.map((o, i) => i === opIdx ? { ...o, [key]: val } : o));
    } else {
      set(key, val);
    }

    // Check for trigger {{
    if (val && pos >= 2 && val.charAt(pos - 1) === '{' && val.charAt(pos - 2) === '{') {
      const rect = typeof e.target.getBoundingClientRect === 'function' 
        ? e.target.getBoundingClientRect() 
        : { left: window.innerWidth / 2, top: window.innerHeight / 2 };
        
      setPickerState({
        show: true,
        x: Math.max(20, rect.left - 330), // Show to the left of the panel
        y: Math.min(rect.top, window.innerHeight - 420),
        targetKey: key,
        isOpField: isOp,
        opIdx,
        cursorPos: pos
      });
    } else {
      if (pickerState.show) setPickerState(prev => ({ ...prev, show: false }));
    }
  };

  const handleVariableSelect = (variable: string) => {
    const { targetKey, isOpField, opIdx, cursorPos } = pickerState;
    const currentVal = isOpField && typeof opIdx === 'number' && operations[opIdx]
      ? (operations[opIdx][targetKey] || '')
      : (values[targetKey] || '');
    
    // We typed '{{'
    // cursorPos is right after second '{'
    const prefix = currentVal.substring(0, cursorPos - 2);
    const suffix = currentVal.substring(cursorPos);
    
    // Smart Brace insertion: Check if suffix already contains closing braces from auto-close
    let insertSuffix = ' }}';
    let remainingSuffix = suffix;
    if (suffix.startsWith('}}')) {
       remainingSuffix = suffix.substring(2);
    }
    
    const newVal = prefix + '{{ ' + variable + insertSuffix + remainingSuffix;
    
    if (isOpField && typeof opIdx === 'number') {
      setOperations(ops => ops.map((o, i) => i === opIdx ? { ...o, [targetKey]: newVal } : o));
    } else {
      set(targetKey, newVal);
    }
    setPickerState(prev => ({ ...prev, show: false }));
  };

  const [values, setValues] = useState<Record<string, any>>(() => {
    const cfg = (node.data.config as Record<string, any>) ?? {};
    const base: Record<string, any> = {
      label:        node.data.label ?? '',
      description:  node.data.description ?? '',
      credentialId: cfg.credentialId ?? '',
      // ─── PIPEDREAM FIELDS ─────────────────────────────────────────
      appSlug:      cfg.appSlug ?? '',
      actionName:   cfg.actionName ?? '',
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

  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { id: string; label: string }[]>>({});
  const [loadingDynamic, setLoadingDynamic] = useState<Record<string, boolean>>({});

  const activeDynamicFields = useMemo(() => {
    let fields: any[] = [];
    if ((tool as any).operationFields) {
      operations.forEach(op => {
        if (op.op) fields = [...fields, ...(((tool as any).operationFields as any)[op.op] || [])];
      });
    } else {
      const configFields = tool.configFields || [];
      const selectedOp = values.operation;
      const opInputs = (tool as any).operationInputs?.[selectedOp] || [];
      fields = [...configFields, ...opInputs];
    }
    return fields.filter(f => f.dynamicProvider && f.dynamicResource);
  }, [tool, operations, values.operation]);

  useEffect(() => {
    const fetchAll = async () => {
      if (!values.credentialId || activeDynamicFields.length === 0) return;
      const fetchOne = async (field: any) => {
        const cacheKey = `${field.key}:${values.credentialId}`;
        if (dynamicOptions[cacheKey] || loadingDynamic[cacheKey]) return;
        setLoadingDynamic(prev => ({ ...prev, [cacheKey]: true }));
        try {
          const apiModule = await import('@/lib/api');
          const api = apiModule.default || (apiModule as any).api;
          const { data } = await api.get(`/credentials/proxy/options?credentialId=${values.credentialId}&provider=${field.dynamicProvider}&resource=${field.dynamicResource}`);
          setDynamicOptions(prev => ({ ...prev, [cacheKey]: data }));
        } catch (err) {
          setDynamicOptions(prev => ({ ...prev, [cacheKey]: [] }));
        } finally {
          setLoadingDynamic(prev => ({ ...prev, [cacheKey]: false }));
        }
      };
      await Promise.all(activeDynamicFields.map(fetchOne));
    };
    fetchAll();
  }, [values.credentialId, activeDynamicFields]);

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

  const nodeIcon = node.data.icon || tool.icon;
  const nodeLabel = values.label || node.data.label || tool.label;
  const nodeBg = tool.bg || 'bg-indigo-500/10';
  const nodeColor = tool.color || 'text-indigo-500';

  return (
    <aside className="w-[450px] shrink-0 bg-card border-l border-border flex flex-col h-full font-inter z-50 shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex flex-col border-b border-border/60 bg-background/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
           <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border border-border/40 ${nodeBg}`}>
                {typeof nodeIcon === 'string' ? (
                  <img src={nodeIcon} alt={nodeLabel} className="w-5 h-5 object-contain" />
                ) : (
                  <Icon size={18} className={nodeColor} />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-[14px] font-bold text-foreground leading-none">{nodeLabel}</span>
                <span className="text-[10px] text-muted font-black uppercase tracking-widest mt-1 opacity-40">
                  {isPd ? `${appSlug || 'Integration'} Action` : `${tool.category} Node`}
                </span>
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
              {isPd && appSlug && actionName ? (
                // ─── UNIFIED PIPEDREAM NODE: Show action parameters ──
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">
                    <SlidersHorizontal size={12} />
                    Action Parameters
                  </div>
                  {isPdToolsError ? (
                    <div className="p-6 text-center bg-red-500/5 border border-red-500/10 rounded-xl">
                      <AlertCircle size={24} className="text-red-500 mx-auto mb-3 opacity-50" />
                      <p className="text-[11px] text-red-600/80 font-bold mb-2 uppercase tracking-tight">Account Not Connected</p>
                      <p className="text-[10px] text-red-500/60 mb-5 leading-relaxed">
                        You need to connect your {appSlug} account to reveal available actions and parameters.
                      </p>
                      <button 
                        onClick={() => setActiveTab('settings')}
                        className="w-full px-4 py-3 bg-red-500/10 text-red-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/10"
                      >
                        Go to Authentication
                      </button>
                    </div>
                  ) : isLoadingPdTools ? (
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3">
                      <Loader2 size={16} className="text-yellow-600 animate-spin shrink-0" />
                      <p className="text-[11px] text-yellow-600/80 font-medium">Fetching action details from Pipedream...</p>
                    </div>
                  ) : pipedreamTools.length > 0 ? (
                    (() => {
                      const selectedTool = pipedreamTools.find((t: any) => t.name === actionName);
                      if (selectedTool?.inputSchema) {
                        return (
                          <DynamicParameterForm
                            schema={selectedTool.inputSchema}
                            values={values}
                            onChange={(updates) => {
                              setValues(prev => ({ ...prev, ...updates }));
                            }}
                          />
                        );
                      }
                      return (
                        <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3">
                          <Info size={16} className="text-blue-500 shrink-0" />
                          <p className="text-[11px] text-blue-500/80 font-medium">No parameters required for this action</p>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex gap-3">
                      <AlertCircle size={16} className="text-yellow-600 shrink-0" />
                      <p className="text-[11px] text-yellow-600/80 font-medium">Loading action details...</p>
                    </div>
                  )}
                </div>
              ) : isPd ? (
                // ─── PARTIAL PIPEDREAM NODE: Select action first if not yet selected ──
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl flex gap-3">
                  <Info size={16} className="text-blue-500 shrink-0" />
                  <p className="text-[11px] text-blue-500/80 font-medium">Select an action in the configuration to reveal parameters</p>
                </div>
              ) : (

                // ─── STANDARD NODES (Existing Logic) ──────────────────────
                <>
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
                             <RichTextarea 
                               value={opState[field.key] ?? ''} 
                               onChange={(e: any) => handleTextChange(e, field.key, true, idx)} 
                               placeholder={field.placeholder || `Enter ${field.label}...`} 
                             />
                           ) : (
                             <input 
                               value={opState[field.key] ?? ''} 
                               onChange={e => handleTextChange(e, field.key, true, idx)} 
                               className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none focus:border-foreground/20 transition-all font-medium" 
                               placeholder={field.placeholder || `Enter ${field.label}...`} 
                             />
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
                      .filter((f: any) => 
                        !['notice', 'hidden'].includes(f.type) && 
                        !['operation', 'resource', 'width', 'height', 'mcpUrl', 'platform'].includes(f.key)
                      )
                      .map(field => {
                        // SPECIAL: For Model nodes, use dynamic options if available
                        let options = field.options || [];
                        if (field.key === 'model' && dynamicModels.length > 0) {
                           options = dynamicModels;
                        }

                        // Resolve dynamic placeholder for maxTokens
                        let dynamicPlaceholder = field.placeholder || `Enter ${field.label}...`;
                        if (field.key === 'maxTokens' && values.model) {
                          const selectedModel = dynamicModels.find((m: any) => (m.id || m.value) === values.model);
                          if (selectedModel && (selectedModel as any).max_output_tokens) {
                             dynamicPlaceholder = `Max: ${(selectedModel as any).max_output_tokens}`;
                          } else if (selectedModel && (selectedModel as any).context_length) {
                             dynamicPlaceholder = `Context: ${(selectedModel as any).context_length}`;
                          } else if (selectedModel && (selectedModel as any).max_tokens) {
                             dynamicPlaceholder = `Max: ${(selectedModel as any).max_tokens}`;
                          }
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
                            {field.type === 'textarea' || field.type === 'chat_test' || field.type === 'string' ? (
                               <RichTextarea 
                                 value={values[field.key] ?? ''} 
                                 onChange={(e: any) => handleTextChange(e, field.key)} 
                                 placeholder={dynamicPlaceholder} 
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
                            ) : (field.type === 'select' || field.key === 'model' || field.dynamicProvider) ? (
                                !values.credentialId && (field.key === 'model' || field.dynamicProvider) ? (
                                  <button 
                                    onClick={() => setActiveTab('settings')}
                                    className="w-full px-4 py-3 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded-xl text-[11px] font-black uppercase text-blue-500 flex items-center justify-center gap-2 transition-all group"
                                  >
                                    <ShieldCheck size={14} className="group-hover:scale-110 transition-transform" />
                                    Link {field.dynamicProvider ? field.dynamicProvider : 'API Key'} to Load options
                                  </button>
                                ) : (
                                  <CustomSelect 
                                    value={values[field.key] ?? ''} 
                                    onChange={val => set(field.key, val)} 
                                    placeholder={
                                      (isLoadingModels && field.key === 'model') || loadingDynamic[`${field.key}:${values.credentialId}`]
                                        ? "Loading options..." 
                                        : (field.placeholder || `Select ${field.label.toLowerCase()}...`)
                                    }
                                    isLoading={(isLoadingModels && field.key === 'model') || loadingDynamic[`${field.key}:${values.credentialId}`]}
                                    options={(field.dynamicProvider ? (dynamicOptions[`${field.key}:${values.credentialId}`] || []) : options || []).map((o: any) => {
                                      const id = typeof o === 'string' ? o : (o.value || o.id);
                                      const lab = typeof o === 'string' ? o : (o.label || o.name || id);
                                      return { id, label: lab };
                                    })}
                                  />
                                )
                            ) : (
                               <input 
                                 value={values[field.key] ?? ''} 
                                 onChange={e => handleTextChange(e, field.key)} 
                                 className="w-full px-4 py-3 bg-foreground/[0.03] border border-border/40 rounded-xl text-[12px] outline-none focus:border-foreground/20 transition-all font-medium" 
                                 placeholder={dynamicPlaceholder} 
                               />
                            )}
                          </div>
                        );
                      });
                  })()}
                </div>
              </>
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
              {/* PIPEDREAM NODE SETTINGS */}
              {isPd && appSlug && actionName && (
                <PipedreamNodeSettings
                  appSlug={appSlug}
                  actionName={actionName}
                  credentialId={values.credentialId}
                  onCredentialConnect={(platform) => {
                    const connectUrl = new URL('/connections', window.location.origin);
                    connectUrl.searchParams.set('credentialType', `${platform}_oauth`);
                    connectUrl.searchParams.set('platform', platform);
                    window.open(connectUrl.toString(), `Connect ${platform}`, 'width=800,height=900');
                  }}
                  onCredentialSelect={(credentialId) => {
                    setValues(prev => ({ ...prev, credentialId }));
                  }}
                />
              )}

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

               {/* Auth (Only for non-Pipedream nodes) */}
               {!isPd && (
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
                              {firstType && credentialSchemas?.[firstType]?.helpUrl && (
                                <a 
                                  href={credentialSchemas[firstType].helpUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-2 text-[9px] font-black text-emerald-500 hover:text-emerald-400 uppercase tracking-widest px-2 mb-2 transition-colors border border-emerald-500/20 bg-emerald-500/5 py-1 rounded-full w-max"
                                >
                                  <ExternalLink size={10} strokeWidth={3} /> Get Token / Doc
                                </a>
                              )}
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
                      )
                    })()}
                  </div>
                </div>
              )}

               {/* Danger */}
               <div className="pt-10 border-t border-border/40">
                  <button onClick={onDelete} className="w-full py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Remove Node from canvas</button>
               </div>
            </div>
          )}
        </div>
      </div>
      {/* Variable Picker Popover */}
      {pickerState.show && (
        <div 
          className="fixed z-[100]"
          style={{ left: pickerState.x, top: pickerState.y }}
        >
          <VariablePicker
            nodes={nodes}
            edges={edges}
            currentNodeId={node.id}
            onSelect={handleVariableSelect}
            onClose={() => setPickerState(prev => ({ ...prev, show: false }))}
          />
        </div>
      )}
    </aside>
  );
}
