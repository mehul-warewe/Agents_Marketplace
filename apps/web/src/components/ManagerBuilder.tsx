'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Connection,
  ReactFlowProvider,
  ConnectionLineType,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCreateManager, useUpdateManager, useManager } from '@/hooks/useManager';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/components/ui/Toast';
import { motion } from 'framer-motion';
import {
  Save, Loader2, ChevronRight, LayoutGrid,
  ArrowLeft, Users,
} from 'lucide-react';

import {
  ManagerHubNode,
  EmployeeNode,
  ToolNode,
  TriggerNode,
  ConditionNode,
  NoteNode,
} from './builder/ManagerFlowNodes';
import UnitTray from './builder/UnitTray';
import NodeInspector from './builder/NodeInspector';
import AssignmentEdge from './builder/AssignmentEdge';

/* ─── ReactFlow registries ──────────────────────────────────────────────────── */
const nodeTypes = {
  hub:       ManagerHubNode,
  employee:  EmployeeNode,
  tool:      ToolNode,
  trigger:   TriggerNode,
  condition: ConditionNode,
  note:      NoteNode,
};

const edgeTypes = {
  assignment: AssignmentEdge,
};

/* ─── Default canvas state ──────────────────────────────────────────────────── */
const INITIAL_NODES = [
  {
    id: 'manager_hub',
    type: 'hub',
    position: { x: 360, y: 260 },
    data: { name: 'New Manager', goal: '' },
    dragHandle: '.drag-handle',
  },
];

