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
import { useCreateAgent, useUpdateAgent, useArchitect, useAgent, useRunAgent, useAgentRun, usePublishAgent } from '@/hooks/useApi';
import { useCreateSkill, useUpdateSkill, useSkill, useRunSkill, useSkillArchitect } from '@/hooks/useSkills';
import { usePublishAsWorker } from '@/hooks/useApi'; // Legacy
import { useToast } from '@/components/ui/Toast';

import FlowNode from './builder/FlowNode';
import ToolSidebar from './builder/ToolSidebar';
import UnifiedSidebar, { InputParam } from './builder/UnifiedSidebar';
import BuilderTopbar from './builder/BuilderTopbar';
import ArchitectBar from './builder/ArchitectBar';
import EmployeeMetadataPanel from './builder/EmployeeMetadataPanel';
import { makeNode, getToolById, getToolByExecutionKey, INITIAL_NODES, INITIAL_EDGES, MODEL_TYPES, TOOL_REGISTRY, updateRegistryModels } from './builder/toolRegistry';
import api from '@/lib/api';

import { EDGE_DEFAULTS } from './builder/toolRegistry';
import { SaveModal } from './builder/SaveModal';

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
              w-7 h-7 bg-card border border-border text-foreground
              flex items-center justify-center cursor-pointer pointer-events-auto 
              opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full shadow-2xl
              hover:scale-125 hover:border-accent hover:bg-accent/10
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

  // Sync Intelligence (Models) - Segregated by provider
  useEffect(() => {
    const providers = ['google', 'openai', 'anthropic', 'openrouter'];
    
    providers.forEach(async (provider) => {
      try {
        const { data } = await api.get(`/models?provider=${provider}`);
        if (Array.isArray(data)) {
          updateRegistryModels(data, provider);
        }
      } catch (err) {
        console.error(`Failed to sync intelligence for ${provider}:`, err);
      }
    });
  }, []);

  const [nodes, setNodes, onNodesChange] = useNodesState(
    isSkillMode 
    ? [
        {
          id: 'skill_input',
          type: 'wareweNode',
          position: { x: 0, y: 50 },
          data: {
            label: 'Skill Input',
            toolId: 'skill.input',
            executionKey: 'trigger_manual', 
            isTrigger: true,
            status: 'idle',
            config: {},
          },
        },
        {
          id: 'skill_output',
          type: 'wareweNode',
          position: { x: 0, y: 450 },
          data: {
            label: 'Skill Output',
            toolId: 'skill.output',
            executionKey: 'skill_output',
            status: 'idle',
            config: {},
          },
        }
      ] as any
    : INITIAL_NODES as any
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    isSkillMode 
    ? [
        {
          id: 'e_skill_input_output',
          source: 'skill_input',
          sourceHandle: 'output',
          target: 'skill_output',
          targetHandle: 'input',
          ...EDGE_DEFAULTS,
        }
      ] as any
    : INITIAL_EDGES as any
  );
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
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  
  // Skill tool contract state (Relevance AI-style typed inputs)
  const [skillInputSchema, setSkillInputSchema] = useState<InputParam[]>([]);
  const [skillOutputDescription, setSkillOutputDescription] = useState('');
  const [showSkillInputsPanel, setShowSkillInputsPanel] = useState(false);
  const isEmployeeMode = mode === 'employee' || (existingItem?.isWorker === true);

  // Task: Dynamic Socket Sync
  useEffect(() => {
    if (!isSkillMode) return;
    setNodes(ns => ns.map(n => {
      if (n.id === 'skill_input' || n.data.toolId === 'skill.input') {
        if (JSON.stringify(n.data.inputSchema) === JSON.stringify(skillInputSchema)) return n;
        return { 
          ...n, 
          data: { 
            ...n.data, 
            inputSchema: skillInputSchema 
          } 
        };
      }
      return n;
    }));
  }, [skillInputSchema, isSkillMode, setNodes]);

  // ── Dynamic Scroll Bounds: Stop indefinite scrolling ──
  const dynamicTranslateExtent = useMemo<[[number, number], [number, number]]>(() => {
    if (!nodes || nodes.length === 0) return [[-200, -200], [1000, 1000]];
    
    // Find the vertical spread
    const yCoords = nodes.map(n => n.position.y);
    const minY = Math.min(...yCoords) - 250; // Padding for top
    const maxY = Math.max(...yCoords) + 450; // Padding for bottom (more at bottom for + button)
    
    // Force absolute horizontal deadlock around X=0 to prevent any drift
    return [[-0.01, minY], [0.01, maxY]];
  }, [nodes]);

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
  const { fitView } = useReactFlow();

  // ── Self-Healing Centering ────────────────────────────────────────────────
  // This ensures the workflow stays perfectly centered horizontally even if the user scrolls/pans
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 400, padding: 0.8, nodes: nodes });
    }, 50);
    return () => clearTimeout(timer);
  }, [nodes.length, fitView]); // Only trigger on structural changes to avoid jitter

  // ── Save ──────────────────────────────────────────────────────────────────
  const { mutateAsync: publishSkill } = usePublishAgent();

  const handleSave = useCallback(async (options: { silent?: boolean, nodesOverride?: any[], publishOptions?: { published: boolean, price: number } } = {}) => {
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

    // ── Pre-Save Audit ──────────────────────────────────────────────────────────
    const requiredCredentials = nodes.flatMap(node => {
      const toolId = node.data?.toolId || '';
      const config = node.data?.config || {};
      const credentialId = config.credentialId;
      
      if (!credentialId) return [];

      let provider = toolId.split('.')[0]; // e.g., 'github' from 'github.pull_request'
      if (toolId.startsWith('pipedream') || toolId.startsWith('pd:')) {
        provider = config.appSlug || 'pipedream';
      }

      return [{
        nodeId: node.id,
        provider,
        credentialId
      }];
    });

    const payload = {
      name,
      description,
      workflow: { nodes: cleanNodes, edges, model, requiredCredentials },
      category: 'Automation',
      // Skill tool contract — only included in skill mode
      ...(isSkillMode ? {
        inputSchema: skillInputSchema,
        outputDescription: skillOutputDescription,
      } : {})
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
              router.push('/employees');
            },
            onError: (err: any) => {
              toast.error('Failed to promote to employee: ' + (err?.message || 'Unknown error'));
            }
          });
        } catch (parseErr) {
          toast.error('Invalid JSON schema');
          return savedItem;
        }
      }

      if (!options.silent) {
        // If we have publish options, call the separate publish endpoint
        if (isSkillMode && options.publishOptions && savedItem?.id) {
          await publishSkill({ 
            id: savedItem.id, 
            published: options.publishOptions.published, 
            price: options.publishOptions.price 
          });
        }

        if (isSkillMode) {
          router.push('/skills');
        } else if (isEmployeeMode) {
          router.push('/employees');
        } else {
          router.push('/manager');
        }
      }

      return savedItem;
    } catch (err) {
      console.error("Save failed:", err);
      throw err;
    }
  }, [nodes, edges, name, description, model, itemId, updateAgent, createAgent, router, isEmployeeMode, employeeDescription, employeeInputSchema, publishAsWorker, publishSkill, toast]);

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
        
        const sourceNode = nodes.find(n => n.id === sourceId);
        if (!sourceNode) return;

        // Find ALL nodes downstream of the target node to shift them down
        const getDownstreamIds = (startId: string, visited = new Set<string>()): string[] => {
          if (visited.has(startId)) return [];
          visited.add(startId);
          const children = edges.filter(e => e.source === startId).map(e => e.target);
          return [startId, ...children.flatMap(c => getDownstreamIds(c, visited))];
        };
        const downstreamIds = getDownstreamIds(targetId);

        // Shift amount (standard vertical gap)
        const SHIFT_Y = 150;

        // Insert node in the middle (vertical) - Force X alignment with source
        const newNode = makeNode(toolId, { x: sourceNode.position.x, y: position.y }, nodes, override || (getToolById(toolId) as any).override) as any;
        if (!newNode) return;

        // Apply Shift to downstream nodes
        setNodes(ns => ns.map(n => downstreamIds.includes(n.id) ? { ...n, position: { ...n.position, y: n.position.y + SHIFT_Y } } : n).concat(newNode));

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

        setEdges(es => es.filter(e => e.id !== edgeId).concat(edgeToNew, edgeFromNew));
        setSelectedNode(newNode);
        setPickerState(null);
        setSidebarOpen(false); // Auto-close tool sidebar on successful add
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
    setSidebarOpen(false); // Auto-close tool sidebar on successful add
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

    // Load tool contract if this is a skill
    if (isSkillMode) {
      setSkillInputSchema(existingItem.inputSchema || []);
      setSkillOutputDescription(existingItem.outputDescription || '');
    }
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
    setSidebarOpen(false); // Task 1: Auto-close Tool Sidebar
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
      : { x: 0, y: 50 };
    const newNode = makeNode(toolId, pos, nodes, override) as any;
    if (newNode) {
      setNodes(ns => ns.concat(newNode));
      
      // ─── AUTO-CONNECT ───
      // If there's a selected node, connect from it to the new node
      const sourceNode = selectedNode || nodes[nodes.length - 1];
      
      if (sourceNode && !sourceNode.data?.executionKey.includes('sticky_note')) {
        const lastTool = getToolById(sourceNode.data.toolId);
        const newTool = getToolById(newNode.data.toolId);
        
        if (lastTool && newTool && lastTool.outputs.length > 0 && newTool.inputs.length > 0) {
          const sourceHandle = lastTool.outputs[0]?.name || 'output';
          const targetHandle = newTool.inputs[0]?.name || 'input';
          
          const newEdge = {
            id: `e_${sourceNode.id}_${newNode.id}_${Date.now()}`,
            source: sourceNode.id,
            sourceHandle: sourceHandle,
            target: newNode.id,
            targetHandle: targetHandle,
            ...EDGE_DEFAULTS,
          };
          
          setEdges(es => addEdge(newEdge, es));
        }
      }

      setSelectedNode(newNode);
    }
    setSidebarOpen(false); 
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
  }, [nodes, selectedNode, isSkillMode]);

  // Handle cross-component UI events
  useEffect(() => {
    const handleOpenContract = () => setShowSkillInputsPanel(true);
    window.addEventListener('warewe:open-contract-tab', handleOpenContract);
    return () => window.removeEventListener('warewe:open-contract-tab', handleOpenContract);
  }, []);

  // ── Upstream Variable Resolution ──────────────────────────────────────────
  // IMPORTANT: Must be above the early return below to obey Rules of Hooks.
  const getUpstreamVariables = useCallback((targetNodeId: string) => {
    const upstreamNodes = new Set<string>();
    const stack = [targetNodeId];

    while (stack.length > 0) {
      const current = stack.pop()!;
      const incomingEdges = edges.filter(e => e.target === current);
      for (const edge of incomingEdges) {
        if (!upstreamNodes.has(edge.source)) {
          upstreamNodes.add(edge.source);
          stack.push(edge.source);
        }
      }
    }

    const variables: any[] = [];
    const sortedUpstream = Array.from(upstreamNodes)
      .map(id => nodes.find(n => n.id === id))
      .filter(Boolean)
      .sort((a: any, b: any) => a.position.y - b.position.y);

    const discoverNested = (obj: any, path: string = ''): string[] => {
      if (!obj || typeof obj !== 'object' || (path && path.split('.').length > 5)) return [];
      return Object.entries(obj).flatMap(([k, v]) => {
        const fullK = path ? `${path}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          return [fullK, ...discoverNested(v, fullK)];
        }
        return [fullK];
      });
    };

    for (const node of sortedUpstream) {
      if (!node) continue;
      const tool = getToolById(node.data.toolId);
      let vars: string[] = [];

      // 1. Live Result Discovery (if node has run)
      if (node.data.result && typeof node.data.result === 'object') {
        vars = discoverNested(node.data.result);
      } 

      // 2. Schema-based Discovery (Design-time or fallback)
      if (vars.length === 0) {
        if (node.data.toolId === 'skill.input') {
          vars = skillInputSchema.flatMap(p => {
            const self = [p.name];
            if (p.type === 'json' && p.defaultValue) {
              try {
                const parsed = typeof p.defaultValue === 'string' ? JSON.parse(p.defaultValue) : p.defaultValue;
                if (parsed && typeof parsed === 'object') {
                  return [...self, ...discoverNested(parsed, p.name)];
                }
              } catch (e) {}
            }
            return self;
          });
        } else if (tool) {
          vars = tool.outputs.map(o => o.name);
        }
      }

      if (vars.length > 0) {
        variables.push({
          nodeId: node.id,
          nodeLabel: node.data.label || (tool?.label),
          vars: Array.from(new Set(vars)) // Deduplicate
        });
      }
    }

    return variables;
  }, [nodes, edges, skillInputSchema]);

  const deleteSelectedNode = useCallback((nodeId?: string) => {
    const idToDelete = nodeId || selectedNode?.id;
    if (!idToDelete) return;

    // PROTECT SKILL GATEWAYS: Cannot delete input or output nodes in skill mode
    if (isSkillMode && (idToDelete === 'skill_input' || idToDelete === 'skill_output')) {
      const nodeName = idToDelete === 'skill_input' ? 'Input' : 'Output';
      toast.error(`The Skill ${nodeName} node is mandatory for defining your tool contract and cannot be removed.`);
      return;
    }

    // --- COORDINATE-BASED REFLOW: Shift EVERYTHING below up ---
    const targetNode = nodes.find(n => n.id === idToDelete);
    if (!targetNode) return;
    const targetY = targetNode.position.y;
    const SHIFT_UP = -150;

    setNodes(ns => ns.filter(n => n.id !== idToDelete).map(n => 
      n.position.y > targetY 
      ? { ...n, position: { ...n.position, y: n.position.y + SHIFT_UP } } 
      : n
    ));
    
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
        // Sync skill contract into the input node data so picker can see it
        ...(n.data?.toolId === 'skill.input' ? { inputSchema: skillInputSchema } : {}),
        onTrigger: handleTrigger,
        onAddConnect: handleAddConnect,
        onDelete: deleteSelectedNode,
        isEmployeeMode,
        onUpdate: (nid: string, newData: any) => {
          setNodes(ns => ns.map(n => n.id === nid ? { ...n, data: { ...n.data, ...newData } } : n));
        }
      }
    })),
    [nodes, handleTrigger, handleAddConnect, deleteSelectedNode, skillInputSchema],
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
    <div className="flex flex-col h-screen w-full overflow-hidden bg-secondary">

      {/* ── Topbar */}
      <BuilderTopbar
        name={name}
        onNameChange={setName}
        model={model}
        onModelChange={setModel}
        onBack={() => {
          if (isSkillMode) router.push('/skills');
          else if (isEmployeeMode) router.push('/employees');
          else router.push('/manager');
        }}
        onReset={() => { if(confirm('Reset current graph?')) { setNodes(INITIAL_NODES as any); setEdges(INITIAL_EDGES as any); setSelectedNode(null); } }}
        onSave={() => setIsPublishModalOpen(true)}
        onRun={handleTrigger}
        isRunning={isRunning}
        isSaving={isSaving || isPublishingWorker}
        isEditMode={!!itemId}
        userName={user.name}
        userAvatar={user.avatarUrl}
        isEmployeeMode={isEmployeeMode}
      />

      {/* ── Body */}
      <div className="flex flex-1 overflow-hidden p-4">

        {/* Left: Node palette */}
        <div className="z-50">
          <ToolSidebar 
            onAddTool={addToolNode} 
            isOpen={sidebarOpen} 
            onToggle={() => { setSidebarOpen(s => !s); if (sidebarOpen) setPickerState(null); }} 
            socketType={pickerState?.socketType}
            isSkillMode={isSkillMode}
            filter={isSkillMode ? (tool: any) => !tool.id.startsWith('trigger_') && tool.id !== 'trigger_manual' : undefined}
          />
        </div>

        {/* Centre: Canvas Area */}
        <div className="flex-1 relative overflow-hidden bg-background rounded-[2.5rem] border border-border ml-4 shadow-2xl">
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
            zoomOnScroll={false}
            panOnScroll={true}
            panOnScrollMode={PanOnScrollMode.Vertical}
            zoomOnPinch={false}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            nodeOrigin={[0.5, 0]}
            panOnDrag={true}
            translateExtent={[[-2000, dynamicTranslateExtent[0][1]], [2000, dynamicTranslateExtent[1][1]]]}
            minZoom={0.8}
            maxZoom={0.8}
            fitView
            proOptions={{ hideAttribution: true }}
            fitViewOptions={{ padding: 0.8, maxZoom: 0.8 }}
            defaultEdgeOptions={{
              ...EDGE_DEFAULTS,
              style: { strokeWidth: 1.5, transition: 'stroke 0.5s' }
            }}
            deleteKeyCode={null}
          >
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={24} 
              size={1} 
              color="currentColor" 
              className="text-foreground/[0.03]"
            />

            {/* Zoom Controls — bottom-right (n8n style) */}
            <Controls
              className="!bg-card !border-border/40 !shadow-2xl !rounded-2xl overflow-hidden !m-8 scale-[0.85] !flex-row !h-fit"
              position="bottom-right"
              showInteractive={false}
            />

            {/* MiniMap — bottom-left */}
            <MiniMap 
              className="!bg-card !border-border/40 !rounded-2xl !shadow-2xl !m-8 overflow-hidden"
              zoomable
              nodeBorderRadius={12}
              maskColor="var(--secondary)"
              nodeColor="var(--primary)"
              nodeStrokeColor="var(--primary)"
              nodeStrokeWidth={2}
            />
          </ReactFlow>

          {/* AI Architect chat bar */}
          <ArchitectBar
            onGenerate={handleArchitect}
            isGenerating={isArchitecting}
          />

          {/* Generation overlay */}
          {isArchitecting && (
            <div className="absolute inset-0 bg-background z-50 flex flex-col items-center justify-center animate-in fade-in duration-700">
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

        {/* Right Panel: Unified Intelligence Sidebar */}
        <UnifiedSidebar
          context={selectedNode ? 'NODE' : (isSkillMode ? 'SKILL' : 'AGENT')}
          node={selectedNode}
          nodes={nodes}
          edges={edges}
          onClose={() => setSelectedNode(null)}
          onUpdateNode={updateSelectedNode}
          onDeleteNode={deleteSelectedNode}
          onTriggerNode={handleTrigger}
          // Global Settings
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          inputSchema={skillInputSchema}
          onInputSchemaChange={setSkillInputSchema}
          outputDescription={skillOutputDescription}
          onOutputDescriptionChange={setSkillOutputDescription}
          // Variable Intelligence
          upstreamVariables={selectedNode ? getUpstreamVariables(selectedNode.id) : []}
        />
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
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-background/90"
              onClick={() => setIsPublishing(false)} 
            />
            
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-4xl bg-card border border-border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[600px]"
            >
              {/* Left: Branding & Status */}
              <div className="md:w-1/3 bg-muted p-10 flex flex-col justify-between border-r border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                
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
                <div className="flex items-center justify-between p-8 shrink-0 border-b border-border/40 bg-secondary/10">
                   <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                      <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Workforce Registry Configuration</span>
                   </div>
                   <button 
                     onClick={() => setIsPublishing(false)}
                     className="w-10 h-10 rounded-xl bg-secondary border border-border/40 flex items-center justify-center hover:bg-muted transition-all text-muted-foreground hover:text-foreground"
                   >
                     <X size={18} strokeWidth={2.5} />
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

                <div className="p-10 bg-secondary/10 border-t border-border/40 flex items-center justify-between shrink-0">
                   <div className="hidden sm:block">
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest italic">Final Review: Promotion to Production Fleet</p>
                   </div>
                   <button
                     onClick={() => handleSave()}
                     disabled={isSaving || isPublishingWorker}
                     className="h-14 px-10 bg-indigo-600 text-white font-bold uppercase tracking-widest text-[11px] rounded-xl flex items-center gap-3 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                   >
                     {isSaving || isPublishingWorker ? (
                       <Loader2 size={16} className="animate-spin" />
                     ) : (
                       <>
                         Confirm & Promote to Workforce
                         <SendHorizonal size={16} strokeWidth={2.5} />
                       </>
                     )}
                   </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SaveModal 
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        onSave={() => {
          setIsPublishModalOpen(false);
          handleSave();
        }}
        isSaving={isSaving}
        isEditMode={!!itemId}
      />
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
