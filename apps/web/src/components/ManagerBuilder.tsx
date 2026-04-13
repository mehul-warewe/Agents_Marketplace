'use client';

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  MarkerType,
  Edge,
  Connection,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCreateManager, useUpdateManager, useManager } from '@/hooks/useManager';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/components/ui/Toast';
import { Save, ChevronLeft, Target, Cpu, Sparkles, Loader2, Bot, Info, Shield, Zap, X } from 'lucide-react';

import { ManagerHubNode, EmployeeNode, ToolNode, TriggerNode, ConditionNode, NoteNode } from './builder/ManagerFlowNodes';
import UnitTray from './builder/UnitTray';
import NodeInspector from './builder/NodeInspector';
import AssignmentEdge from './builder/AssignmentEdge';
import { MODEL_TYPES } from './builder/toolRegistry';
import { BackgroundVariant } from 'reactflow';

const nodeTypes = {
  hub: ManagerHubNode,
  employee: EmployeeNode,
  tool: ToolNode,
  trigger: TriggerNode,
  condition: ConditionNode,
  note: NoteNode,
};

const edgeTypes = {
  assignment: AssignmentEdge,
};

const INITIAL_NODES = [
  {
    id: 'manager_hub',
    type: 'hub',
    position: { x: 400, y: 300 },
    data: { name: 'New Strategic Manager', goal: 'Define strategic objectives...' },
    dragHandle: '.drag-handle',
  },
];

function ManagerBuilderInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const managerId = searchParams.get('id');
  const toast = useToast();
  const { data: employeeFleet, isLoading: isFleetLoading } = useEmployees();
  const { data: existingManager, isLoading: isManagerLoading } = useManager(managerId);
  const { mutateAsync: createManager, isPending: isCreating } = useCreateManager();
  const { mutateAsync: updateManager, isPending: isUpdating } = useUpdateManager();

  const [nodes, setNodes, onNodesChange] = useNodesState<any>(INITIAL_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  const managerData = nodes.find(n => n.id === 'manager_hub')?.data || { name: 'Loading...', goal: '' };

  // Sync with existing manager data
  useEffect(() => {
    if (existingManager && !isInitialized && employeeFleet) {
      const hubNode = {
        ...INITIAL_NODES[0],
        data: { name: existingManager.name, goal: existingManager.goal },
        dragHandle: '.drag-handle',
      };

      const employeeNodes = (existingManager.employeeIds || []).map((id: string, idx: number) => {
        const employee = employeeFleet.find((w: any) => w.id === id);
        if (!employee) return null;
        return {
          id: `employee-${id}`,
          type: 'employee',
          position: { x: 800, y: 150 + idx * 250 },
          data: { ...employee },
          dragHandle: '.drag-handle',
        };
      }).filter(Boolean);

      const assignmentEdges = (existingManager.employeeIds || []).map((id: string) => ({
        id: `edge-hub-${id}`,
        source: 'manager_hub',
        target: `employee-${id}`,
        type: 'assignment',
        animated: true,
      }));

      setNodes([hubNode, ...employeeNodes]);
      setEdges(assignmentEdges);
      setIsInitialized(true);
    }
  }, [existingManager, employeeFleet, isInitialized, setNodes, setEdges]);

  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      ...params,
      id: `edge-${params.source}-${params.target}`,
      type: 'assignment',
      animated: true,
      data: { instruction: '' }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow-category');
      if (!type) return;

      const position = { x: event.clientX - 500, y: event.clientY - 200 };

      const newNode = {
        id: `${type}_${Date.now()}`,
        type: type === 'agent' ? 'employee' : type,
        position,
        data: { 
          name: `Unconfigured Employee`, 
          isPlaceholder: true,
          workerDescription: 'Select a specialized operative from the fleet to configure strategy.'
        },
        dragHandle: '.drag-handle',
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleDragStart = (event: React.DragEvent, type: string) => {
    event.dataTransfer.setData('application/reactflow-category', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  };

  const onEdgeClick = (_: any, edge: any) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  };

  const handleUpdateNode = (id: string, newData: any) => {
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: newData } : n)));
    if (selectedNode?.id === id) {
      setSelectedNode({ ...selectedNode, data: newData });
    }
  };

  const handleUpdateEdge = (id: string, newData: any) => {
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data: newData } : e)));
    if (selectedEdge?.id === id) {
      setSelectedEdge({ ...selectedEdge, data: newData });
    }
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

  const handleSave = async () => {
    const hub = nodes.find(n => n.id === 'manager_hub');
    if (!hub?.data.name.trim()) {
      toast.error('Manager name is required.');
      return;
    }

    const connectedEmployeeIds = edges
      .filter((e) => e.source === 'manager_hub')
      .map((e) => e.target.replace('employee-', ''));

    const payload = {
      name: hub.data.name,
      description: hub.data.goal.substring(0, 200),
      goal: hub.data.goal,
      systemPrompt: 'You are a strategic manager. Use your employees effectively.',
      model: 'google/gemini-2.0-flash-001',
      employeeIds: connectedEmployeeIds,
      isPublished: true,
    };

    try {
      if (managerId) {
        await updateManager({ id: managerId, data: payload });
        toast.success('Strategy protocol updated.');
      } else {
        await createManager(payload);
        toast.success('Strategic Manager initialized.');
      }
      router.push('/manager');
    } catch (err) {
      toast.error('Failed to sync strategy registry.');
    }
  };

  const workforceCount = edges.filter(e => e.source === 'manager_hub').length;

  if (isManagerLoading && managerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#030303]">
        <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#030303] text-foreground">
      {/* Structural Top Bar - Matching Screenshot */}
      <section className="h-16 border-b border-border/10 bg-card/40 backdrop-blur-xl flex items-center justify-between px-8 z-[60]">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
               <button onClick={() => router.push('/manager')} className="w-8 h-8 flex items-center justify-center hover:bg-foreground/5 rounded-lg transition-all text-muted">
                  <ChevronLeft size={16} strokeWidth={3} />
               </button>
               <h1 className="text-xs font-black uppercase tracking-widest italic">{managerData.name}</h1>
               <div className="w-10 h-5 bg-accent/20 border border-accent/40 rounded-full flex items-center px-1">
                  <div className="w-2.5 h-2.5 bg-accent rounded-full" />
               </div>
            </div>
         </div>

         {/* Build/Run Segment Control */}
         <div className="flex items-center bg-foreground/[0.05] p-1 rounded-xl border border-border/10">
            <button className="flex items-center gap-2 px-6 py-2 bg-background border border-border/20 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg italic">
               <Sparkles size={14} className="text-accent" /> Build
            </button>
            <button className="flex items-center gap-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest text-muted hover:text-foreground transition-all italic opacity-40">
               <Zap size={14} /> Run
            </button>
         </div>

         <div className="flex items-center gap-4">
            <button className="p-2 text-muted hover:text-foreground transition-all">
               <Shield size={18} />
            </button>
            <div className="w-[1px] h-6 bg-border/20" />
            <button className="px-6 py-2.5 bg-accent/10 border border-accent/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-accent hover:bg-accent hover:text-background transition-all">
               Test
            </button>
            <button 
               onClick={handleSave}
               className="px-8 py-2.5 bg-foreground text-background rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
            >
               {isCreating || isUpdating ? <Loader2 className="animate-spin" size={12} /> : 'Publish'}
            </button>
         </div>
      </section>

      <div className="flex-1 relative">
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
          onPaneClick={() => { setSelectedNode(null); setSelectedEdge(null); }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          className="bg-[#030303]"
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={0.5} 
            color="#ffffff08" 
          />
          
          <Controls className="!bg-card/40 !backdrop-blur-xl !border-border/10 !rounded-xl !shadow-2xl overflow-hidden !m-8" />
          
          <UnitTray onDragStart={handleDragStart} />

          <NodeInspector 
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onClose={() => { setSelectedNode(null); setSelectedEdge(null); }}
            onUpdateNode={handleUpdateNode}
            onUpdateEdge={handleUpdateEdge}
            onDelete={handleDeleteItem}
            workerFleet={employeeFleet || []}
            isFleetLoading={isFleetLoading}
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function ManagerBuilder() {
  return (
    <ReactFlowProvider>
      <ManagerBuilderInner />
    </ReactFlowProvider>
  );
}
