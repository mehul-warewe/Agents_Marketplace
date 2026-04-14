import type React from 'react';
import {
  Bot,
  Database,
  Signpost,
  FileJson,
  MousePointer2,
  MessageSquare,
  Webhook,
  Github,
  ListTodo,
  BookOpen,
  StickyNote,
  Zap
} from 'lucide-react';
import { MarkerType } from 'reactflow';
import { NODE_REGISTRY } from '@repo/nodes';
import type { NodeDefinition, NodeSocket, ConfigField } from '@repo/nodes';

export type { NodeSocket, ConfigField };

/** React component icon (Lucide-style) or an SVG path string. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type IconType = React.ComponentType<any> | string;

/**
 * Frontend-enriched node definition: same as NodeDefinition but with the
 * icon field resolved to a React component (or kept as SVG path string).
 */
export type ToolDefinition = Omit<NodeDefinition, 'icon'> & { icon: IconType };

/**
 * Maps Lucide icon name strings (stored in the shared @repo/nodes registry)
 * to the actual React component. SVG path strings pass through unchanged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Bot,
  Database,
  Signpost,
  FileJson,
  MousePointer2,
  MessageSquare,
  Webhook,
  Github,
  ListTodo,
  BookOpen,
  StickyNote,
  Zap,
};

export const EDGE_DEFAULTS = {
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

/**
 * Universal Pipedream Action Template
 * Shared across all 3,000+ Pipedream integrations.
 */
const PIPEDREAM_TEMPLATE = {
  id: 'pipedream.action',
  name: 'Pipedream Action',
  label: 'Integration Node',
  icon: 'Zap',
  category: 'Integrations',
  description: 'Connect to any of 3,100+ platforms via Pipedream.',
  executionKey: 'pipedream_action',
  bg: 'bg-indigo-500/10',
  color: 'text-indigo-500',
  border: 'border-indigo-500/20',
  isTrigger: false,
  inputs: [{ name: 'input', label: 'Input', type: 'any' }],
  outputs: [{ name: 'output', label: 'Output', type: 'any' }],
  configFields: [
    { key: 'appSlug', label: 'Platform Identifier', type: 'text', required: true },
    { key: 'actionName', label: 'Specific Action', type: 'text', required: true },
    { key: 'credentialId', label: 'Authentication ID', type: 'credential', required: false }
  ],
};

/**
 * TOOL_REGISTRY — the full node list with icons resolved for the frontend.
 * Hierarchy: Nodes with multiple operations are treated as groups.
 */
export const TOOL_REGISTRY: (ToolDefinition & { isGroup?: boolean; subActions?: any[] })[] = NODE_REGISTRY.flatMap((node) => {
  const icon = (ICON_MAP[node.icon] ?? node.icon) as IconType;
  
  // Identify Operations for grouping
  const isLLM = node.executionKey === 'llm_run' || node.category === 'Models';
  const subActions: any[] = [];
  
  if (!isLLM) {
    const opField = node.configFields.find(f => f.key === 'operation');
    const opInputs = (node as any).operationInputs;
    const ops = new Set<string>();
    const labels = new Map<string, string>();

    if (opField && Array.isArray(opField.options)) {
      opField.options.forEach((opt: any) => {
        const val = typeof opt === 'object' ? opt.value : opt;
        const lab = typeof opt === 'object' ? opt.label : opt;
        ops.add(val);
        labels.set(val, lab);
      });
    }

    if (opInputs && typeof opInputs === 'object') {
       Object.keys(opInputs).forEach(key => {
         ops.add(key);
         if (!labels.has(key)) {
           labels.set(key, key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()));
         }
       });
    }

    ops.forEach(val => {
      subActions.push({ 
        id: `${node.id}:${val}`, 
        label: labels.get(val) || val, 
        preConfig: { operation: val } 
      });
    });
  }

  const isGroup = subActions.length > 0;

  return [{
    ...node,
    icon,
    isGroup,
    subActions: subActions,
  }];
});

/**
 * List of unique categories derived from the registry.
 */
export const TOOL_CATEGORIES = [
  ...new Set(NODE_REGISTRY.map(n => n.category))
].sort((a, b) => {
  const order = ['Triggers', 'Models', 'Integrations', 'Logic', 'Data', 'Databases', 'Core', 'Output'];
  return order.indexOf(a) - order.indexOf(b);
});

/**
 * Dynamically extract model options from the Model nodes.
 */
export const MODEL_TYPES = NODE_REGISTRY
  .filter(n => n.category === 'Models')
  .flatMap(n => {
    const modelField = n.configFields.find(f => f.key === 'model');
    if (modelField && Array.isArray(modelField.options)) {
      return (modelField.options as any[]).map(m => {
        const isObj = typeof m === 'object' && m !== null;
        const value = String(isObj ? (m.value || m.id || '') : m);
        const label = String(isObj ? (m.label || m.name || value) : m);
        return {
          id: value,
          label: label,
          provider: String(n.label),
        };
      });
    }
    return [];
  });

export const INITIAL_NODES = [
  {
    id: 'trigger_1',
    type: 'wareweNode',
    position: { x: 400, y: 50 },
    data: {
      label: 'Manual Trigger',
      toolId: 'trigger.manual',
      executionKey: 'trigger_manual',
      isTrigger: true,
      status: 'idle',
      config: {},
    },
  },
];

