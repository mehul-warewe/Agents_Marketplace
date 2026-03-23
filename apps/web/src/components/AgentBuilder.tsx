'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  MarkerType,
  Edge,
  Connection,
  EdgeProps,
  getBezierPath,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import { useCreateAgent, useUpdateAgent, useArchitect, useAgent, useRunAgent, useAgentRun } from '@/hooks/useApi';
import { useToast } from '@/components/ui/Toast';

import FlowNode from './builder/FlowNode';
import ToolSidebar from './builder/ToolSidebar';
import NodeConfigPanel from './builder/NodeConfigPanel';
import BuilderTopbar from './builder/BuilderTopbar';
import ArchitectBar from './builder/ArchitectBar';
import { makeNode, getToolById, getToolByExecutionKey, INITIAL_NODES, INITIAL_EDGES, MODEL_TYPES, TOOL_REGISTRY } from './builder/toolRegistry';

// ─── Edge defaults ─────────────────────────────────────────────────────────────
const EDGE_DEFAULTS = {
  type: 'deletableEdge',
  animated: false,
  markerEnd: { 
    type: MarkerType.ArrowClosed, 
    width: 12, 
    height: 12,
    color: '#777',
  },
  style: { 
    strokeWidth: 1.5, 
    stroke: '#777', 
    opacity: 0.9 
  },
};

// ─── Deletable edge with ✕ button ──────────────────────────────────────────────
function DeletableEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  sourceHandleId, targetHandleId,
  style, markerEnd, selected, animated,
}: EdgeProps) {
  const { setEdges } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const onDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEdges(eds => eds.filter(edge => edge.id !== id));
  }, [id, setEdges]);

  const isAgentic = targetHandleId?.toLowerCase().includes('tool') || 
                    targetHandleId?.toLowerCase().includes('model') || 
                    targetHandleId?.toLowerCase().includes('memory') || 
                    targetHandleId?.toLowerCase().includes('parser');

  return (
    <g className="group">
      {/* Invisible wider hit area for easier interaction */}
      <BaseEdge
        path={edgePath}
        style={{ strokeWidth: 20, stroke: 'transparent' }}
      />
      
      {/* Visible edge */}
      <BaseEdge
        path={edgePath}
        markerEnd={isAgentic ? undefined : markerEnd}
        style={{
          ...style,
          stroke: animated ? '#10b981' : (selected ? 'var(--foreground)' : (isAgentic ? '#bbb' : '#777')),
          strokeWidth: animated ? 3.5 : (selected ? 2.5 : (isAgentic ? 2.5 : 1.5)),
          strokeDasharray: isAgentic ? '7,4' : 'none',
          opacity: (selected || animated) ? 1 : (isAgentic ? 0.6 : 0.9),
          transition: 'stroke 0.4s, stroke-width 0.4s, opacity 0.4s, stroke-dashoffset 0.1s linear',
        }}
      />
      
      {/* Delete button — only visible on hover/select */}
      <foreignObject
        width={20}
        height={20}
        x={labelX - 10}
        y={labelY - 10}
        className="overflow-visible pointer-events-none"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          className={`
            w-5 h-5 bg-card border border-border/60 text-foreground 
            flex items-center justify-center cursor-pointer pointer-events-auto 
            opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full shadow-lg
            ${selected ? 'opacity-100 scale-110 !border-foreground/40' : 'hover:scale-110'}
          `}
          onClick={onDelete}
        >
          <span className="text-[8px] font-black leading-none">✕</span>
        </div>
      </foreignObject>
    </g>
  );
}

