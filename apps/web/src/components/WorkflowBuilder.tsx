'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Plus } from 'lucide-react';
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
  getSmoothStepPath,
  useReactFlow,
  ReactFlowProvider,
  BaseEdge,
  PanOnScrollMode,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, SendHorizonal, ShieldCheck, Loader2 } from 'lucide-react';
import 'reactflow/dist/style.css';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useTheme } from 'next-themes';
import { useCreateAgent, useUpdateAgent, useArchitect, useAgent, useRunAgent, useAgentRun } from '@/hooks/useApi';
import { useCreateSkill, useUpdateSkill, useSkill, useRunSkill, useSkillArchitect } from '@/hooks/useSkills';
import { usePublishAsWorker } from '@/hooks/useApi'; // Legacy
import { useToast } from '@/components/ui/Toast';

import FlowNode from './builder/FlowNode';
import ToolSidebar from './builder/ToolSidebar';
import NodeSidebar from './builder/NodeSidebar';
import BuilderTopbar from './builder/BuilderTopbar';
import ArchitectBar from './builder/ArchitectBar';
import EmployeeMetadataPanel from './builder/EmployeeMetadataPanel';
import { makeNode, getToolById, getToolByExecutionKey, INITIAL_NODES, INITIAL_EDGES, MODEL_TYPES, TOOL_REGISTRY } from './builder/toolRegistry';

import { EDGE_DEFAULTS } from './builder/toolRegistry';

// ─── Deletable edge with ✕ button ──────────────────────────────────────────────
function DeletableEdge({
  id, source, target, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  sourceHandleId, targetHandleId,
  style, markerEnd, selected, animated,
}: EdgeProps) {
  const { setEdges, setNodes, project } = useReactFlow();

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
    borderRadius: 16,
  });

  // This will be handled by the parent AgentBuilder to show the picker
  const onInsert = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const event = new CustomEvent('warewe:insert-node', {
      detail: {
        edgeId: id,
        sourceId: source,
        targetId: target,
        sourceHandle: sourceHandleId,
        targetHandle: targetHandleId,
        position: { x: labelX, y: labelY }
      }
    });
    window.dispatchEvent(event);
  }, [id, source, target, sourceHandleId, targetHandleId, labelX, labelY]);

  return (
    <g className="group">
      <BaseEdge
        path={edgePath}
        style={{ strokeWidth: 20, stroke: 'transparent' }}
      />
      
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: animated ? '#10b981' : (selected ? 'var(--foreground)' : '#444'),
          strokeWidth: animated ? 3 : (selected ? 2 : 1.5),
          strokeDasharray: '6,6',
          opacity: 1,
          transition: 'stroke 0.4s, stroke-width 0.4s',
        }}
      />
      
      <foreignObject
        width={40}
        height={40}
        x={labelX - 20}
        y={labelY - 20}
        className="overflow-visible pointer-events-none"
      >
        <div className="w-full h-full flex items-center justify-center">
          <div
            className={`
              w-7 h-7 bg-[#232329] border border-white/20 text-white
              flex items-center justify-center cursor-pointer pointer-events-auto 
              opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full shadow-2xl
              hover:scale-125 hover:border-accent hover:bg-black/40
              ${selected ? 'opacity-100 scale-110 !border-accent' : ''}
            `}
            onClick={onInsert}
          >
            <span className="text-sm font-bold leading-none select-none pointer-events-none">+</span>
          </div>
        </div>
      </foreignObject>
    </g>
  );
}