export const INITIAL_EDGES = [];

/**
 * Creates a new React Flow node based on its tool definition.
 * Handles both core nodes and dynamic Pipedream integration nodes.
 */
export const makeNode = (
  toolId: string, 
  position: { x: number; y: number }, 
  nodes: any[] = [], 
  override?: { label?: string; icon?: string; appSlug?: string; actionName?: string; platformName?: string }
) => {
  const isSub = toolId.includes(':');
  const baseId = isSub ? toolId.split(':')[0] : toolId;
  const subKey = isSub ? toolId.split(':')[1] : null;

  // ─── 1. RESOLVE TOOL DEFINITION ──────────────────────────────────────────
  let tool = TOOL_REGISTRY.find((t) => t.id === baseId);

  // Fallback for Pipedream dynamic nodes (Format: pd:platform:action)
  if (toolId.startsWith('pd:') || !tool) {
    const pdTemplate = TOOL_REGISTRY.find(t => t.id === 'pipedream.action') 
      || TOOL_REGISTRY.find(t => t.executionKey === 'pipedream_action')
      || (PIPEDREAM_TEMPLATE as any); // Hard fallback to co-located template
    
    if (pdTemplate) {
      tool = { ...pdTemplate, icon: (ICON_MAP[pdTemplate.icon] || Zap) };
    }
  }

  if (!tool) {
    console.error(`[WAREWE_BUILDER] makeNode: Could not resolve tool definition for "${toolId}"`);
    return null;
  }

  // ─── 2. GENERATE UNIQUE ID ──────────────────────────────────────────────
  const nameToBrand = override?.label || tool.label || tool.id;
  const nodeBrand = nameToBrand.toLowerCase()
    .replace(/[^a-z0-9]/g, '_')   // Be much stricter with ID characters
    .replace(/_+/g, '_')          // Collapse underscores
    .replace(/^_+|_+$/g, '');     // Trim underscores
  
  const existingCount = nodes.filter(n => n.id.startsWith(nodeBrand)).length;
  const id = `${nodeBrand}_${existingCount + 1}`;

  // Configuration initialization
  let initialConfig: any = {};
  
  // 1. If it was a sub-action (like "Slack: Select Channel")
  if (isSub && tool.subActions) {
    const subAction = tool.subActions.find(s => s.id === toolId);
    if (subAction) initialConfig = { ...subAction.preConfig };
  }

  // 2. If it's a Pipedream node, ensure appSlug and actionName are set
  const isPipedream = tool.executionKey === 'pipedream_action' || toolId.startsWith('pd:');
  if (isPipedream) {
    const appSlug = override?.appSlug || (toolId.startsWith('pd:') ? toolId.split(':')[1] : null);
    const actionName = override?.actionName || (toolId.startsWith('pd:') ? toolId.split(':')[2] : null);
    
    initialConfig = {
      ...initialConfig,
      ...(appSlug ? { appSlug } : {}),
      ...(actionName ? { actionName } : {}),
      ...(override?.platformName ? { platformName: override.platformName } : {})
    };
  }

  return {
    id,
    type: 'wareweNode',
    position,
    data: {
      label: override?.label || tool.label,
      toolId: baseId,
      executionKey: tool.executionKey,
      isTrigger: tool.isTrigger,
      status: 'idle',
      config: initialConfig,
      icon: override?.icon || tool.icon,
    },
    zIndex: tool.executionKey === 'sticky_note' ? -50 : 0,
  };
};

export const getToolById = (id: string): ToolDefinition => {
  const tool = TOOL_REGISTRY.find((t) => t.id === id);
  if (tool) return tool;
  
  // Specific fallback for skill gateway nodes if they aren't in the external registry yet
  if (id === 'skill.input') {
    return {
      id: 'skill.input',
      name: 'Skill Input',
      label: 'Skill Input',
      icon: ICON_MAP['Signpost'] || Signpost,
      category: 'Triggers',
      description: 'Starting point for this skill.',
      executionKey: 'trigger_manual',
      bg: 'bg-indigo-500/10',
      color: 'text-indigo-500',
      border: 'border-indigo-500/20',
      isTrigger: true,
      inputs: [],
      outputs: [{ name: 'output', label: 'Inputs', type: 'any' }],
      configFields: []
    } as any;
  }
  if (id === 'skill.output') {
    return {
      id: 'skill.output',
      name: 'Skill Output',
      label: 'Skill Output',
      icon: ICON_MAP['Signpost'] || Signpost,
      category: 'Output',
      description: 'Terminal point for this skill.',
      executionKey: 'skill_output',
      bg: 'bg-green-500/10',
      color: 'text-green-500',
      border: 'border-green-500/20',
      isTrigger: false,
      inputs: [{ name: 'input', label: 'Output Data', type: 'any' }],
      outputs: [],
      configFields: [{ key: 'description', label: 'Summary', type: 'text', required: false }]
    } as any;
  }
  
  // Return Pipedream as fallback
  const pd = TOOL_REGISTRY.find(t => t.id === 'pipedream.action') || (PIPEDREAM_TEMPLATE as any);
  return { ...pd, icon: (ICON_MAP[pd.icon] || Zap) };
};

export const getToolByExecutionKey = (key: string): ToolDefinition => {
  return TOOL_REGISTRY.find((t) => t.executionKey === key) || TOOL_REGISTRY[0]!;
};
