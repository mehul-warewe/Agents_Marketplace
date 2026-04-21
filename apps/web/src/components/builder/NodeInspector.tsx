'use client';

import React, { useState } from 'react';
import {
  X, Users, Bot, Zap, Activity, MessageSquare, Trash2,
  ArrowRight, Search, Loader2, Calendar, Globe, Bell,
  ChevronRight, Shield, ListTree,
} from 'lucide-react';
import { usePipedreamApps } from '@/hooks/usePipedreamApps';
import { usePipedreamTriggers } from '@/hooks/useApi';
import { formatLabel } from '../ui/utils';
import { useDebounce } from '@/hooks/useDebounce';

interface NodeInspectorProps {
  selectedNode: any;
  selectedEdge: any;
  onClose: () => void;
  onUpdateNode: (id: string, data: any) => void;
  onUpdateEdge: (id: string, data: any) => void;
  onDelete: (id: string, type: 'node' | 'edge') => void;
  employeeRegistry: any[];
  isRegistryLoading: boolean;
}

const NODE_ACCENT: Record<string, string> = {
  hub:       'bg-indigo-600 text-white',
  employee:  'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  tool:      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  trigger:   'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  condition: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
};

const NODE_ICON: Record<string, React.ReactNode> = {
  hub:       <Users size={16} strokeWidth={2.5} />,
  employee:  <Bot    size={16} strokeWidth={2} />,
  tool:      <Zap    size={16} strokeWidth={2} />,
  trigger:   <Activity size={16} strokeWidth={2} />,
  condition: <ListTree size={16} strokeWidth={2} />,
};

const NATIVE_TRIGGERS = [
  { id: 'webhook',  name: 'Webhook',  description: 'Trigger via HTTP request',   icon: <Globe    size={16} />, color: 'text-blue-500'   },
  { id: 'schedule', name: 'Schedule', description: 'Run on a timed interval',     icon: <Calendar size={16} />, color: 'text-emerald-500' },
  { id: 'manual',   name: 'Manual',   description: 'Trigger via chat or UI form', icon: <Bell     size={16} />, color: 'text-orange-500'  },
];

/* ─── Field primitives ───────────────────────────────────────────────────────── */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/60 mb-1.5 px-0.5">
      {children}
    </label>
  );
}

function TextArea({ value, onChange, placeholder, rows = 5 }: any) {
  return (
    <textarea
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-background border border-border rounded-xl px-4 py-3 text-[12px] font-medium text-foreground leading-relaxed resize-none outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-muted-foreground/30"
    />
  );
}

function TextInput({ value, onChange, placeholder }: any) {
  return (
    <input
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-[12px] font-medium text-foreground outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-muted-foreground/30"
    />
  );
}