// ─── normalise architect output ─────────────────────────────────────────────────
function normaliseArchitectNodes(rawNodes: any[], rawEdges: any[]) {
  const nodeCounters: Record<string, number> = {};
  const idMap: Record<string, string> = {};

  const nodes = rawNodes.map((n: any, i: number) => {
    const knownIds = new Set(TOOL_REGISTRY.map(t => t.id));
    const knownExecKeys = new Set(TOOL_REGISTRY.map(t => n.data?.executionKey === t.executionKey));

    let resolvedTool = (n.data?.toolId && (knownIds.has(n.data.toolId) || n.data.toolId.startsWith('pd:')))
      ? (n.data.toolId.startsWith('pd:') ? getToolById(n.data.toolId) : TOOL_REGISTRY.find(t => t.id === n.data.toolId)!)
      : null;

    if (!resolvedTool) {
      const execKey = n.data?.executionKey;
      resolvedTool = TOOL_REGISTRY.find(t => t.executionKey === execKey) ?? null;
    }

    if (!resolvedTool) {
      const query = (n.data?.label || n.label || n.name || '').toLowerCase();
      resolvedTool = TOOL_REGISTRY.find(t => 
        query.includes(t.label.toLowerCase()) || 
        query.includes(t.name.toLowerCase())
      ) || TOOL_REGISTRY[0]!;
    }

    // GENERATE CLEAN ID: e.g. llm_gemini_1
    const prefix = resolvedTool.id.replace('.', '_');
    nodeCounters[prefix] = (nodeCounters[prefix] || 0) + 1;
    const newId = (resolvedTool.isTrigger && !prefix.includes('trigger')) 
       ? `trigger_${prefix}_${nodeCounters[prefix]}`
       : `${prefix}_${nodeCounters[prefix]}`;
    
    idMap[n.id] = newId;

    const aiConfig = n.data?.config || {};
    const flatConfig = { ...n.data };
    delete (flatConfig as any).config;
    delete (flatConfig as any).label;
    delete (flatConfig as any).toolId;
    delete (flatConfig as any).executionKey;
    delete (flatConfig as any).isTrigger;
    delete (flatConfig as any).status;

    return {
      id: newId,
      type: 'wareweNode',
      position: n.position || { x: 400, y: 50 + i * 200 },
      data: {
        label: n.data?.label || n.label || resolvedTool.label,
        toolId: resolvedTool.id,
        description: resolvedTool.description,
        executionKey: resolvedTool.executionKey,
        isTrigger: resolvedTool.isTrigger,
        status: 'idle',
        config: { ...flatConfig, ...aiConfig },
      },
      zIndex: resolvedTool.executionKey === 'sticky_note' ? -50 : 0,
    };
  });

  // Re-map edges using NEW IDs
  const edges = (rawEdges || []).map((e: any, idx: number) => ({ 
    ...e, 
    id: `e-${idMap[e.source] || e.source}-${idMap[e.target] || e.target}-${idx}`,
    source: idMap[e.source] || e.source,
    target: idMap[e.target] || e.target,
    ...EDGE_DEFAULTS 
  }));

  // Re-map variables in config to use NEW IDs
  nodes.forEach(node => {
     const cfg = node.data.config;
     Object.keys(cfg).forEach(key => {
        if (typeof cfg[key] === 'string') {
           Object.keys(idMap).forEach(oldId => {
              const regex = new RegExp(`\\{\\{\\s*${oldId}\\.`, 'g');
              cfg[key] = cfg[key].replace(regex, `{{ ${idMap[oldId]}.`);
           });
        }
     });
  });

  return { nodes, edges };
}

