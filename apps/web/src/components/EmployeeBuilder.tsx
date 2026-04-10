'use client';

import React, { useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCreateAgent, usePublishAsWorker } from '@/hooks/useApi';
import { useToast } from '@/components/ui/Toast';
import { ChevronLeft, Plus, Trash2, Save, Loader2, Search, Play } from 'lucide-react';
import { TOOL_REGISTRY, MODEL_TYPES } from '@/components/builder/toolRegistry';

interface InputField {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  required: boolean;
}

interface WorkflowStep {
  id: string;
  toolId: string;
  config: Record<string, any>;
}

export default function EmployeeBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const agentId = searchParams.get('id');
  const toast = useToast();

  // State
  const [name, setName] = useState('Untitled Employee');
  const [description, setDescription] = useState('');
  const [inputFields, setInputFields] = useState<InputField[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedModel, setSelectedModel] = useState(MODEL_TYPES[0]?.id || 'google/gemini-2.0-flash-001');

  // UI State
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [showInputForm, setShowInputForm] = useState(false);
  const [newInputKey, setNewInputKey] = useState('');
  const [newInputType, setNewInputType] = useState<'string' | 'number' | 'boolean' | 'json'>('string');

  // Mutations
  const { mutateAsync: createAgent, isPending: isCreating } = useCreateAgent();
  const { mutate: publishAsWorker, isPending: isPublishingWorker } = usePublishAsWorker();

  // Add input field
  const handleAddInput = useCallback(() => {
    if (!newInputKey.trim()) {
      toast.error('Input name is required');
      return;
    }
    if (inputFields.some(f => f.key === newInputKey)) {
      toast.error('Input name already exists');
      return;
    }
    setInputFields([...inputFields, {
      key: newInputKey,
      type: newInputType,
      required: true
    }]);
    setNewInputKey('');
    setNewInputType('string');
    setShowInputForm(false);
  }, [newInputKey, newInputType, inputFields, toast]);

  // Remove input field
  const handleRemoveInput = useCallback((key: string) => {
    setInputFields(inputFields.filter(f => f.key !== key));
  }, [inputFields]);

  // Add step (tool)
  const handleAddStep = useCallback((toolId: string) => {
    const tool = TOOL_REGISTRY.find(t => t.id === toolId);
    if (!tool) {
      toast.error('Tool not found');
      return;
    }
    setSteps([...steps, {
      id: `step_${Date.now()}`,
      toolId,
      config: {}
    }]);
    setIsPickerOpen(false);
  }, [steps, toast]);

  // Remove step
  const handleRemoveStep = useCallback((stepId: string) => {
    setSteps(steps.filter(s => s.id !== stepId));
  }, [steps]);

  // Update step config
  const handleUpdateStepConfig = useCallback((stepId: string, config: Record<string, any>) => {
    setSteps(steps.map(s => s.id === stepId ? { ...s, config } : s));
  }, [steps]);

  // Build workflow nodes and edges
  const buildWorkflow = useCallback(() => {
    const nodes: any[] = [];
    const edges: any[] = [];

    // Trigger node (input)
    const triggerId = `trigger_${Date.now()}`;
    nodes.push({
      id: triggerId,
      type: 'wareweNode',
      position: { x: 100, y: 100 },
      data: {
        toolId: 'manual_trigger',
        label: 'Employee Input',
        config: {
          inputSchema: Object.fromEntries(
            inputFields.map(f => [f.key, f.type])
          )
        }
      }
    });

    // Tool steps
    let lastNodeId = triggerId;
    steps.forEach((step, idx) => {
      const nodeId = `step_${step.id}`;
      const tool = TOOL_REGISTRY.find(t => t.id === step.toolId);

      nodes.push({
        id: nodeId,
        type: 'wareweNode',
        position: { x: 100 + (idx + 1) * 300, y: 100 },
        data: {
          toolId: step.toolId,
          label: tool?.label || 'Unknown',
          config: step.config
        }
      });

      // Connect previous to current
      edges.push({
        id: `e_${lastNodeId}_${nodeId}`,
        source: lastNodeId,
        sourceHandle: 'output',
        target: nodeId,
        targetHandle: 'input',
        type: 'deletableEdge'
      });

      lastNodeId = nodeId;
    });

    // Output node
    const outputId = `output_${Date.now()}`;
    nodes.push({
      id: outputId,
      type: 'wareweNode',
      position: { x: 100 + (steps.length + 1) * 300, y: 100 },
      data: {
        toolId: 'structured_output_parser',
        label: 'Return Output',
        config: {}
      }
    });

    edges.push({
      id: `e_${lastNodeId}_${outputId}`,
      source: lastNodeId,
      sourceHandle: 'output',
      target: outputId,
      targetHandle: 'input',
      type: 'deletableEdge'
    });

    return { nodes, edges };
  }, [inputFields, steps]);

  // Save employee
  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      toast.error('Employee name is required');
      return;
    }
    if (!description.trim()) {
      toast.error('Capability description is required');
      return;
    }
    if (steps.length === 0) {
      toast.error('Add at least one step to your employee workflow');
      return;
    }

    const { nodes, edges } = buildWorkflow();
    const workflow = { nodes, edges, model: selectedModel };

    try {
      const agent = await createAgent({
        name,
        description,
        workflow,
        category: 'Automation'
      });

      // Publish as worker
      const inputSchema = Object.fromEntries(
        inputFields.map(f => [f.key, { type: f.type, required: f.required }])
      );

      publishAsWorker({
        id: agent.id,
        isWorker: true,
        workerDescription: description,
        workerInputSchema: inputSchema
      }, {
        onSuccess: () => {
          toast.success('Employee created successfully!');
          router.push('/agents');
        }
      });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create employee');
    }
  }, [name, description, steps, inputFields, selectedModel, createAgent, publishAsWorker, buildWorkflow, router, toast]);

  // Filter tools for picker
  const availableTools = TOOL_REGISTRY.filter(t => {
    const matchesSearch = t.label.toLowerCase().includes(pickerSearch.toLowerCase());
    const isNotTrigger = !t.label.includes('Trigger');
    const isNotOutput = t.id !== 'structured_output_parser';
    return matchesSearch && isNotTrigger && isNotOutput;
  });

  const isSaving = isCreating || isPublishingWorker;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Topbar */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-foreground/10 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-transparent border-none outline-none text-2xl font-black text-foreground placeholder:text-muted/50"
              placeholder="Employee Name"
            />
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-muted/70 placeholder:text-muted/50 mt-1"
              placeholder="What does this employee do?"
            />
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-accent text-background rounded-lg font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Employee
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-12">

          {/* Inputs Section */}
          <div className="border border-border/40 rounded-2xl p-8 bg-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight">Inputs</h2>
              <p className="text-xs text-muted/60">What the manager will pass to this employee</p>
            </div>

            {inputFields.length > 0 && (
              <div className="space-y-3 mb-6">
                {inputFields.map(field => (
                  <div key={field.key} className="flex items-center justify-between p-4 bg-foreground/5 rounded-lg border border-border/40">
                    <div>
                      <p className="font-bold text-sm">{field.key}</p>
                      <p className="text-xs text-muted/60">{field.type} {field.required ? '(required)' : '(optional)'}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveInput(field.key)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-500 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showInputForm ? (
              <button
                onClick={() => setShowInputForm(true)}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-border/40 rounded-lg text-muted hover:text-foreground hover:border-border/60 transition-all w-full justify-center"
              >
                <Plus size={16} /> Add Input Field
              </button>
            ) : (
              <div className="space-y-3 p-4 bg-foreground/5 rounded-lg border border-border/40">
                <input
                  value={newInputKey}
                  onChange={e => setNewInputKey(e.target.value)}
                  placeholder="Field name (e.g., query, email)"
                  className="w-full bg-background border border-border/40 rounded-lg px-3 py-2 outline-none focus:border-border/60"
                />
                <div className="flex gap-2">
                  <select
                    value={newInputType}
                    onChange={e => setNewInputType(e.target.value as any)}
                    className="flex-1 bg-background border border-border/40 rounded-lg px-3 py-2 outline-none focus:border-border/60"
                  >
                    <option value="string">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddInput}
                    className="flex-1 bg-accent text-background px-4 py-2 rounded-lg font-bold hover:scale-105 transition-all"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowInputForm(false)}
                    className="flex-1 bg-foreground/10 text-foreground px-4 py-2 rounded-lg font-bold hover:bg-foreground/20 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Steps Section */}
          <div className="border border-border/40 rounded-2xl p-8 bg-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black uppercase tracking-tight">Steps</h2>
              <p className="text-xs text-muted/60">Sequential actions the employee will execute</p>
            </div>

            {steps.length > 0 && (
              <div className="space-y-4 mb-6">
                {steps.map((step, idx) => {
                  const tool = TOOL_REGISTRY.find(t => t.id === step.toolId);
                  return (
                    <div key={step.id} className="p-4 bg-foreground/5 rounded-lg border border-border/40">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-accent mb-1">Step {idx + 1}</p>
                          <p className="font-bold text-base">{tool?.label || 'Unknown Tool'}</p>
                          <p className="text-xs text-muted/60 mt-1">{tool?.description}</p>
                        </div>
                        <button
                          onClick={() => handleRemoveStep(step.id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg text-muted hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setIsPickerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-dashed border-border/40 rounded-lg text-muted hover:text-foreground hover:border-border/60 transition-all w-full justify-center"
            >
              <Plus size={16} /> Add Step
            </button>
          </div>

          {/* Model Selection */}
          <div className="border border-border/40 rounded-2xl p-8 bg-card">
            <h2 className="text-xl font-black uppercase tracking-tight mb-6">LLM Model</h2>
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="w-full bg-background border border-border/40 rounded-lg px-4 py-3 outline-none focus:border-border/60 font-bold"
            >
              {MODEL_TYPES.map(model => (
                <option key={model.id} value={model.id}>
                  {model.label} ({model.provider})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tool Picker Modal */}
      {isPickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-card rounded-t-3xl p-8 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black uppercase">Select Tool</h3>
              <button
                onClick={() => {
                  setIsPickerOpen(false);
                  setPickerSearch('');
                }}
                className="text-muted hover:text-foreground transition-all"
              >
                ✕
              </button>
            </div>

            <div className="relative mb-6">
              <Search size={18} className="absolute left-3 top-3 text-muted/60" />
              <input
                value={pickerSearch}
                onChange={e => setPickerSearch(e.target.value)}
                placeholder="Search tools..."
                className="w-full bg-foreground/5 border border-border/40 rounded-lg pl-10 pr-4 py-3 outline-none focus:border-border/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {availableTools.length > 0 ? (
                availableTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => handleAddStep(tool.id)}
                    className="p-4 border border-border/40 rounded-lg hover:bg-accent/10 hover:border-accent/40 transition-all text-left"
                  >
                    <p className="font-bold text-sm mb-1">{tool.label}</p>
                    <p className="text-xs text-muted/60 line-clamp-2">{tool.description}</p>
                  </button>
                ))
              ) : (
                <p className="col-span-2 text-center text-muted/60 py-8">No tools found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