// ─── normalise architect output ─────────────────────────────────────────────────
function normaliseArchitectNodes(rawNodes: any[], rawEdges: any[]) {
  const nodes = rawNodes.map((n: any, i: number) => {
    const knownIds = new Set(TOOL_REGISTRY.map(t => t.id));
    const knownExecKeys = new Set(TOOL_REGISTRY.map(t => t.executionKey));

    // Primary: match by toolId
    let resolvedTool = (n.data?.toolId && knownIds.has(n.data.toolId))
      ? TOOL_REGISTRY.find(t => t.id === n.data.toolId)!
      : null;

    // Fallback 1: match by executionKey
    if (!resolvedTool) {
      const execKey = n.data?.executionKey;
      if (execKey && knownExecKeys.has(execKey)) {
        resolvedTool = TOOL_REGISTRY.find(t => t.executionKey === execKey) ?? null;
      }
    }

    // Fallback 2: fuzzy label match
    if (!resolvedTool) {
      const label = (n.data?.label || '').toLowerCase();
      const toolId =
        label.includes('chat') && label.includes('input') ? 'trigger.chat'
        : label.includes('trigger') || label.includes('manual') || label.includes('start') ? 'trigger.manual'
        : label.includes('gmail') || label.includes('email') ? 'google.gmail'
        : label.includes('drive') ? 'google.drive'
        : label.includes('calendar') ? 'google.calendar'
        : label.includes('sheet') ? 'google.sheets'
        : label.includes('openai') || label.includes('gpt') ? 'model.openai'
        : label.includes('gemini') ? 'model.gemini'
        : label.includes('claude') ? 'model.claude'
        : label.includes('openrouter') ? 'model.openrouter'
        : label.includes('agent') || label.includes('llm') || label.includes('synthesis') ? 'ai.llm'
        : i === 0 ? 'trigger.manual' : 'ai.llm';
      resolvedTool = getToolById(toolId);
    }

    return {
      id: n.id || `node_${i + 1}`,
      type: 'wareweNode',
      position: n.position || { x: 100 + i * 320, y: 200 },
      data: {
        label: n.data?.label || resolvedTool.label,
        toolId: resolvedTool.id,          // preserve so getToolById() works on reload
        description: resolvedTool.description,
        executionKey: resolvedTool.executionKey,
        isTrigger: resolvedTool.isTrigger,
        status: 'idle',
        config: n.data?.config || {}, // Preserve AI generated config!
      },
    };
  });

  const edges = rawEdges.map((e: any) => ({ ...e, ...EDGE_DEFAULTS }));
  return { nodes, edges };
}

