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
} from 'lucide-react';
import { MarkerType } from 'reactflow';

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
};

/**
 * TOOL_REGISTRY — the full node list with icons resolved for the frontend.
 * Hierarchy: Nodes with multiple operations are treated as groups.
 */
export const TOOL_REGISTRY: (ToolDefinition & { isGroup?: boolean; subActions?: any[] })[] = NODE_REGISTRY.flatMap((node) => {
  const icon = (ICON_MAP[node.icon] ?? node.icon) as IconType;
  
  // 1. Identify Operations OR Models (but not for LLM nodes anymore)
  const isLLM = node.executionKey === 'llm_run' || node.category === 'Models';
  const subActions: any[] = [];
  
  if (!isLLM) {
    const opField = node.configFields.find(f => f.key === 'operation');
    const opInputs = (node as any).operationInputs;

    // Use a Set to avoid duplicates if they exist in both places
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

    // Convert Set back to subActions
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
 * List of unique categories derived from the registry, in a preferred order.
 */
export const TOOL_CATEGORIES = [
  ...new Set(NODE_REGISTRY.map(n => n.category))
].sort((a, b) => {
  const order = ['Triggers', 'Models', 'Tools', 'Logic', 'Data', 'Databases', 'Core', 'Output'];
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
    position: { x: 100, y: 300 },
    data: {
      label: 'Manual Trigger',
      toolId: 'trigger.manual',
      executionKey: 'trigger_manual',
      isTrigger: true,
      status: 'idle',
      config: {},
    },
  },
  {
    id: 'llm_1',
    type: 'wareweNode',
    position: { x: 450, y: 300 },
    data: {
      label: 'Gemini',
      toolId: 'llm.gemini',
      executionKey: 'llm_run',
      isTrigger: false,
      status: 'idle',
      config: {
        model: 'google/gemini-2.0-flash-001',
        prompt: 'Task for Gemini: {{ message }}'
      },
    },
  },
];

export const INITIAL_EDGES = [
  {
    id: 'e_initial_trigger_llm',
    source: 'node_trigger_1',
    sourceHandle: 'output',
    target: 'node_1',
    targetHandle: 'input',
    ...EDGE_DEFAULTS 
  },
];

export const makeNode = (toolId: string, position: { x: number; y: number }, nodes: any[] = []) => {
  // Check if it's a sub-action ID like "github.mcp:createIssue"
  const isSub = toolId.includes(':');
  const baseId = isSub ? toolId.split(':')[0] : toolId;
  const subKey = isSub ? toolId.split(':')[1] : null;

  const tool = TOOL_REGISTRY.find((t) => t.id === baseId);
  if (!tool) return null;

  // Generate Human-Readable ID: e.g. gemini_1, github_2
  const prefix = tool.name.toLowerCase().replace(/\s+/g, '_');
  const existingCount = nodes.filter(n => n.id.startsWith(prefix)).length;
  const id = `${prefix}_${existingCount + 1}`;
  
  // Resolve preConfig if it was a subAction
  let preConfig = {};
  if (isSub && tool.subActions) {
    const subAction = tool.subActions.find(s => s.id === toolId);
    if (subAction) preConfig = subAction.preConfig || {};
  }

  return {
    id,
    type: 'wareweNode',
    position,
    data: {
      label: isSub && tool.subActions ? `${tool.label} ${subKey}` : tool.label,
      toolId: baseId, 
      executionKey: tool.executionKey,
      isTrigger: tool.isTrigger,
      status: 'idle',
      config: { ...preConfig }, 
    },
    zIndex: tool.executionKey === 'sticky_note' ? -50 : 0,
  };
};

export const getToolById = (id: string) => {
  // If id is "github.mcp:createIssue", first try exact match
  let tool = TOOL_REGISTRY.find((t) => t.id === id);
  if (!tool) {
    // Then try base ID (github.mcp)
    const baseId = id.split(':')[0];
    tool = TOOL_REGISTRY.find((t) => t.id === baseId || t.id.startsWith(baseId + ':'));
  }
  return tool ?? TOOL_REGISTRY[0]!;
};

export const getToolByExecutionKey = (key: string) => {
  const tool = TOOL_REGISTRY.find((t) => t.executionKey === key);
  return tool ?? TOOL_REGISTRY[0]!;
};
