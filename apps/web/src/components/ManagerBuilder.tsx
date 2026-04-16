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
import { Save, ChevronLeft, Target, Cpu, Sparkles, Loader2, Bot, Info, Shield, Zap, X, ArrowLeft, Hammer, Activity } from 'lucide-react';

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
      router.push('/managers');
    } catch (err) {
      toast.error('Failed to sync strategy registry.');
    }
  };

  if (isManagerLoading && managerId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background uppercase italic">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="mt-8 text-[10px] font-bold text-muted uppercase tracking-[0.4em]">Loading workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-background flex flex-col h-full overflow-hidden font-inter text-foreground">
      {/* ── TOP NAVIGATION BAR ────────────────────────── */}
      <header className="h-11 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-4">
           <button 
             onClick={() => router.push('/managers')} 
             className="p-1 px-2.5 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-all text-foreground/40 hover:text-foreground border border-border/10"
           >
              <ArrowLeft size={14} strokeWidth={2.5} />
           </button>
           <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                 <Shield size={14} strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                 <span className="text-[7px] uppercase font-bold tracking-widest text-foreground/30 leading-none">Protocol</span>
                 <h1 className="text-[11px] font-bold tracking-tight text-foreground leading-none">
                   {managerData?.name || 'New Orchestrator'}
                 </h1>
              </div>
           </div>
        </div>

        {/* Center Navigation - Segmented Control */}
        <nav className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/10 relative">
           {[
             { id: 'arch', label: 'Arch', icon: Hammer },
             { id: 'sim', label: 'Sim', icon: Activity }
           ].map(tab => {
             const active = tab.id === 'arch';
             return (
               <button 
                 key={tab.id} 
                 className={`relative px-4 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 z-10
                   ${active ? 'text-primary' : 'text-foreground/30 hover:text-foreground/50'}`}
               >
                 {active && (
                   <motion.div 
                     layoutId="managerTab"
                     className="absolute inset-0 bg-card rounded-lg shadow-sm border border-border/5"
                     transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                   />
                 )}
                 <tab.icon size={11} strokeWidth={active ? 2.5 : 2} className="relative z-20" />
                 <span className="relative z-20">{tab.label}</span>
               </button>
             );
           })}
        </nav>

        <div className="flex items-center gap-2">
            <button
               onClick={handleSave}
               disabled={isCreating || isUpdating}
               className="h-7 px-4 bg-primary text-primary-foreground rounded-lg text-[8px] font-bold uppercase tracking-widest shadow-lg hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-2"
            >
               {isCreating || isUpdating ? <Loader2 className="animate-spin" size={10} /> : (
                 <>PUBLISH <Target size={10} strokeWidth={2.5} /></>
               )}
            </button>
         </div>
      </header>

      <div className="flex-1 flex gap-1.5 p-1.5 overflow-hidden relative bg-secondary/5">
         {/* THE STRATEGIC MESH SHEET */}
         <div className="flex-1 bg-card rounded-2xl border border-border overflow-hidden shadow-sm relative">
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
              nodeTypes={nodeTypes}
              fitView
              className="bg-transparent"
            >
              <Background color="currentColor" className="text-foreground/5" gap={40} variant={BackgroundVariant.Dots} />
              <Controls className="!bg-card !border-border/10 !rounded-xl !shadow-lg !fill-foreground" />
            </ReactFlow>

            {/* Float HUD Over Sheet */}
            <UnitTray onDragStart={handleDragStart} />
         </div>

         {/* INSPECTOR OVERLAY (Slide out) */}
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