// ─── Inner builder (needs ReactFlowProvider context) ──────────────────────────
function WorkflowBuilderInner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const itemId = searchParams.get('id');
  const mode = searchParams.get('mode'); // 'skill' or 'employee' (legacy)
  const isSkillMode = mode === 'skill' || pathname.includes('/skills');

  // Switchable Hooks
  const { data: existingItem, isLoading: isItemLoading } = isSkillMode ? useSkill(itemId) : useAgent(itemId);
  
  const { mutateAsync: createAgent, isPending: isCreatingAgent } = useCreateAgent();
  const { mutateAsync: updateAgent, isPending: isUpdatingAgent } = useUpdateAgent();
  const { mutateAsync: createSkill, isPending: isCreatingSkill } = useCreateSkill();
  const { mutateAsync: updateSkill, isPending: isUpdatingSkill } = useUpdateSkill();
  
  const isCreating = isCreatingAgent || isCreatingSkill;
  const isUpdating = isUpdatingAgent || isUpdatingSkill;
  
  const { mutate: architectAgent, isPending: isArchitectingAgent } = useArchitect();
  const { mutate: architectSkill, isPending: isArchitectingSkill } = useSkillArchitect();
  const isArchitecting = isArchitectingAgent || isArchitectingSkill;
  
  const { mutate: runAgent } = useRunAgent();
  const { mutate: runSkill } = useRunSkill();

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
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [ctrlPressed, setCtrlPressed] = useState(false);

  // Employee mode state (Legacy/Hybrid)
  const [employeeDescription, setEmployeeDescription] = useState('');
  const [employeeInputSchema, setEmployeeInputSchema] = useState('{}');
  const [isPublishing, setIsPublishing] = useState(false);
  const isEmployeeMode = mode === 'employee' || (existingItem?.isWorker === true);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => { if (e.key === 'Control' || e.metaKey) setCtrlPressed(true); };
    const handleUp = (e: KeyboardEvent) => { if (e.key === 'Control' || e.metaKey) setCtrlPressed(false); };
    window.addEventListener('keydown', handleDown);
    window.addEventListener('keyup', handleUp);
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); };
  }, []);

  const { user, isLoading: authLoading } = useAuthStore();
  const { mutateAsync: publishAsWorker, isPending: isPublishingWorker } = usePublishAsWorker();

  const { data: runData } = useAgentRun(activeRunId);
  const { theme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (options: { silent?: boolean, nodesOverride?: any[] } = {}) => {
    // Validate employee mode: description is required
    if (isEmployeeMode && !options.silent && !employeeDescription.trim()) {
      toast.error('Capability Description is required. Managers use it to discover and call this employee.');
      return;
    }

    // Priority: 1. override, 2. current state
    const nodesToSave = options.nodesOverride || nodes;

    // Strip out injected handlers AND execution statuses before saving
    const cleanNodes = nodesToSave.map(({ data: { onTrigger, onAddConnect, onDelete, onUpdate, status, result, isEmployeeMode: _, ...rest }, ...n }: any) => ({
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
      let savedItem: any;
      if (itemId) {
        if (isSkillMode) {
          savedItem = await updateSkill({ id: itemId, skillData: payload });
        } else {
          savedItem = await updateAgent({ id: itemId, agentData: payload });
        }
      } else {
        if (isSkillMode) {
          savedItem = await createSkill(payload);
        } else {
          savedItem = await createAgent(payload);
        }
      }

      // If in employee mode and not silent save, also promote/update as worker
      if (isEmployeeMode && !options.silent && savedItem?.id) {
        try {
          const schemaObj = employeeInputSchema.trim() ? JSON.parse(employeeInputSchema) : {};
          publishAsWorker({
            id: savedItem.id,
            isWorker: true,
            workerDescription: employeeDescription,
            workerInputSchema: schemaObj
          }, {
            onSuccess: () => {
              setIsPublishing(false); // Close modal on success
              toast.success('Employee Unit Initialized!');
              router.push('/agents');
            },
            onError: (err: any) => {
              toast.error('Failed to promote to employee: ' + (err?.message || 'Unknown error'));
            }
          });
        } catch (parseErr) {
          toast.error('Invalid JSON schema');
          return savedItem;
        }
      } else if (!options.silent) {
        router.push('/agents');
      }

      return savedItem;
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  }, [nodes, edges, name, description, model, itemId, updateAgent, createAgent, router, isEmployeeMode, employeeDescription, employeeInputSchema, publishAsWorker, toast]);

  const handleTrigger = useCallback(async (nodeId?: string, inputDataOverride?: any) => {
    if (isRunning) return;
    
    // Reset all node statuses immediately on click
    const freshNodes = nodes.map(n => ({ ...n, data: { ...n.data, status: null, result: null } }));
    setActiveRunId(null);
    setNodes(freshNodes);
    setEdges(es => es.map(e => ({ ...e, animated: false, style: { ...e.style, stroke: (e.targetHandle || '').toLowerCase().includes('tool') ? '#bbb' : '#777', strokeWidth: 1.5 } })));

    // 1. Auto-save current state before running (and get the ID if it's new)
    let currentItemId = itemId;
    try {
      const savedItem = await handleSave({ silent: true, nodesOverride: freshNodes }) as any;
      if (savedItem?.id) currentItemId = savedItem.id;
    } catch (err) {
      toast.error('Failed to save workflow before running.');
      return;
    }

    if (!currentItemId || currentItemId === 'undefined') {
      toast.error('Please save your workflow at least once before running it.');
      return;
    }

    // 2. Resolve which node is starting (and its run mode)
    const requestId = typeof nodeId === 'string' ? nodeId : undefined;
    const isSingleMode = false; // Force full execution so data always transfers to downstream nodes

    let targetId = requestId;
    if (!targetId) {
      // Global Run: Resolve starting trigger node
      const manualNode = nodes.find(n => n.data?.toolId === 'trigger.manual' || n.data?.executionKey === 'trigger_manual');
      const anyTrigger = nodes.find(n => n.data?.isTrigger || n.data?.toolId?.startsWith('trigger.'));
      
      targetId = manualNode?.id || anyTrigger?.id || (selectedNode ? selectedNode.id : nodes[0]?.id);
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

    console.log("[Builder] Triggering run:", currentItemId, "Start Node:", targetId, "Input:", inputData);
    
    const runOptions = {
      onSuccess: (res: any) => {
        setActiveRunId(res.runId);
        setIsRunning(true);
      },
      onError: (err: any) => {
        toast.error('Failed to start the run: ' + (err?.response?.data?.error || err.message || 'Unknown error'));
      }
    };

    if (isSkillMode) {
      runSkill({ skillId: currentItemId as string, triggerNodeId: targetId, inputData, runMode: isSingleMode ? 'single' : 'full' }, runOptions);
    } else {
      runAgent({ agentId: currentItemId as string, triggerNodeId: targetId, inputData, runMode: isSingleMode ? 'single' : 'full' }, runOptions);
    }
  }, [itemId, isRunning, runAgent, runSkill, setNodes, nodes, edges, name, description, model, handleSave, isSkillMode]);

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
        
        return { 
          ...edge, 
          animated: isFlowing,
          style: { 
            ...edge.style, 
            stroke: isFlowing ? '#10b981' : 'rgba(255,255,255,0.1)',
            strokeWidth: isFlowing ? 3 : 1.5,
            transition: 'stroke 0.8s, stroke-width 0.8s'
          }
        };
      }));
    }
  }, [runData, setNodes, setEdges]);

  // ── Handle Node Insertion (from Edge + button) ──
  useEffect(() => {
    const handleInsert = (e: any) => {
      setPickerState({ 
        insertion: true, 
        ...e.detail 
      });
      setSidebarOpen(true);
    };
    window.addEventListener('warewe:insert-node', handleInsert);
    return () => window.removeEventListener('warewe:insert-node', handleInsert);
  }, []);

  const handleAddConnect = useCallback((params: any) => {
    setPickerState(params);
    setSidebarOpen(true);
  }, []);

  const handlePickerSelect = useCallback((toolId: string, override?: any) => {
    if (!pickerState) return;

    // --- CASE A: INSERTION BETWEEN NODES ---
    if (pickerState.insertion) {
      const { sourceId, targetId, edgeId, sourceHandle, targetHandle, position } = pickerState;
      // Insert node in the middle (vertical)
      const newNode = makeNode(toolId, { x: position.x, y: position.y }, nodes, override || (getToolById(toolId) as any).override) as any;
      if (!newNode) return;

      const sourceNode = nodes.find(n => n.id === sourceId);
      const targetNode = nodes.find(n => n.id === targetId);

      // Create new edges
      const edgeToNew = {
        id: `e_${sourceId}_${newNode.id}_${Date.now()}`,
        source: sourceId,
        sourceHandle: sourceHandle || 'output',
        target: newNode.id,
        targetHandle: 'input',
        ...EDGE_DEFAULTS,
      };

      const edgeFromNew = {
        id: `e_${newNode.id}_${targetId}_${Date.now()}`,
        source: newNode.id,
        sourceHandle: 'output',
        target: targetId,
        targetHandle: targetHandle || 'input',
        ...EDGE_DEFAULTS,
      };

      setNodes(ns => ns.concat(newNode));
      setEdges(es => es.filter(e => e.id !== edgeId).concat(edgeToNew, edgeFromNew));
      setSelectedNode(newNode);
      setPickerState(null);
      return;
    }

    // --- CASE B: STANDARD APPEND ---
    const { nodeId, handleId, handleType, socketType } = pickerState;
    const baseNode = nodes.find(n => n.id === nodeId);
    if (!baseNode) return;

    // Create new node offset from base (Top-Down)
    const isTarget = handleType === 'target';
    const newPos = {
      x: baseNode.position.x,
      y: isTarget ? baseNode.position.y - 150 : baseNode.position.y + 150
    };
    const newTool = getToolById(toolId);
    const newNode = makeNode(toolId, newPos, nodes, override || (newTool as any).override || pickerState.override) as any;

    if (!newNode) {
      setPickerState(null);
      return;
    }

    setNodes(ns => ns.concat(newNode));

    // Connect them
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
    setSelectedNode(newNode);
    setPickerState(null);
  }, [pickerState, nodes, setNodes, setEdges]);


  const nodeTypes = useMemo(() => ({ wareweNode: FlowNode }), []);
  const edgeTypes = useMemo(() => ({ deletableEdge: DeletableEdge }), []);

  // ── Load existing item ────────────────────────────────────────────────────
  useEffect(() => {
    if (!existingItem) return;
    setName(existingItem.name ?? 'Untitled Workflow');
    setDescription(existingItem.description ?? '');

    // Load employee metadata if this is a worker/employee
    if (existingItem.isWorker) {
      setEmployeeDescription(existingItem.workerDescription ?? '');
      setEmployeeInputSchema(JSON.stringify(existingItem.workerInputSchema ?? {}, null, 2));
    }

    const wf = existingItem.workflow;
    if (wf?.nodes?.length) {
      setNodes(wf.nodes.map((n: any) => ({
        ...n,
        type: 'wareweNode',
        data: n.data || { status: 'idle', config: {} }
      })));
      setEdges((wf.edges ?? []).map((e: any, idx: number) => ({
        ...e,
        id: e.id || `e-${e.source}-${e.target}-${idx}`,
        ...EDGE_DEFAULTS
      })));
    }
    if (wf?.model) setModel(wf.model);
  }, [existingItem, setNodes, setEdges]);

  useEffect(() => { if (!authLoading && !user) router.push('/'); }, [user, authLoading, router]);

  // ── ReactFlow callbacks ─────────────────────────────────────────────────────
  const isValidConnection = useCallback((connection: Connection) => {
    // 1. Basic validation
    if (!connection.source || !connection.target || connection.source === connection.target) return false;

    // 2. LINEAR ENFORCEMENT: Each handle (Source or Target) can have only ONE connection.
    // In Employee Mode, we define linearity more strictly: no branching from the NODE itself.
    if (isEmployeeMode) {
      const nodeHasSourceEdge = edges.some(e => e.source === connection.source);
      const nodeHasTargetEdge = edges.some(e => e.target === connection.target);
      if (nodeHasSourceEdge || nodeHasTargetEdge) {
        return false; // Strictly linear: one in, one out for the whole node
      }
    } else {
      const sourceHasEdge = edges.some(e => e.source === connection.source && e.sourceHandle === connection.sourceHandle);
      const targetHasEdge = edges.some(e => e.target === connection.target && e.targetHandle === connection.targetHandle);

      if (sourceHasEdge || targetHasEdge) {
        return false; // Already connected in the linear chain
      }
    }

    // 3. Resolve Tool Definitions
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    const sourceTool = sourceNode ? getToolById(sourceNode.data.toolId) : null;
    const targetTool = targetNode ? getToolById(targetNode.data.toolId) : null;
    if (!sourceTool || !targetTool) return false;

    // 4. Type Compatibility
    const sourceSocket = sourceTool.outputs.find(o => o.name === connection.sourceHandle) || sourceTool.outputs[0];
    const targetSocket = targetTool.inputs.find(i => i.name === connection.targetHandle) || targetTool.inputs[0];
    if (!sourceSocket || !targetSocket) return false;

    const sourceType = sourceSocket.type;
    const targetType = targetSocket.type;

    // Standard data flow logic
    const dataTypes = ['data', 'json', 'string', 'any', 'tool', 'model'];
    return dataTypes.includes(targetType) && dataTypes.includes(sourceType);
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, ...EDGE_DEFAULTS }, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((_: any, node: any) => {
    // If it's a sticky note, we don't want to open the side panel
    if (node.data?.executionKey === 'sticky_note') {
       setSelectedNode(node);
       return;
    }
    setSelectedNode(node);
  }, []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  // ── Edge right-click delete ────────────────────────────────────────────────
  const onEdgeContextMenu = useCallback((e: React.MouseEvent, edge: Edge) => {
    e.preventDefault();
    setEdges(eds => eds.filter(ed => ed.id !== edge.id));
  }, [setEdges]);

  // ── Tool actions ─────────────────────────────────────────────────────────────
  const addToolNode = (toolId: string, override?: { label?: string, icon?: string, appSlug?: string, actionName?: string, platformName?: string }) => {
    if (pickerState) {
      handlePickerSelect(toolId, override);
      setPickerState(null);
      return;
    }
    const last = nodes[nodes.length - 1];
    const pos = last
      ? { x: last.position.x, y: last.position.y + 150 }
      : { x: 400, y: 50 };
    const newNode = makeNode(toolId, pos, nodes, override) as any;
    if (newNode) {
      setNodes(ns => ns.concat(newNode));
      setSelectedNode(newNode);

      // ─── AUTO-CONNECT (Employee Mode) ───
      // If we're in employee mode and there's a previous node, connect them automatically
      if (isEmployeeMode && last && !last.data?.executionKey.includes('sticky_note')) {
        const lastTool = getToolById(last.data.toolId);
        const newTool = getToolById(newNode.data.toolId);
        
        if (lastTool && newTool) {
          const sourceHandle = lastTool.outputs[0]?.name || 'output';
          const targetHandle = newTool.inputs[0]?.name || 'input';
          
          const newEdge = {
            id: `e_${last.id}_${newNode.id}_${Date.now()}`,
            source: last.id,
            sourceHandle: sourceHandle,
            target: newNode.id,
            targetHandle: targetHandle,
            ...EDGE_DEFAULTS,
          };
          
          setEdges(es => addEdge(newEdge, es));
        }
      }
    }
    setSidebarOpen(false); // Auto-close sidebar after adding
  };

  const updateSelectedNode = useCallback((updates: any) => {
    if (!selectedNode) return;
    setNodes(ns => ns.map(n => n.id === selectedNode.id ? { 
      ...n, 
      data: { 
        ...n.data, 
        config: { ...n.data.config, ...updates } 
      } 
    } : n));
    
    // Sync local selectedNode so children (like sidebars) see the update
    setSelectedNode((p: any) => {
      if (!p) return null;
      return {
        ...p,
        data: {
          ...p.data,
          config: { ...p.data.config, ...updates }
        }
      };
    });
  }, [selectedNode, setNodes]);

  const deleteSelectedNode = useCallback((nodeId?: string) => {
    const idToDelete = nodeId || selectedNode?.id;
    if (!idToDelete) return;

    setNodes(ns => ns.filter(n => n.id !== idToDelete));
    
    setEdges(es => {
      const incoming = es.filter(e => e.target === idToDelete);
      const outgoing = es.filter(e => e.source === idToDelete);
      let nextEdges = es.filter(e => e.source !== idToDelete && e.target !== idToDelete);
      
      if (incoming.length === 1 && outgoing.length > 0) {
        const sourceEdge = incoming[0];
        if (sourceEdge) {
          const newEdges = outgoing.map(targetEdge => ({
            id: `e_heal_${sourceEdge.source}_${targetEdge.target}_${Date.now()}`,
            source: sourceEdge.source,
            sourceHandle: sourceEdge.sourceHandle,
            target: targetEdge.target,
            targetHandle: targetEdge.targetHandle,
            ...EDGE_DEFAULTS,
          }));
          nextEdges = [...nextEdges, ...newEdges];
        }
      }
      return nextEdges;
    });

    if (selectedNode?.id === idToDelete) setSelectedNode(null);
  }, [selectedNode, setNodes, setEdges, edges]);

  // Inject handlers into every node's data
  const nodesWithHandlers = useMemo(
    () => nodes.map(n => ({
      ...n,
      zIndex: n.data?.executionKey === 'sticky_note' ? -50 : (n.zIndex ?? 0),
      className: n.data?.executionKey === 'sticky_note' ? 'sticky-note-wrapper' : '',
      data: {
        ...(n.data || { status: 'idle', config: {} }),
        onTrigger: handleTrigger,
        onAddConnect: handleAddConnect,
        onDelete: deleteSelectedNode,
        isEmployeeMode,
        onUpdate: (nid: string, newData: any) => {
          setNodes(ns => ns.map(n => n.id === nid ? { ...n, data: { ...n.data, ...newData } } : n));
        }
      }
    })),
    [nodes, handleTrigger, handleAddConnect, deleteSelectedNode],
  );


  // ── AI Architect ──────────────────────────────────────────────────────────
  const handleArchitect = (prompt: string, history: {role: string; content: string}[]) => {
    if (!prompt.trim()) return;
    
    const archOptions = {
      onSuccess: (data: any) => {
        if (data?.nodes?.length) {
          const { nodes: ns, edges: es } = normaliseArchitectNodes(data.nodes, data.edges ?? []);
          setNodes(ns as any);
          setEdges(es as any);
          if (data.name) setName(data.name);
          if (data.description) setDescription(data.description);

          // IMPORTANT: Update selected node reference if one was selected
          // This ensures the sidebar panel sees the FRESH data.config from the Architect
          setSelectedNode((prev: any) => {
            if (!prev) return null;
            const fresh = ns.find(n => n.id === prev.id);
            return fresh || null;
          });
        }
        const explanation = data?.explanation || `Workflow "${data?.name || 'Unnamed'}" has been placed on the canvas. Connect your credentials to each node before running.`;
        setTimeout(() => (window as any).__architectAddMsg?.(explanation, 'explanation'), 100);
      },
      onError: (err: any) => {
        toast.error('Architect failed: ' + (err?.response?.data?.error || err.message));
      }
    };
    
    if (isSkillMode) {
      architectSkill({ prompt, history }, archOptions);
    } else {
      architectAgent({ prompt, history }, archOptions);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (authLoading || !user || (itemId && isItemLoading)) {
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
        onSave={() => isEmployeeMode ? setIsPublishing(true) : handleSave()}
        onRun={handleTrigger}
        isRunning={isRunning}
        isSaving={isSaving || isPublishingWorker}
        isEditMode={!!itemId}
        userName={user.name}
        userAvatar={user.avatarUrl}
        isEmployeeMode={isEmployeeMode}
      />

      {/* ── Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: Node palette */}
        <ToolSidebar 
          onAddTool={addToolNode} 
          isOpen={sidebarOpen} 
          onToggle={() => { setSidebarOpen(s => !s); if (sidebarOpen) setPickerState(null); }} 
          socketType={pickerState?.socketType}
        />

        {/* Centre: Canvas — Deep Aether Interface */}
        <div className="flex-1 relative overflow-hidden bg-[#0d0d12]">
          <button
            onClick={() => setSidebarOpen(true)}
            className={`
              absolute top-8 left-8 z-50 w-12 h-12 bg-foreground text-background rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 group
              ${sidebarOpen ? 'opacity-0 pointer-events-none scale-0' : 'opacity-100 scale-100'}
            `}
          >
            <div className="absolute inset-0 bg-foreground/20 rounded-2xl animate-ping group-hover:block hidden" />
            <Plus size={24} className="group-hover:rotate-90 transition-transform duration-500" />
            <span className="absolute left-full ml-4 px-3 py-1.5 bg-black/80 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
               Add New Node
            </span>
          </button>

          <ReactFlow
            nodes={nodesWithHandlers}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            isValidConnection={isValidConnection}
            onNodeClick={onNodeClick}
            elevateNodesOnSelect={false}
            onPaneClick={onPaneClick}
            onEdgeContextMenu={onEdgeContextMenu}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            zoomOnScroll={ctrlPressed}
            panOnScroll={!ctrlPressed}
            panOnScrollMode={PanOnScrollMode.Free}
            zoomOnPinch={true}
            minZoom={0.05}
            maxZoom={4}
            fitView
            proOptions={{ hideAttribution: true }}
            fitViewOptions={{ padding: 0.8, maxZoom: 0.7 }}
            defaultEdgeOptions={{
              ...EDGE_DEFAULTS,
              style: { strokeWidth: 1.5, stroke: 'rgba(255,255,255,0.1)', transition: 'stroke 0.5s' }
            }}
            deleteKeyCode={['Backspace', 'Delete']}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={24} 
              size={1.2} 
              color="rgba(255,255,255,0.06)" 
              className="bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.03)_0%,_transparent_70%)]"
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
              nodeColor={(n: any) => {
                if (n.data?.executionKey === 'sticky_note') return 'rgba(120, 120, 120, 0.08)';
                return 'var(--foreground)';
              }}
              nodeStrokeColor={(n: any) => (n.data?.executionKey === 'sticky_note' ? 'transparent' : 'rgba(0,0,0,0.1)')}
              nodeBorderRadius={8}
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

        {/* Floating Tool Picker removed in favor of Sidebar integration */}

        {/* Right Panel: Clean Sidebar in building phase */}
        {selectedNode && selectedNode.data?.executionKey !== 'sticky_note' ? (
          <NodeSidebar
            key={selectedNode.id}
            node={selectedNode}
            nodes={nodes}
            edges={edges}
            onClose={() => setSelectedNode(null)}
            onUpdate={updateSelectedNode}
            onDelete={deleteSelectedNode}
            onTrigger={handleTrigger}
          />
        ) : null}
      </div>

      {/* ── Employee Finalize Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {isPublishing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-20"
          >
            {/* Backdrop Blur */}
            <div 
              className="absolute inset-0 bg-[#070708]/80 backdrop-blur-3xl"
              onClick={() => setIsPublishing(false)} 
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-4xl bg-[#111114] border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
            >
              {/* Left: Branding & Status */}
              <div className="md:w-1/3 bg-accent/5 p-10 flex flex-col justify-between border-r border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-white shadow-2xl shadow-accent/20 mb-8 animate-pulse">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="text-3xl font-black uppercase text-white tracking-tighter italic leading-none mb-4">
                    Initialize <br /> Specialized <br /> Unit
                  </h2>
                  <p className="text-[10px] uppercase font-black tracking-widest text-accent/60">Deployment Matrix Ready</p>
                </div>

                <div className="relative z-10 space-y-4">
                   <div className="flex items-center gap-3 text-white/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Logic Encoded</span>
                   </div>
                   <div className="flex items-center gap-3 text-white/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Waiting for Identity</span>
                   </div>
                </div>
              </div>

              {/* Right: Interaction */}
              <div className="flex-1 flex flex-col bg-[#0c0c0e] overflow-hidden">
                <div className="flex items-center justify-between p-8 shrink-0">
                   <div className="flex items-center gap-3">
                      <Bot size={20} className="text-accent" />
                      <span className="text-xs font-black uppercase tracking-widest text-white/80">Protocol Configuration</span>
                   </div>
                   <button 
                     onClick={() => setIsPublishing(false)}
                     className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all"
                   >
                     <X size={18} />
                   </button>
                </div>

                <div className="flex-1 overflow-y-auto px-10 pb-10 custom-scrollbar">
                   <EmployeeMetadataPanel
                      description={employeeDescription}
                      onDescriptionChange={setEmployeeDescription}
                      inputSchema={employeeInputSchema}
                      onInputSchemaChange={setEmployeeInputSchema}
                   />
                </div>

                <div className="p-10 bg-black/40 border-t border-white/5 flex items-center justify-between shrink-0">
                   <div className="hidden sm:block">
                      <p className="text-[9px] text-white/20 font-black uppercase tracking-widest">Final Phase: Promotion to Worker Status</p>
                   </div>
                   <button
                     onClick={() => handleSave()}
                     disabled={isSaving || isPublishingWorker}
                     className="h-14 px-10 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center gap-3 hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                   >
                     {isSaving || isPublishingWorker ? (
                       <Loader2 size={16} className="animate-spin" />
                     ) : (
                       <>
                         Confirm & Publish Unit
                         <SendHorizonal size={16} />
                       </>
                     )}
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Wrap in ReactFlowProvider so DeletableEdge can call useReactFlow ─────────
export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  );
}