/* ─── Employee Picker ────────────────────────────────────────────────────────── */
function EmployeePicker({ employees, isLoading, onSelect }: any) {
  const [search, setSearch] = useState('');
  const filtered = employees?.filter((w: any) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
        <input
          type="text"
          placeholder="Search employees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-medium text-foreground outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/30"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={20} className="animate-spin text-muted-foreground/40" />
        </div>
      ) : filtered?.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-border rounded-xl">
          <p className="text-[10px] font-medium text-muted-foreground/40">No employees found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered?.map((worker: any) => (
            <button
              key={worker.id}
              onClick={() => onSelect({ ...worker, isPlaceholder: false })}
              className="w-full p-3.5 bg-muted/50 border border-border rounded-xl hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all text-left flex items-center gap-3 group"
            >
              <div className="w-8 h-8 bg-background border border-border rounded-lg flex items-center justify-center text-muted-foreground/50 group-hover:text-indigo-500 group-hover:border-indigo-500/30 transition-colors shrink-0">
                <Bot size={14} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-foreground tracking-tight truncate">{worker.name}</p>
                <p className="text-[9px] font-medium text-muted-foreground/50 truncate mt-0.5">
                  {worker.description || 'No description available'}
                </p>
              </div>
              <ArrowRight size={13} className="text-muted-foreground/20 group-hover:text-indigo-500 shrink-0 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Trigger Picker ─────────────────────────────────────────────────────────── */
function TriggerPicker({ selectedNode, onUpdateNode }: any) {
  const [mode, setMode] = useState<'NATIVE' | 'APP'>('NATIVE');
  const [search, setSearch] = useState('');
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const debouncedSearch = useDebounce(search, 300);

  const { data: pipedreamApps, isLoading: isAppsLoading } = usePipedreamApps(debouncedSearch, 50, 0, !!(mode === 'APP' && !selectedApp));
  const { data: appTriggers, isLoading: isTriggersLoading } = usePipedreamTriggers(selectedApp?.id);

  const handleNativeSelect = (trigger: any) => {
    onUpdateNode(selectedNode.id, {
      ...selectedNode.data,
      isPlaceholder: false,
      name: trigger.name,
      triggerType: trigger.id,
      description: trigger.description,
    });
  };

  return (
    <div className="space-y-4">
      {/* Mode switcher */}
      <div className="flex items-center gap-1 p-1 bg-muted border border-border rounded-xl">
        {(['NATIVE', 'APP'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setSelectedApp(null); }}
            className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all
              ${mode === m
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground/60 hover:text-foreground'
              }`}
          >
            {m === 'NATIVE' ? 'Built-in' : 'Integrations'}
          </button>
        ))}
      </div>

      {mode === 'NATIVE' ? (
        <div className="space-y-2">
          {NATIVE_TRIGGERS.map((t) => (
            <button
              key={t.id}
              onClick={() => handleNativeSelect(t)}
              className="w-full p-4 bg-muted/50 border border-border rounded-xl hover:border-indigo-500/40 hover:bg-indigo-500/5 text-left flex items-center gap-3 group transition-all"
            >
              <div className={`w-9 h-9 bg-background border border-border rounded-lg flex items-center justify-center shrink-0 ${t.color} group-hover:scale-105 transition-transform`}>
                {t.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-foreground tracking-tight">{t.name}</p>
                <p className="text-[9px] font-medium text-muted-foreground/50 mt-0.5">{t.description}</p>
              </div>
              <ChevronRight size={13} className="text-muted-foreground/20 group-hover:text-foreground shrink-0" />
            </button>
          ))}
        </div>
      ) : !selectedApp ? (
        <div className="space-y-3">
          <div className="relative">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="Search integrations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-medium outline-none focus:border-indigo-500/50 transition-all placeholder:text-muted-foreground/30"
            />
          </div>
          {isAppsLoading ? (
            <div className="flex justify-center py-10"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {(pipedreamApps || []).map((app: any) => (
                <button
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className="p-4 bg-muted/50 border border-border rounded-xl hover:border-indigo-500/40 flex flex-col items-center gap-2 group transition-all"
                >
                  <div className="w-10 h-10 bg-background border border-border rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                    {app.icon
                      ? <img src={app.icon} className="w-7 h-7 object-contain" alt="" />
                      : <Globe size={16} className="text-muted-foreground/40" />
                    }
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/60 group-hover:text-foreground transition-colors text-center leading-tight">
                    {formatLabel(app.name)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <button onClick={() => setSelectedApp(null)} className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 hover:text-foreground transition-colors">
            <ChevronRight size={11} className="rotate-180" strokeWidth={3} /> Change connector
          </button>
          <div className="flex items-center gap-3 p-3 bg-muted border border-border rounded-xl">
            <div className="w-9 h-9 bg-background border border-border rounded-lg flex items-center justify-center shrink-0">
              <img src={selectedApp.icon} className="w-6 h-6 object-contain" alt="" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-foreground">{selectedApp.name}</p>
              <p className="text-[9px] text-muted-foreground/50 font-medium mt-0.5">Select a trigger below</p>
            </div>
          </div>
          {isTriggersLoading ? (
            <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground/40" /></div>
          ) : (
            <div className="space-y-2">
              {(appTriggers || []).map((trigger: any) => (
                <button
                  key={trigger.key}
                  onClick={() => onUpdateNode(selectedNode.id, {
                    ...selectedNode.data,
                    isPlaceholder: false,
                    name: trigger.name,
                    app: selectedApp.id,
                    triggerKey: trigger.key,
                    inputSchema: trigger.inputSchema,
                    triggerType: 'APP',
                    description: trigger.description,
                  })}
                  className="w-full p-3.5 bg-muted/50 border border-border rounded-xl hover:border-indigo-500/40 text-left flex items-start gap-3 group transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight">{trigger.name}</p>
                    <p className="text-[9px] font-medium text-muted-foreground/50 mt-1 line-clamp-2 leading-relaxed">{trigger.description}</p>
                  </div>
                  <ArrowRight size={13} className="text-muted-foreground/20 group-hover:text-indigo-500 shrink-0 mt-0.5 transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Section Header ─────────────────────────────────────────────────────────── */
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/50">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────────── */
export default function NodeInspector({
  selectedNode,
  selectedEdge,
  onClose,
  onUpdateNode,
  onUpdateEdge,
  onDelete,
  employeeRegistry,
  isRegistryLoading,
}: NodeInspectorProps) {
  const [activeTab, setActiveTab] = useState('Configuration');

  if (!selectedNode && !selectedEdge) return null;

  const isHub        = selectedNode?.type === 'hub';
  const isEmployee   = selectedNode?.type === 'employee';
  const isTrigger    = selectedNode?.type === 'trigger';
  const isEdge       = !!selectedEdge;
  const isPlaceholder = selectedNode?.data?.isPlaceholder;

  const nodeType  = selectedNode?.type ?? 'hub';
  const accentCls = NODE_ACCENT[nodeType] ?? NODE_ACCENT.hub;
  const nodeIcon  = NODE_ICON[nodeType] ?? NODE_ICON.hub;

  const nodeName = isPlaceholder
    ? `New ${formatLabel(nodeType)}`
    : (selectedNode?.data?.name || selectedEdge?.id || 'Configuration');

  const tabs = isEdge
    ? ['Instructions']
    : ['Configuration'];

  /* ── HUB form ── */
  const renderHubConfig = () => (
    <div className="space-y-5">
      <div>
        <SectionHeader label="Identity" />
        <FieldLabel>Manager Name</FieldLabel>
        <TextInput
          value={selectedNode?.data.name}
          onChange={(e: any) => onUpdateNode(selectedNode.id, { ...selectedNode.data, name: e.target.value })}
          placeholder="e.g. Customer Support Manager"
        />
      </div>
      <div>
        <SectionHeader label="Objective" />
        <FieldLabel>Primary Goal</FieldLabel>
        <TextArea
          value={selectedNode?.data.goal}
          onChange={(e: any) => onUpdateNode(selectedNode.id, { ...selectedNode.data, goal: e.target.value })}
          placeholder="Describe what this manager should accomplish..."
          rows={5}
        />
      </div>
    </div>
  );

  /* ── EMPLOYEE form ── */
  const renderEmployeeConfig = () => (
    isPlaceholder ? (
      <div className="space-y-4">
        <SectionHeader label="Assign Employee" />
        <EmployeePicker
          employees={employeeRegistry}
          isLoading={isRegistryLoading}
          onSelect={(data: any) => onUpdateNode(selectedNode.id, data)}
        />
      </div>
    ) : (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-4 bg-muted border border-border rounded-xl">
          <div className="w-9 h-9 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-500 shrink-0">
            <Bot size={16} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-foreground truncate">{selectedNode?.data.name}</p>
            <p className="text-[9px] font-medium text-muted-foreground/50 mt-0.5 truncate">
              {selectedNode?.data.description || 'No description'}
            </p>
          </div>
        </div>
        <div>
          <SectionHeader label="Custom Instruction" />
          <FieldLabel>Override Instructions (optional)</FieldLabel>
          <TextArea
            value={selectedNode?.data.customInstruction}
            onChange={(e: any) => onUpdateNode(selectedNode.id, { ...selectedNode.data, customInstruction: e.target.value })}
            placeholder="Add custom instructions for this assignment..."
            rows={4}
          />
        </div>
      </div>
    )
  );

  /* ── TRIGGER form ── */
  const renderTriggerConfig = () => (
    isPlaceholder ? (
      <div className="space-y-4">
        <SectionHeader label="Select Trigger Type" />
        <TriggerPicker selectedNode={selectedNode} onUpdateNode={onUpdateNode} />
      </div>
    ) : (
      <div className="space-y-5">
        <div className="p-4 bg-muted border border-border rounded-xl">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1">Trigger Type</p>
          <p className="text-sm font-bold text-foreground">{selectedNode?.data.name}</p>
          {selectedNode?.data.description && (
            <p className="text-[10px] font-medium text-muted-foreground/50 mt-1 leading-relaxed">{selectedNode.data.description}</p>
          )}
        </div>
        {Object.keys(selectedNode?.data?.inputSchema?.properties || {}).length > 0 && (
          <div className="space-y-4">
            <SectionHeader label="Configuration" />
            {Object.entries(selectedNode?.data?.inputSchema?.properties || {}).map(([key, prop]: [string, any]) => (
              <div key={key}>
                <FieldLabel>{prop.description || key}</FieldLabel>
                <TextInput placeholder={`Value for ${key}...`} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  );

  /* ── EDGE form ── */
  const renderEdgeConfig = () => (
    <div className="space-y-5">
      <SectionHeader label="Assignment Instructions" />
      <FieldLabel>Delegation Context</FieldLabel>
      <TextArea
        value={selectedEdge?.data?.instruction}
        onChange={(e: any) => onUpdateEdge(selectedEdge.id, { ...selectedEdge.data, instruction: e.target.value })}
        placeholder="Describe how the manager should delegate to this assignment..."
        rows={6}
      />
      <p className="text-[9px] font-medium text-muted-foreground/40 leading-relaxed">
        This instruction guides the manager's delegation behavior for the connected workflow state.
      </p>
    </div>
  );

  const renderContent = () => {
    if (isEdge) return renderEdgeConfig();
    if (isHub)      return renderHubConfig();
    if (isEmployee) return renderEmployeeConfig();
    if (isTrigger)  return renderTriggerConfig();
    return <p className="text-[11px] text-muted-foreground/50 text-center py-10">Select a node to configure.</p>;
  };

  return (
    <div className="absolute right-3 top-3 bottom-3 w-[22rem] bg-card border border-border rounded-2xl shadow-lg flex flex-col overflow-hidden z-50 animate-in slide-in-from-right-4 duration-300">

      {/* Header */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-border shrink-0 bg-card">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${accentCls}`}>
            {nodeIcon}
          </div>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-muted-foreground/50 leading-none mb-0.5">
              {isEdge ? 'Assignment Link' : formatLabel(nodeType)}
            </p>
            <h2 className="text-[12px] font-bold text-foreground leading-none truncate max-w-[160px]">
              {nodeName}
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:bg-muted hover:text-foreground transition-all shrink-0"
        >
          <X size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Tabs – only shown when not placeholder and there are multiple */}
      {!isPlaceholder && tabs.length > 1 && (
        <div className="flex border-b border-border bg-card shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-all relative
                ${activeTab === tab ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground/50 hover:text-foreground'}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-1 no-scrollbar bg-muted/20">
        {renderContent()}
      </div>

      {/* Footer – delete action (not for hub) */}
      {!isPlaceholder && selectedNode?.id !== 'manager_hub' && (
        <div className="p-4 border-t border-border bg-card shrink-0">
          <button
            onClick={() => onDelete(
              selectedNode?.id || selectedEdge?.id,
              selectedNode ? 'node' : 'edge'
            )}
            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/20 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
          >
            <Trash2 size={12} strokeWidth={2.5} />
            Remove {isEdge ? 'Connection' : 'Node'}
          </button>
        </div>
      )}
    </div>
  );
}
