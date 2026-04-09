'use client';

/**
 * Node Configuration Sidebar
 *
 * 4 Tabs:
 * 1. INPUT - Incoming data from connected nodes
 * 2. PARAMETERS - Action-specific parameters
 * 3. OUTPUT - Execution results
 * 4. SETTINGS - Authentication & node configuration
 */

import React, { useState, useMemo, useCallback } from 'react';
import { X, Database, Settings2, Terminal, Play, Loader2, Info, LogIn, AlertCircle, SlidersHorizontal, CheckCircle } from 'lucide-react';
import { getToolById } from './toolRegistry';
import DynamicParameterForm from './DynamicParameterForm';
import PipedreamNodeSettings from './PipedreamNodeSettings';
import { usePipedreamTools } from '@/hooks/usePipedreamApps';
import { useCredentials } from '@/hooks/useApi';

interface NodeSidebarProps {
  node: any;
  nodes: any[];
  edges: any[];
  onClose: () => void;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  onTrigger?: (nodeId: string) => void;
}

type TabType = 'input' | 'parameters' | 'output' | 'settings';

export default function NodeSidebar({
  node,
  nodes,
  edges,
  onClose,
  onUpdate,
  onDelete,
  onTrigger
}: NodeSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabType>('parameters');
  const tool = getToolById(node.data.toolId);
  const { data: allCredentials = [] } = useCredentials();

  // Load Pipedream action details if this is a Pipedream node
  const { data: pipedreamToolsData } = usePipedreamTools(
    node.data.config?.appSlug,
    !!node.data.config?.appSlug
  );

  const [values, setValues] = useState<Record<string, any>>(() => {
    const cfg = node.data.config ?? {};
    return {
      label: node.data.label ?? '',
      appSlug: cfg.appSlug ?? '',
      actionName: cfg.actionName ?? '',
      credentialId: cfg.credentialId ?? '',
      platformName: cfg.platformName ?? '',
      ...cfg
    };
  });

  const selectedTool = pipedreamToolsData?.find((t: any) => t.name === values.actionName);
  const toolSchema = selectedTool?.inputSchema || null;

  // Get incoming connections
  const incomingConnections = useMemo(() => {
    return edges
      .filter(e => e.target === node.id)
      .map(e => ({ edge: e, src: nodes.find(n => n.id === e.source) }))
      .filter(x => x.src);
  }, [edges, node.id, nodes]);

  // Get credentials for this platform
  const platformCredentials = useMemo(() => {
    if (!values.appSlug) return [];
    return allCredentials.filter((cred: any) =>
      cred.type.includes(values.appSlug) || cred.name?.toLowerCase().includes(values.appSlug.toLowerCase())
    );
  }, [allCredentials, values.appSlug]);

  const selectedCredential = useMemo(() => {
    return platformCredentials.find((c: any) => c.id === values.credentialId);
  }, [platformCredentials, values.credentialId]);

  const handleUpdate = useCallback((updates: any) => {
    setValues(prev => ({ ...prev, ...updates }));
    onUpdate(updates);
  }, [onUpdate]);

  if (!tool) return null;

  const isPipedreamNode = node.data.executionKey === 'pipedream_action';
  const isPreconfigured = isPipedreamNode && values.appSlug && values.actionName;

  // Available tabs based on content
  const availableTabs: TabType[] = [
    ...(incomingConnections.length > 0 ? (['input'] as const) : []),
    'parameters' as const,
    'output' as const,
    'settings' as const
  ];

  return (
    <div className="fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-96 bg-card border-l border-border shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-300">
      {/* HEADER */}
      <div className="p-6 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-foreground tracking-tight mb-1">
              {node.data.label}
            </h2>
            <p className="text-[11px] text-muted/60 font-medium">
              {isPreconfigured ? `${values.platformName || values.appSlug} → ${values.actionName}` : tool.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* DELETE BUTTON */}
        <button
          onClick={onDelete}
          className="w-full px-3 py-2 text-[10px] font-bold text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-all"
        >
          Delete Node
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-border/50 bg-background/30 px-3">
        {(['input', 'parameters', 'output', 'settings'] as TabType[])
          .filter(t => {
            if (t === 'input') return incomingConnections.length > 0;
            return true;
          })
          .map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all capitalize
                ${activeTab === tab
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted/60 hover:text-muted'
                }`}
            >
              {tab}
            </button>
          ))}
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-6 space-y-6">
          {/* INPUT TAB */}
          {activeTab === 'input' && (
            <div className="space-y-4">
              {incomingConnections.length === 0 ? (
                <div className="p-8 text-center">
                  <Database size={24} className="mx-auto text-muted/20 mb-3" />
                  <p className="text-[11px] text-muted/50">No incoming connections</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {incomingConnections.map(({ src }, idx) => (
                    <div key={idx} className="p-3 bg-foreground/[0.03] border border-border/40 rounded-lg">
                      <p className="text-[11px] font-bold text-foreground mb-2">
                        {src.data.label} (output)
                      </p>
                      <div className="p-2 bg-black/40 rounded border border-white/5 font-mono text-[9px] text-emerald-400 max-h-32 overflow-auto">
                        <pre className="whitespace-pre-wrap break-words">
                          {src.data.result ? JSON.stringify(src.data.result, null, 2) : 'Waiting for execution...'}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PARAMETERS TAB */}
          {activeTab === 'parameters' && (
            <div className="space-y-4">
              {isPreconfigured ? (
                <>
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-muted/60" />
                    <span className="text-[10px] font-bold uppercase text-muted/60">Action Parameters</span>
                  </div>

                  {toolSchema ? (
                    <DynamicParameterForm
                      schema={toolSchema}
                      values={values}
                      onChange={handleUpdate}
                    />
                  ) : (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-[10px] text-blue-600">
                        No parameters required for this action
                      </p>
                    </div>
                  )}
                </>
              ) : isPipedreamNode ? (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                  <Info size={16} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-[10px] text-blue-600 font-medium">
                    Configure authentication in Settings tab to view parameters
                  </p>
                </div>
              ) : (
                // Standard node parameters
                <>
                  {tool.configFields
                    ?.filter((f: any) => !['notice', 'hidden'].includes(f.type))
                    .map((field: any) => (
                      <div key={field.key} className="space-y-2">
                        <label className="text-[10px] font-bold text-muted/80">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={values[field.key] || ''}
                            onChange={(e) => handleUpdate({ [field.key]: e.target.value })}
                            className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40 resize-none"
                            rows={3}
                            placeholder={field.placeholder}
                          />
                        ) : (
                          <input
                            type="text"
                            value={values[field.key] || ''}
                            onChange={(e) => handleUpdate({ [field.key]: e.target.value })}
                            className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40"
                            placeholder={field.placeholder}
                          />
                        )}
                      </div>
                    ))}
                </>
              )}
            </div>
          )}

          {/* OUTPUT TAB */}
          {activeTab === 'output' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-muted/60" />
                <span className="text-[10px] font-bold uppercase text-muted/60">Execution Output</span>
              </div>

              {onTrigger && (
                <button
                  onClick={() => onTrigger(node.id)}
                  className="w-full px-4 py-2 bg-accent/20 hover:bg-accent/30 border border-accent/50 rounded-lg text-[10px] font-bold text-accent transition-all flex items-center justify-center gap-2"
                >
                  <Play size={12} fill="currentColor" />
                  Execute Step
                </button>
              )}

              {node.data.result ? (
                <div className="p-4 bg-black/40 border border-white/5 rounded-lg font-mono text-[9px] text-emerald-400 max-h-64 overflow-auto">
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(node.data.result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Loader2 size={20} className="mx-auto text-muted/20 mb-2 animate-spin" />
                  <p className="text-[11px] text-muted/50">Execute to see output</p>
                </div>
              )}
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {isPipedreamNode && isPreconfigured ? (
                <PipedreamNodeSettings
                  appSlug={values.appSlug}
                  platformName={values.platformName}
                  actionName={values.actionName}
                  credentialId={values.credentialId}
                  onCredentialSelect={(credentialId) => {
                    handleUpdate({ credentialId });
                  }}
                />
              ) : null}

              {/* Node Information */}
              <div className="space-y-3 pt-4 border-t border-border/50">
                <div className="text-[10px] font-bold uppercase text-muted/60">Node Information</div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-muted/60">Display Label</label>
                    <input
                      type="text"
                      value={values.label || ''}
                      onChange={(e) => handleUpdate({ label: e.target.value })}
                      className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-xs font-medium outline-none focus:border-foreground/40"
                    />
                  </div>

                  <div className="p-3 bg-foreground/[0.02] border border-border/40 rounded-lg text-[9px] font-mono text-muted/60">
                    <div><strong>Type:</strong> {tool.name}</div>
                    <div><strong>ID:</strong> {node.id}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