/* ─── Inner Component ───────────────────────────────────────────────────────── */
function ManagerBuilderInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const managerId    = searchParams.get('id');
  const toast        = useToast();

  const { data: employeeRegistry, isLoading: isRegistryLoading } = useEmployees();
  const { data: existingManager,  isLoading: isManagerLoading  } = useManager(managerId);
  const { mutateAsync: createManager, isPending: isCreating } = useCreateManager();
  const { mutateAsync: updateManager, isPending: isUpdating } = useUpdateManager();

  const [nodes, setNodes, onNodesChange] = useNodesState<any>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  const managerName = nodes.find((n) => n.id === 'manager_hub')?.data?.name || 'New Manager';

  /* Hydrate canvas from saved manager */
  useEffect(() => {
    if (existingManager && !isInitialized && employeeRegistry) {
      const hubNode = {
        ...INITIAL_NODES[0],
        data: { name: existingManager.name, goal: existingManager.goal ?? '' },
        dragHandle: '.drag-handle',
      };

      const employeeNodes = (existingManager.employeeIds ?? [])
        .map((id: string, idx: number) => {
          const emp = employeeRegistry.find((w: any) => w.id === id);
          if (!emp) return null;
          return {
            id: `employee-${id}`,
            type: 'employee',
            position: { x: 820, y: 140 + idx * 220 },
            data: { ...emp, isPlaceholder: false },
            dragHandle: '.drag-handle',
          };
        })
        .filter(Boolean);

      const assignmentEdges = (existingManager.employeeIds ?? []).map((id: string) => ({
        id:       `edge-hub-${id}`,
        source:   'manager_hub',
        target:   `employee-${id}`,
        type:     'assignment',
        animated: true,
      }));

      setNodes([hubNode, ...employeeNodes]);
      setEdges(assignmentEdges);
      setIsInitialized(true);
    }
  }, [existingManager, employeeRegistry, isInitialized, setNodes, setEdges]);

  /* Connection handler */
  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) =>
      addEdge(
        { ...params, id: `edge-${params.source}-${params.target}`, type: 'assignment', animated: true, data: { instruction: '' } },
        eds,
      ),
    );
  }, [setEdges]);

  /* Drag-over / drop */
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow-category');
    if (!type) return;

    const position = { x: e.clientX - 500, y: e.clientY - 200 };
    setNodes((nds) =>
      nds.concat({
        id: `${type}_${Date.now()}`,
        type: type === 'agent' ? 'employee' : type,
        position,
        data: {
          name: 'New Employee',
          isPlaceholder: true,
          description: 'Click to assign an employee from the registry.',
        },
        dragHandle: '.drag-handle',
      }),
    );
  }, [setNodes]);

  /* Node / edge selection */
  const onNodeClick = (_: any, node: any) => { setSelectedNode(node); setSelectedEdge(null); };
  const onEdgeClick = (_: any, edge: any) => { setSelectedEdge(edge); setSelectedNode(null); };
  const onPaneClick = () => { setSelectedNode(null); setSelectedEdge(null); };

  /* Update helpers */
  const handleUpdateNode = (id: string, newData: any) => {
    setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: newData } : n));
    if (selectedNode?.id === id) setSelectedNode((prev: any) => ({ ...prev, data: newData }));
  };

  const handleUpdateEdge = (id: string, newData: any) => {
    setEdges((eds) => eds.map((e) => e.id === id ? { ...e, data: newData } : e));
    if (selectedEdge?.id === id) setSelectedEdge((prev: any) => ({ ...prev, data: newData }));
  };

  const handleDeleteItem = (id: string, type: 'node' | 'edge') => {
    if (id === 'manager_hub') return;
    if (type === 'node') {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNode(null);
    } else {
      setEdges((eds) => eds.filter((e) => e.id !== id));
      setSelectedEdge(null);
    }
  };

  /* Save */
  const handleSave = async () => {
    const hub = nodes.find((n) => n.id === 'manager_hub');
    if (!hub?.data.name?.trim()) {
      toast.error('Manager name is required.');
      return;
    }

    const connectedEmployeeIds = edges
      .filter((e) => e.source === 'manager_hub')
      .map((e) => e.target.replace('employee-', ''));

    const payload = {
      name:         hub.data.name,
      description:  (hub.data.goal ?? '').substring(0, 200),
      goal:         hub.data.goal,
      systemPrompt: 'You are a strategic manager. Use your employees effectively.',
      model:        'google/gemini-2.0-flash-001',
      employeeIds:  connectedEmployeeIds,
      isPublished:  true,
    };

    try {
      if (managerId) {
        await updateManager({ id: managerId, data: payload });
        toast.success('Manager updated successfully.');
      } else {
        await createManager(payload);
        toast.success('Manager created successfully.');
      }
      router.push('/manager');
    } catch {
      toast.error('Failed to save manager. Please try again.');
    }
  };

  /* Loading skeleton */
  if (isManagerLoading && managerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 size={24} className="animate-spin text-muted-foreground/40" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
          Loading workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-muted flex flex-col h-full overflow-hidden text-foreground">

      {/* ── Top Navigation Bar ──────────────────────────────────────── */}
      <header className="h-12 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
        {/* Left: breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/manager')}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground/50 hover:bg-muted hover:text-foreground transition-all"
          >
            <ArrowLeft size={14} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground/40">
            <LayoutGrid size={11} strokeWidth={2} />
            <span>Workforce</span>
            <ChevronRight size={10} strokeWidth={3} />
            <span>Managers</span>
            <ChevronRight size={10} strokeWidth={3} />
          </div>

          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-indigo-600 rounded-md flex items-center justify-center text-white shrink-0">
              <Users size={11} strokeWidth={2.5} />
            </div>
            <span className="text-[11px] font-bold text-foreground tracking-tight">
              {managerName}
            </span>
          </div>
        </div>

        {/* Center: mode tabs (placeholder for future sim mode) */}
        <div className="flex items-center gap-0.5 p-0.5 bg-muted border border-border rounded-xl">
          {[{ id: 'arch', label: 'Architecture' }].map((tab) => (
            <button
              key={tab.id}
              className="px-4 py-1.5 bg-card border border-border rounded-lg text-[9px] font-bold uppercase tracking-widest text-foreground shadow-sm"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right: save */}
        <button
          onClick={handleSave}
          disabled={isCreating || isUpdating}
          className="h-8 px-5 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm"
        >
          {isCreating || isUpdating
            ? <Loader2 size={12} className="animate-spin" />
            : <Save size={12} strokeWidth={2.5} />
          }
          {managerId ? 'Update' : 'Publish'}
        </button>
      </header>

      {/* ── Canvas Area ─────────────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionLineType={ConnectionLineType.Step}
            fitView
            className="bg-transparent"
          >
            <Background
              color="currentColor"
              className="text-foreground/[0.04]"
              gap={32}
              variant={BackgroundVariant.Dots}
            />
            <Controls
              className="!bg-card !border !border-border !rounded-xl !shadow-sm"
              showInteractive={false}
            />
          </ReactFlow>

          {/* Drag Tray */}
          <UnitTray onDragStart={(e, type) => {
            e.dataTransfer.setData('application/reactflow-category', type);
            e.dataTransfer.effectAllowed = 'move';
          }} />
        </div>

        {/* Inspector – overlays canvas */}
        <NodeInspector
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onClose={() => { setSelectedNode(null); setSelectedEdge(null); }}
          onUpdateNode={handleUpdateNode}
          onUpdateEdge={handleUpdateEdge}
          onDelete={handleDeleteItem}
          employeeRegistry={employeeRegistry || []}
          isRegistryLoading={isRegistryLoading}
        />
      </div>
    </div>
  );
}

/* ─── Export wrapped in provider ────────────────────────────────────────────── */
export default function ManagerBuilder() {
  return (
    <ReactFlowProvider>
      <ManagerBuilderInner />
    </ReactFlowProvider>
  );
}
