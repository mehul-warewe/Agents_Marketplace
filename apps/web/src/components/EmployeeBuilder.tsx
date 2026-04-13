'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCreateAgent, usePublishAsWorker } from '@/hooks/useApi';
import { useToast } from '@/components/ui/Toast';
import { 
  ChevronLeft, Plus, Trash2, Save, Loader2, Search, 
  Play, Settings, ArrowRight, Layers, Box, Terminal,
  Workflow, ArrowDown, CheckCircle2, AlertCircle, Info
} from 'lucide-react';
import { TOOL_REGISTRY, MODEL_TYPES, getToolById } from '@/components/builder/toolRegistry';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface InputField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  required: boolean;
  description?: string;
}

interface WorkflowStep {
  id: string;
  toolId: string;
  config: Record<string, any>;
  label?: string;
}

export default function EmployeeBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');
  const toast = useToast();

  // ─── STATE MANAGEMENT ──────────────────────────────────────────────────
  const [name, setName] = useState('New Specialized Employee');
  const [description, setDescription] = useState('An autonomous agent trained for specific tasks.');
  const [inputFields, setInputFields] = useState<InputField[]>([
    { key: 'task_payload', type: 'string', required: true, description: 'The primary data to process' }
  ]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODEL_TYPES[0]?.id || 'google/gemini-2.0-flash-001');
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const [insertIndex, setInsertIndex] = useState<number | null>(null);

  // UI State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showInputForm, setShowInputForm] = useState(false);
  const [newInput, setNewInput] = useState<InputField>({ key: '', type: 'string', required: true });

  // Mutations
  const { mutateAsync: createAgent, isPending: isCreating } = useCreateAgent();
  const { mutate: publishAsWorker, isPending: isPublishingWorker } = usePublishAsWorker();

  // ─── HANDLERS ─────────────────────────────────────────────────────────

  const handleAddInput = useCallback(() => {
    if (!newInput.key.trim()) return toast.error('Input key is required');
    if (inputFields.some(f => f.key === newInput.key)) return toast.error('Key already exists');
    
    setInputFields([...inputFields, newInput]);
    setNewInput({ key: '', type: 'string', required: true });
    setShowInputForm(false);
  }, [newInput, inputFields, toast]);

  const handleRemoveInput = useCallback((key: string) => {
    setInputFields(inputFields.filter(f => f.key !== key));
  }, [inputFields]);

  const handleAddStep = useCallback((toolId: string) => {
    const tool = getToolById(toolId);
    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      toolId,
      config: {},
      label: tool.label
    };
    
    if (insertIndex !== null) {
      const newSteps = [...steps];
      newSteps.splice(insertIndex, 0, newStep);
      setSteps(newSteps);
    } else {
      setSteps([...steps, newStep]);
    }
    
    setSelectedStepId(newStep.id);
    setIsPickerOpen(false);
    setPickerSearch('');
    setInsertIndex(null);
  }, [steps, insertIndex]);

  const handleRemoveStep = useCallback((stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
    if (selectedStepId === stepId) setSelectedStepId(null);
  }, [steps, selectedStepId]);

  const openPicker = (index: number | null = null) => {
    setInsertIndex(index);
    setIsPickerOpen(true);
  };

  const handleUpdateStepConfig = useCallback((stepId: string, key: string, value: any) => {
    setSteps(prev => prev.map(s => s.id === stepId ? {
      ...s,
      config: { ...s.config, [key]: value }
    } : s));
  }, []);

  const selectedStep = useMemo(() => 
    steps.find(s => s.id === selectedStepId), 
  [steps, selectedStepId]);

  const selectedTool = useMemo(() => 
    selectedStep ? getToolById(selectedStep.toolId) : null,
  [selectedStep]);

  // ─── WORKFLOW GENERATION ──────────────────────────────────────────────

  const buildWorkflow = useCallback(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // 1. START NODE (Manual Trigger)
    const triggerId = 'start';
    nodes.push({
      id: triggerId,
      type: 'wareweNode',
      position: { x: 0, y: 0 },
      data: {
        toolId: 'manual_trigger',
        label: 'Manager Input',
        config: {
          inputSchema: Object.fromEntries(
            inputFields.map(f => [f.key, f.type])
          )
        }
      }
    });

    // 2. SEQUENTIAL STEPS
    let prevId = triggerId;
    steps.forEach((step, idx) => {
      const tool = getToolById(step.toolId);
      const nodeId = `step_${idx}`;
      nodes.push({
        id: nodeId,
        type: 'wareweNode',
        position: { x: (idx + 1) * 350, y: 0 },
        data: {
          toolId: step.toolId,
          executionKey: tool.executionKey,
          label: step.label || tool.label,
          config: step.config
        }
      });

      edges.push({
        id: `e_${prevId}_${nodeId}`,
        source: prevId,
        target: nodeId,
        sourceHandle: 'output',
        targetHandle: 'input'
      });

      prevId = nodeId;
    });

    // 3. END NODE (Return Output)
    const endId = 'end';
    nodes.push({
      id: endId,
      type: 'wareweNode',
      position: { x: (steps.length + 1) * 350, y: 0 },
      data: {
        toolId: 'structured_output_parser',
        label: 'Final Return',
        config: {}
      }
    });

    edges.push({
      id: `e_${prevId}_${endId}`,
      source: prevId,
      target: endId,
      sourceHandle: 'output',
      targetHandle: 'input'
    });

    return { nodes, edges };
  }, [inputFields, steps]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return toast.error('Name is missing');
    const { nodes, edges } = buildWorkflow();
    
    try {
      const agent = await createAgent({
        name,
        description,
        workflow: { nodes, edges, model: selectedModel },
        category: 'Employee'
      });

      publishAsWorker({
        id: agent.id,
        isWorker: true,
        workerDescription: description,
        workerInputSchema: Object.fromEntries(
          inputFields.map(f => [f.key, { type: f.type, required: f.required }])
        )
      });

      toast.success('Employee Unit Initialized');
      router.push('/agents');
    } catch (err: any) {
      toast.error(err.message);
    }
  }, [name, description, buildWorkflow, selectedModel, inputFields, createAgent, publishAsWorker, router, toast]);

  // ─── RENDER ────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen bg-[#070708] text-[#e1e1e3] selection:bg-accent/30 font-sans">
      
      {/* 🏙️ TOP NAV: Industrial Glass */}
      <nav className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all border-b-2 active:translate-y-px"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="space-y-1">
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-transparent border-none outline-none text-xl font-bold placeholder:opacity-30 w-64 focus:ring-1 ring-accent/20 rounded px-1 -ml-1 transition-all"
            />
            <div className="flex items-center gap-2">
               <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent/60">Specialized Unit</span>
               <span className="w-1 h-1 rounded-full bg-white/20" />
               <input 
                 value={description}
                 onChange={e => setDescription(e.target.value)}
                 className="bg-transparent border-none outline-none text-xs text-white/40 w-80 truncate focus:text-white/70 transition-all"
               />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl">
             {MODEL_TYPES.slice(0, 3).map(m => (
               <button
                 key={m.id}
                 onClick={() => setSelectedModel(m.id)}
                 className={clsx(
                   "px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all",
                   selectedModel === m.id ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-white/40 hover:text-white/70"
                 )}
               >
                 {m.label.split(' ')[0]}
               </button>
             ))}
          </div>
          <button 
            onClick={handleSave}
            disabled={isCreating}
            className="h-11 px-6 bg-white text-black font-black text-sm rounded-xl flex items-center gap-2 hover:bg-accent hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
          >
            {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            INITIALIZE UNIT
          </button>
        </div>
      </nav>

      {/* 🏗️ MAIN WORKSPACE: 3-Columns */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* 📥 LEFT: INPUT DEFINITIONS */}
        <aside className="w-80 border-r border-white/5 flex flex-col bg-black/10 overflow-hidden">
          <div className="p-6 shrink-0 border-b border-white/5">
            <h3 className="text-xs uppercase font-black tracking-widest text-accent mb-1">Entry Data</h3>
            <p className="text-[10px] text-white/30 uppercase font-medium">Define parameters received from manager</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             <AnimatePresence>
               {inputFields.map((field) => (
                 <motion.div 
                   key={field.key}
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   exit={{ opacity: 0, x: -20 }}
                   className="group p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:border-white/10 transition-all relative overflow-hidden"
                 >
                   <div className="flex items-start justify-between">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <Terminal size={10} className="text-accent" />
                           <span className="text-xs font-bold text-white/90">{field.key}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] uppercase font-black tracking-tighter text-white/40">{field.type}</span>
                     </div>
                     <button onClick={() => handleRemoveInput(field.key)} className="opacity-0 group-hover:opacity-100 p-1.5 text-white/20 hover:text-red-400 transition-all">
                       <Trash2 size={14} />
                     </button>
                   </div>
                 </motion.div>
               ))}
             </AnimatePresence>

             {showInputForm ? (
               <div className="p-4 bg-white/[0.02] border border-accent/20 rounded-xl space-y-3">
                  <input 
                    autoFocus
                    placeholder="Field name..."
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-accent/50"
                    onKeyDown={e => e.key === 'Enter' && handleAddInput()}
                    value={newInput.key}
                    onChange={e => setNewInput({...newInput, key: e.target.value})}
                  />
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/60 outline-none"
                    value={newInput.type}
                    onChange={e => setNewInput({...newInput, type: e.target.value as any})}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="json">JSON Object</option>
                  </select>
                  <div className="flex gap-2">
                    <button onClick={handleAddInput} className="flex-1 py-2 bg-accent text-white text-[10px] font-black rounded-lg">ADD</button>
                    <button onClick={() => setShowInputForm(false)} className="px-3 py-2 bg-white/5 text-white/40 text-[10px] font-black rounded-lg">✕</button>
                  </div>
               </div>
             ) : (
               <button 
                 onClick={() => setShowInputForm(true)}
                 className="w-full p-4 border border-dashed border-white/10 rounded-xl text-white/20 hover:text-white/50 hover:border-white/20 transition-all flex items-center justify-center gap-2 group"
               >
                 <Plus size={14} className="group-hover:rotate-90 transition-all" />
                 <span className="text-[10px] font-bold uppercase tracking-wider">Add Input Parameter</span>
               </button>
             )}
          </div>
        </aside>

        {/* ⛓️ CENTER: SEQUENTIAL PIPELINE */}
        <div className="flex-1 bg-[url('/grid.svg')] bg-fixed flex flex-col items-center py-20 overflow-y-auto px-10 relative">
          
          {/* Start Indicator */}
          <div className="flex flex-col items-center mb-12">
            <div className="w-12 h-12 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent animate-pulse shadow-[0_0_30px_rgba(99,102,241,0.2)]">
              <Layers size={20} />
            </div>
            <div className="h-10 w-px bg-gradient-to-down from-accent/50 to-white/10" />
          </div>

          <div className="w-full max-w-xl space-y-4">
            <AnimatePresence mode="popLayout">
              {steps.map((step, idx) => {
                const tool = getToolById(step.toolId);
                const isSelected = selectedStepId === step.id;
                
                return (
                  <React.Fragment key={step.id}>
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      onClick={() => setSelectedStepId(step.id)}
                      className={clsx(
                        "group relative p-6 bg-[#0c0c0e]/80 backdrop-blur-md border rounded-2xl cursor-pointer transition-all duration-300",
                        isSelected ? "border-accent ring-1 ring-accent/20 shadow-[0_0_40px_rgba(99,102,241,0.1)]" : "border-white/5 hover:border-white/20"
                      )}
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          {typeof tool.icon === 'string' ? (
                            <img src={tool.icon} alt="" className="w-6 h-6 grayscale opacity-80" />
                          ) : (
                            <tool.icon size={22} className={isSelected ? 'text-accent' : 'text-white/40'} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#636366]">Step {idx + 1}</span>
                            {Object.keys(step.config).length > 0 && <CheckCircle2 size={10} className="text-green-500/50" />}
                          </div>
                          <h4 className="text-sm font-black text-white/90 uppercase truncate tracking-tight">{step.label || tool.label}</h4>
                          <p className="text-[10px] text-white/30 truncate mt-0.5">{tool.description}</p>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleRemoveStep(step.id); }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                    
                    {/* Connecting UI */}
                    {idx < steps.length && (
                      <div className="h-10 w-full flex flex-col items-center group relative cursor-pointer">
                        {/* Hidden wider hover area */}
                        <div 
                          onClick={() => openPicker(idx + 1)}
                          className="absolute inset-0 z-0 h-full w-40 left-1/2 -translate-x-1/2" 
                        />
                        <div className="h-full w-px bg-white/10 group-hover:bg-accent/50 transition-colors" />
                        <button 
                          onClick={() => openPicker(idx + 1)}
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#0c0c0e] border border-white/10 flex items-center justify-center text-white/40 hover:text-accent hover:border-accent group-hover:scale-110 transition-all opacity-0 group-hover:opacity-100 z-10 pointer-events-none group-hover:pointer-events-auto"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </AnimatePresence>

            <motion.button 
              layout
              onClick={() => openPicker(null)}
              className="w-full p-8 border border-dashed border-white/10 rounded-2xl hover:border-accent/40 hover:bg-accent/[0.02] text-white/20 hover:text-accent transition-all flex flex-col items-center gap-3 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:rotate-90">
                <Plus size={20} />
              </div>
              <span className="text-[10px] uppercase font-black tracking-[0.2em]">Augment Workflow</span>
            </motion.button>
          </div>

          {/* End Indicator */}
          {steps.length > 0 && (
             <div className="flex flex-col items-center mt-12">
                <div className="h-10 w-px bg-white/10" />
                <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl border-dashed flex flex-col items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                     <ArrowDown size={18} />
                   </div>
                   <div className="text-center">
                     <span className="text-[10px] font-black uppercase tracking-widest text-[#636366]">Final Phase</span>
                     <p className="text-xs font-bold text-white/40 mt-1 uppercase tracking-tighter">Deliver Processed Result</p>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* ⚙️ RIGHT: STEP INSPECTOR */}
        <aside className="w-96 border-l border-white/5 bg-black/20 backdrop-blur-sm relative flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {selectedStep ? (
              <motion.div 
                key={selectedStep.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                  <div className="flex items-center justify-between mb-4">
                     <span className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center text-accent">
                        <Settings size={14} />
                     </span>
                     <button onClick={() => setSelectedStepId(null)} className="text-white/20 hover:text-white transition-all text-xs">CLOSE</button>
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tight">{selectedTool?.label}</h3>
                  <p className="text-[11px] text-white/40 mt-1">Configure parameters for this operational unit.</p>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   {selectedTool?.configFields?.map(field => (
                     <div key={field.key} className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center justify-between">
                          {field.label}
                          {field.required && <span className="text-accent">*</span>}
                        </label>
                        {field.type === 'credential' ? (
                          <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg flex items-center justify-between group cursor-pointer hover:bg-accent/10 transition-all">
                             <span className="text-[10px] font-bold text-accent">Connect Account</span>
                             <Plus size={12} className="text-accent" />
                          </div>
                        ) : field.options ? (
                          <select 
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-accent/40 appearance-none"
                            value={selectedStep.config[field.key] || ''}
                            onChange={(e) => handleUpdateStepConfig(selectedStep.id, field.key, e.target.value)}
                          >
                            <option value="">Select option...</option>
                            {field.options.map((opt: any) => (
                              <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                                {typeof opt === 'string' ? opt : opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="relative group">
                            <input 
                              type="text"
                              value={selectedStep.config[field.key] || ''}
                              onChange={(e) => handleUpdateStepConfig(selectedStep.id, field.key, e.target.value)}
                              placeholder={`Enter ${field.label.toLowerCase()}...`}
                              className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs outline-none focus:border-accent/40 group-hover:border-white/10 transition-all font-mono"
                            />
                            {/* Variable Suggestion Hint */}
                            <div className="absolute right-3 top-3 opacity-0 group-focus-within:opacity-100 transition-all">
                               <span className="text-[8px] px-1.5 py-0.5 bg-accent/20 text-accent rounded uppercase font-black tracking-widest">Type {`{{`} to map</span>
                            </div>
                          </div>
                        )}
                        <p className="text-[9px] text-[#636366] leading-relaxed tracking-tight italic">
                           Use {"{{"} to map data from previous steps or manager inputs.
                        </p>
                     </div>
                   ))}

                   {selectedTool?.configFields?.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                         <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/20 mb-4">
                            <Box size={20} />
                         </div>
                         <h4 className="text-xs font-black uppercase text-white/40">No Configuration Required</h4>
                         <p className="text-[10px] text-white/20 mt-2">This unit operates with standard internal logic and requires no manual parameters.</p>
                      </div>
                   )}
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                 <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 mb-6 group-hover:scale-110 transition-transform">
                   <Workflow size={32} />
                 </div>
                 <h3 className="text-xs font-black uppercase text-white/40 tracking-[0.2em] mb-2">Unit Inspector</h3>
                 <p className="text-[10px] text-white/20 leading-relaxed uppercase tracking-tighter">Select an operational step from the pipeline to configure specialized parameters and data mapping.</p>
                 
                 <div className="mt-12 w-full space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-xl text-left">
                       <Info size={14} className="text-accent/40 shrink-0" />
                       <span className="text-[9px] text-white/30 uppercase leading-tight font-medium">Inputs defined on the left are globally available as workflow variables.</span>
                    </div>
                 </div>
              </div>
            )}
          </AnimatePresence>
        </aside>

      </main>

      {/* 🚀 TOOL PICKER: Full Screen Blur */}
      <AnimatePresence>
        {isPickerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-2xl flex items-center justify-center p-20"
          >
            <div className="w-full max-w-4xl h-full flex flex-col">
              <div className="flex items-center justify-between mb-12">
                 <div className="space-y-1">
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Select Capability</h2>
                    <p className="text-accent font-black text-xs uppercase tracking-[0.3em]">Augment your specialized unit</p>
                 </div>
                 <button onClick={() => setIsPickerOpen(false)} className="w-14 h-14 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                    <span className="text-2xl font-light">✕</span>
                 </button>
              </div>

              <div className="relative mb-12">
                 <Search className="absolute left-6 top-6 text-white/20" size={24} />
                 <input 
                   autoFocus
                   value={pickerSearch}
                   onChange={e => setPickerSearch(e.target.value)}
                   placeholder="SEARCH MODULES (SLACK, DISCORD, DATABASE...)"
                   className="w-full bg-white/[0.03] border-b-2 border-white/10 px-16 py-8 text-2xl font-black uppercase tracking-tight focus:border-accent outline-none placeholder:text-white/10 transition-all"
                 />
              </div>

              <div className="flex-1 overflow-y-auto pr-6 grid grid-cols-2 gap-4">
                 {TOOL_REGISTRY
                  .filter(t => !t.isTrigger && t.id !== 'structured_output_parser')
                  .filter(t => t.label.toLowerCase().includes(pickerSearch.toLowerCase()) || t.category.toLowerCase().includes(pickerSearch.toLowerCase()))
                  .map(tool => (
                   <button
                     key={tool.id}
                     onClick={() => handleAddStep(tool.id)}
                     className="group flex items-start gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:bg-white/[0.05] hover:border-accent/30 transition-all text-left relative overflow-hidden active:scale-95"
                   >
                     <div className="w-14 h-14 rounded-2xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform">
                        {typeof tool.icon === 'string' ? (
                          <img src={tool.icon} alt="" className="w-7 h-7 grayscale group-hover:grayscale-0 transition-all" />
                        ) : (
                          <tool.icon size={26} className="text-white/20 group-hover:text-accent transition-colors" />
                        )}
                     </div>
                     <div>
                        <span className="text-[9px] font-black uppercase tracking-[2px] text-accent/60 mb-1 block">{tool.category}</span>
                        <h4 className="text-lg font-black text-white/90 uppercase leading-none tracking-tighter mb-2 italic">{tool.label}</h4>
                        <p className="text-[10px] text-white/30 leading-relaxed font-medium line-clamp-2 uppercase tracking-tight italic">{tool.description}</p>
                     </div>
                     <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                        <ArrowRight size={20} className="text-accent" />
                     </div>
                   </button>
                 ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