// ─── Inner builder (needs ReactFlowProvider context) ──────────────────────────
function AgentBuilderInner() {
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');

  const { data: existingAgent, isLoading: isAgentLoading } = useAgent(agentId);
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES as any);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES as any);
  const [name, setName]               = useState('Untitled Workflow');
  const [description, setDescription] = useState('');
  const [model, setModel]             = useState<string>(MODEL_TYPES[0]?.id || 'google/gemini-2.0-flash-001');
  const [prompt, setPrompt]           = useState('');
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [activeRunId, setActiveRunId]   = useState<string | null>(null);
  const [isRunning,   setIsRunning]     = useState(false);
  const [pickerState, setPickerState]   = useState<any>(null);
  const [sidebarOpen, setSidebarOpen]   = useState(true);
  const [pickerSearch, setPickerSearch] = useState('');

  const { user, isLoading: authLoading } = useAuthStore();
  const { mutate: createAgent, isPending: isCreating } = useCreateAgent();
  const { mutate: updateAgent, isPending: isUpdating } = useUpdateAgent();
  const { mutate: architect,   isPending: isArchitecting } = useArchitect();
  const { mutate: runAgent,    isPending: isStartingRun }  = useRunAgent();

  const { data: runData } = useAgentRun(activeRunId);
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (options: { silent?: boolean, nodesOverride?: any[] } = {}) => {
    // Priority: 1. override, 2. current state
    const nodesToSave = options.nodesOverride || nodes;

    // Strip out injected handlers AND execution statuses before saving
    const cleanNodes = nodesToSave.map(({ data: { onTrigger, onAddConnect, status, result, ...rest }, ...n }: any) => ({ 
      ...n, 
      data: rest 
    }));
    const payload = {
      name,
      description,
      workflow: { nodes: cleanNodes, edges, model },
      category: 'Automation',
    };

    try {
      if (agentId) {
        const result = await (updateAgent as any).mutateAsync({ id: agentId, agentData: payload });
        if (!options.silent) {
          router.push('/agents');
        }
        return result;
      } else {
        const result = await (createAgent as any).mutateAsync(payload);
        if (!options.silent) {
          router.push('/agents');
        }
        return result;
      }
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  }, [nodes, edges, name, description, model, agentId, updateAgent, createAgent, router]);

  const handleTrigger = useCallback(async (nodeId?: string, inputDataOverride?: any) => {
    if (isRunning) return;
    
    // Reset all node statuses immediately on click
    const freshNodes = nodes.map(n => ({ ...n, data: { ...n.data, status: null, result: null } }));
    setActiveRunId(null);
    setNodes(freshNodes);
    setEdges(es => es.map(e => ({ ...e, animated: false, style: { ...e.style, stroke: (e.targetHandle || '').toLowerCase().includes('tool') ? '#bbb' : '#777', strokeWidth: 1.5 } })));

    // 1. Auto-save current state before running (and get the ID if it's new)
    let currentAgentId = agentId;
    try {
      const savedAgent = await handleSave({ silent: true, nodesOverride: freshNodes }) as any;
      if (savedAgent?.id) currentAgentId = savedAgent.id;
    } catch (err) {
      toast.error('Failed to save workflow before running.');
      return;
    }

    if (!currentAgentId || currentAgentId === 'undefined') {
      toast.error('Please save your workflow at least once before running it.');
      return;
    }

    // 2. Resolve which node is starting code
    let targetId = nodeId;
    if (!targetId) {
      // Priority: Manual Trigger > Any other trigger > First node
      const manualNode = nodes.find(n => n.data?.toolId === 'trigger.manual' || n.data?.executionKey === 'trigger_manual');
      const anyTrigger = nodes.find(n => n.data?.isTrigger || n.data?.toolId?.startsWith('trigger.'));
      targetId = manualNode?.id || anyTrigger?.id || nodes[0]?.id;
    }

    // 3. Extract specific input data
    let inputData: any = inputDataOverride || {};
    if (targetId && !inputDataOverride) {
      const node = nodes.find(n => n.id === targetId);
      const config = node?.data?.config || {};
      if (config.test_input) {
        inputData = { message: config.test_input };
      }
    }

    console.log("[Builder] Triggering run for Agent:", currentAgentId, "Start Node:", targetId, "Input:", inputData);
    runAgent({ agentId: currentAgentId as string, triggerNodeId: targetId, inputData }, {
      onSuccess: (res: any) => {
        setActiveRunId(res.runId);
        setIsRunning(true);
      },
      onError: (err: any) => {
        toast.error('Failed to start the run: ' + (err?.response?.data?.error || err.message || 'Unknown error'));
      }
    });
  }, [agentId, isRunning, runAgent, setNodes, nodes, edges, name, description, model, handleSave]);

  // Sync Node Statuses from Polling Run Data
  useEffect(() => {
    if (!runData) return;

    if (runData.status === 'completed' || runData.status === 'failed') {
      setIsRunning(false);

      if (runData.status === 'failed') {
        // Try to get a friendly error from the output
        const output = runData.output as any;
        const errMsg = output?.error || output?.report || 'The workflow failed. Check your credentials and try again.';
        toast.error(errMsg);
      } else if (runData.status === 'completed') {
        // Only toast success if there was an agent result
        const output = runData.output as any;
        if (output?.failed) {
          toast.error(output.error || 'The agent encountered an error.');
        } else {
          toast.success('Workflow completed successfully!');
        }
      }
    }

    if (runData.logs && Array.isArray(runData.logs)) {
      setNodes(ns => ns.map(node => {
        const log = (runData.logs as any[]).find(l => l.nodeId === node.id);
        if (log) {
          const status = log.status === 'executing' ? 'running' : log.status;
          return { 
            ...node, 
            data: { 
              ...node.data, 
              status, 
              result: log.result 
            } 
          };
        }
        return node;
      }));

      // ─── Update Edges to show flow animation ───
      setEdges(es => es.map(edge => {
        const srcLog = (runData.logs as any[]).find(l => l.nodeId === edge.source);
        const targetLog = (runData.logs as any[]).find(l => l.nodeId === edge.target);

        // Logic: Animate if source has data (completed) and target has at least started
        const isFlowing = srcLog?.status === 'completed' && (targetLog?.status === 'executing' || targetLog?.status === 'completed');
        
        if (isFlowing && !edge.animated) {
          return { ...edge, animated: true };
        } else if (!isFlowing && edge.animated) {
          return { ...edge, animated: false };
        }
        return edge;
      }));
    }
  }, [runData, setNodes, setEdges]);

  const handleAddConnect = useCallback((params: any) => {
    setPickerState(params);
  }, []);

  const handlePickerSelect = useCallback((toolId: string) => {
    if (!pickerState) return;
    const { nodeId, handleId, handleType, socketType } = pickerState;
    const baseNode = nodes.find(n => n.id === nodeId);
    if (!baseNode) return;

    // Create new node offset from base
    const isTarget = handleType === 'target';
    const newPos = { 
      x: isTarget ? baseNode.position.x - 300 : baseNode.position.x + 300, 
      y: baseNode.position.y 
    };
    const newNode = makeNode(toolId, newPos) as any;
    
    setNodes(ns => ns.concat(newNode));

    // Connect them
    const newTool = getToolById(toolId);
    let newEdge: any;

    if (isTarget) {
      // Current node is TARGET, new node is SOURCE
      const sourceHandle = newTool.outputs.find(out => 
        out.type === socketType || out.type === 'any' || (socketType === 'data' && (out.type === 'json' || out.type === 'string'))
      )?.name || 'output';

      newEdge = {
        id: `e_${newNode.id}_${nodeId}_${Date.now()}`,
        source: newNode.id,
        sourceHandle: sourceHandle,
        target: nodeId,
        targetHandle: handleId,
        ...EDGE_DEFAULTS,
      };
    } else {
      // Current node is SOURCE (default), new node is TARGET
      const targetHandle = newTool.inputs.find(inp =>
        inp.type === socketType || inp.type === 'any' || (socketType === 'data' && (inp.type === 'json' || inp.type === 'string'))
      )?.name || 'input';

      newEdge = {
        id: `e_${nodeId}_${newNode.id}_${Date.now()}`,
        source: nodeId,
        sourceHandle: handleId,
        target: newNode.id,
        targetHandle: targetHandle,
        ...EDGE_DEFAULTS,
      };
    }

    setEdges(es => addEdge(newEdge, es));
    setPickerState(null);
  }, [pickerState, nodes, setNodes, setEdges]);

  // Inject handlers into every node's data
  const nodesWithHandlers = useMemo(
    () => nodes.map(n => ({ 
      ...n, 
      data: { 
        ...n.data, 
        onTrigger: handleTrigger,
        onAddConnect: handleAddConnect
      } 
    })),
    [nodes, handleTrigger, handleAddConnect],
  );

  const nodeTypes = useMemo(() => ({ wareweNode: FlowNode }), []);
  const edgeTypes = useMemo(() => ({ deletableEdge: DeletableEdge }), []);

  // ── Load existing agent ────────────────────────────────────────────────────
  useEffect(() => {
    if (!existingAgent) return;
    setName(existingAgent.name ?? 'Untitled Workflow');
    setDescription(existingAgent.description ?? '');
    const wf = existingAgent.workflow;
    if (wf?.nodes?.length) {
      setNodes(wf.nodes.map((n: any) => ({ ...n, type: 'wareweNode' })));
      setEdges((wf.edges ?? []).map((e: any) => ({ ...e, ...EDGE_DEFAULTS })));
    }
    if (wf?.model) setModel(wf.model);
  }, [existingAgent, setNodes, setEdges]);

  useEffect(() => { if (!authLoading && !user) router.push('/'); }, [user, authLoading, router]);

  // ── ReactFlow callbacks ─────────────────────────────────────────────────────
  const isValidConnection = useCallback((connection: Connection) => {
    // 1. Get Source & Target Nodes
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return false;

    // 2. Resolve Tool Definitions
    const sourceTool = getToolById(sourceNode.data.toolId);
    const targetTool = getToolById(targetNode.data.toolId);
    if (!sourceTool || !targetTool) return false;

    // 3. Find specific Sockets
    const sourceSocket = sourceTool.outputs.find(o => o.name === connection.sourceHandle) || sourceTool.outputs[0];
    const targetSocket = targetTool.inputs.find(i => i.name === connection.targetHandle) || targetTool.inputs[0];
    if (!sourceSocket || !targetSocket) return false;

    // 4. Type Compatibility Logic
    const sourceType = sourceSocket.type;
    const targetType = targetSocket.type;

    // Models must connect to Model ports, Memory must connect to Memory ports, Parsers to Parser ports.
    const strictTypes = ['model', 'memory', 'parser'];
    if (strictTypes.includes(targetType) || strictTypes.includes(sourceType)) {
      return sourceType === targetType;
    }

    // --- RULE 2: Tool Attachment ---
    // Many technical 'data' nodes are logically 'tools' for the Agent (Gmail, YouTube, etc.)
    if (targetType === 'tool' || targetType === 'memory') {
      const isActionNode = !['Triggers', 'Models', 'AI'].includes(sourceTool.category);
      const isDatabase = sourceTool.category === 'Databases';

      if (targetType === 'memory') {
        return sourceType === 'memory' || isDatabase;
      }
      return sourceType === 'tool' || (sourceType === 'data' && isActionNode);
    }

    // --- RULE 3: Flexible Data Flow ---
    // data, json, string, any are interchangeable for standard processing
    const dataTypes = ['data', 'json', 'string', 'any'];
    if (dataTypes.includes(targetType) && dataTypes.includes(sourceType)) {
      return true;
    }

    return sourceType === targetType;
  }, [nodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, ...EDGE_DEFAULTS }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: any) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // ── Edge right-click delete ────────────────────────────────────────────────
  const onEdgeContextMenu = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault();
    setEdges(eds => eds.filter(ed => ed.id !== edge.id));
  }, [setEdges]);

  // ── Tool actions ─────────────────────────────────────────────────────────────
  const addToolNode = (toolId: string) => {
    const last = nodes[nodes.length - 1];
    const pos = last
      ? { x: last.position.x + 280, y: last.position.y }
      : { x: 200, y: 200 };
    const newNode = makeNode(toolId, pos) as any;
    setNodes(ns => ns.concat(newNode));
    setSelectedNode(newNode);
  };

  const updateSelectedNode = useCallback((newData: any) => {
    if (!selectedNode) return;
    setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ...newData } } : n));
    setSelectedNode((p: any) => p ? { ...p, data: { ...p.data, ...newData } } : null);
  }, [selectedNode, setNodes]);

  const deleteSelectedNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes(ns => ns.filter(n => n.id !== selectedNode.id));
    setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges]);


  // ── AI Architect ──────────────────────────────────────────────────────────
  const handleArchitect = (prompt: string, history: {role: string; content: string}[]) => {
    if (!prompt.trim() || isArchitecting) return;
    architect({ prompt, history }, {
      onSuccess: (data: any) => {
        if (data?.nodes?.length) {
          const { nodes: ns, edges: es } = normaliseArchitectNodes(data.nodes, data.edges ?? []);
          setNodes(ns as any);
          setEdges(es as any);
          if (data.name) setName(data.name);
          if (data.description) setDescription(data.description);
        }
        // Push explanation back into the chat
        const explanation = data?.explanation || `Workflow "${data?.name || 'Unnamed'}" has been placed on the canvas. Connect your credentials to each node before running.`;
        setTimeout(() => (window as any).__architectAddMsg?.(explanation, 'explanation'), 100);
      },
      onError: (err: any) => {
        setTimeout(() => (window as any).__architectAddMsg?.('Failed to generate workflow. Please try rephrasing.', 'error'), 100);
      }
    });
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (authLoading || !user || (agentId && isAgentLoading)) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-foreground border-t-transparent animate-spin rounded-full mb-8" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted opacity-40">Initialising_Protocol...</p>
      </div>
    );
  }

  const isSaving = isCreating || isUpdating;

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background font-inter">

      {/* ── Topbar */}
      <BuilderTopbar
        name={name}
        onNameChange={setName}
        model={model}
        onModelChange={setModel}
        onBack={() => router.back()}
        onReset={() => { setNodes(INITIAL_NODES as any); setEdges(INITIAL_EDGES as any); setSelectedNode(null); }}
        onSave={handleSave}
        onRun={handleTrigger}
        isRunning={isRunning}
        isSaving={isSaving}
        isEditMode={!!agentId}
        userName={user.name}
        userAvatar={user.avatarUrl}
      />

      {/* ── Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Node palette */}
        <ToolSidebar onAddTool={addToolNode} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(s => !s)} />

        {/* Centre: Canvas */}
        <div className="flex-1 relative overflow-hidden bg-background">
          <ReactFlow
            nodes={nodesWithHandlers}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onEdgeContextMenu={onEdgeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 1.2 }}
            defaultEdgeOptions={EDGE_DEFAULTS}
            deleteKeyCode={['Backspace', 'Delete']}
            className={theme === 'dark' ? 'dark' : ''}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color={theme === 'dark' ? '#222' : '#ddd'}
              gap={24}
              size={1}
            />

            {/* Zoom Controls — bottom-right (n8n style) */}
            <Controls
              className="!bg-card !border-border/40 !shadow-2xl !rounded-2xl overflow-hidden !m-8 scale-[0.85] !flex-row !h-fit"
              position="bottom-right"
              showInteractive={false}
            />

            {/* MiniMap — bottom-left */}
            <MiniMap
              style={{
                background: 'var(--card)',
                border: `1px solid var(--border)`,
                borderRadius: '1.25rem',
                margin: '2rem',
                width: 180,
                height: 120,
                overflow: 'hidden',
                boxShadow: '0 10px 40px -10px rgb(0 0 0 / 0.15)',
                opacity: 0.8
              }}
              position="bottom-left"
              nodeColor={() => 'var(--foreground)'}
              maskColor="rgba(var(--background-rgb, 0,0,0), 0.1)"
              zoomable
              pannable
            />
          </ReactFlow>

          {/* AI Architect chat bar */}
          <ArchitectBar
            onGenerate={handleArchitect}
            isGenerating={isArchitecting}
          />

          {/* Generation overlay */}
          {isArchitecting && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center animate-in fade-in duration-700">
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-2 border-foreground border-t-transparent animate-spin rounded-full" />
                <div className="text-center">
                  <p className="text-[12px] font-black uppercase tracking-[0.4em] text-foreground">Architecting_Flow</p>
                  <p className="text-[10px] text-muted font-bold uppercase tracking-[0.2em] mt-2 opacity-40">Connecting logical nodes via neural mesh...</p>
                </div>
              </div>
            </div>
          )}

          {/* Keyboard hint */}
          <div className="absolute top-4 right-4 flex items-center gap-3 text-[9px] text-muted font-bold uppercase tracking-widest opacity-25 select-none pointer-events-none">
            <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[8px]">Del</kbd>
            removes node
            <span className="mx-1">/</span>
            <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-[8px]">R_Click</kbd>
            removes edge
          </div>
        </div>

        {/* Floating Tool Picker */}
        {pickerState && (
          <div
            className="fixed inset-0 z-[100]"
            onClick={() => { setPickerState(null); setPickerSearch(''); }}
          >
            <div
              style={{ left: pickerState.clientX, top: pickerState.clientY }}
              className="absolute bg-card border border-border/60 rounded-2xl shadow-2xl p-2 w-80 animate-in zoom-in-95 duration-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-3 py-2 border-b border-border/40 mb-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Choose next node</p>
                <div className="relative">
                  <input
                    autoFocus
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    placeholder="Search tools..."
                    className="w-full px-3 py-2 bg-foreground/[0.03] border border-border/40 rounded-lg text-[11px] outline-none focus:border-foreground/40 transition-all"
                  />
                </div>
              </div>
              <div className="max-h-[340px] overflow-y-auto custom-scrollbar">
                {/* Filtered compatible tools */}
                {Object.entries(
                  ['AI', 'Models', 'Tools', 'Logic', 'Data', 'Databases', 'Output'].reduce((acc: any, cat) => {
                    const tools = TOOL_REGISTRY.filter((t: any) => {
                      if (t.category !== cat) return false;
                      // Apply search filter
                      if (pickerSearch.trim()) {
                        const q = pickerSearch.toLowerCase();
                        if (!t.label.toLowerCase().includes(q) && !t.category.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
                      }
                      // Check if tool has a compatible input
                      return t.inputs.some((inp: any) =>
                        inp.type === pickerState.socketType ||
                        inp.type === 'any' ||
                        (pickerState.socketType === 'data' && (inp.type === 'json' || inp.type === 'string')) ||
                        (pickerState.socketType === 'json' && inp.type === 'data') ||
                        (pickerState.socketType === 'string' && inp.type === 'data')
                      );
                    });
                    if (tools.length) acc[cat] = tools;
                    return acc;
                  }, {})
                ).map(([cat, tools]: [string, any]) => (
                  <div key={cat} className="mb-4 last:mb-0">
                    <p className="px-3 text-[8px] font-black text-muted uppercase tracking-tighter mb-1">{cat}</p>
                    {tools.map((t: any) => (
                      <button
                        key={t.id}
                        onClick={() => { handlePickerSelect(t.id); setPickerSearch(''); }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-foreground/5 flex items-center gap-3 transition-colors group"
                      >
                        <div className={`p-1.5 rounded-md ${t.bg} border border-border/40 shrink-0`}>
                          {typeof t.icon === 'string' ? (
                            <img src={t.icon} alt={t.label} className="w-3.5 h-3.5 object-contain" />
                          ) : (
                            <t.icon size={14} className={t.color} />
                          )}
                        </div>
                        <span className="text-[11px] font-bold truncate group-hover:text-foreground">{t.label}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Right: Node inspector */}
        {selectedNode && (
          <NodeConfigPanel
            node={selectedNode}
            onUpdate={updateSelectedNode}
            onClose={() => setSelectedNode(null)}
            onDelete={deleteSelectedNode}
            onTrigger={handleTrigger}
            nodes={nodes}
            edges={edges}
          />
        )}
      </div>
    </div>
  );
}

// ─── Wrap in ReactFlowProvider so DeletableEdge can call useReactFlow ─────────
export default function AgentBuilder() {
  return (
    <ReactFlowProvider>
      <AgentBuilderInner />
    </ReactFlowProvider>
  );
}
