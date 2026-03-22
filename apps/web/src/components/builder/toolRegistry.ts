import type React from 'react';
import {
  Bot,
  Database,
  Signpost,
  FileJson,
  MousePointer2,
  MessageSquare,
  Webhook,
} from 'lucide-react';

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
};

/**
 * TOOL_REGISTRY — the full node list with icons resolved for the frontend.
 * All node metadata (ports, configFields, executionKey, etc.) comes from
 * the shared @repo/nodes package.
 */
export const TOOL_REGISTRY: ToolDefinition[] = NODE_REGISTRY.map((node) => ({
  ...node,
  // Resolve Lucide icon name → React component; SVG paths stay as strings
  icon: (ICON_MAP[node.icon] ?? node.icon) as IconType,
}));

export const TOOL_CATEGORIES = [
  'Triggers',
  'Models',
  'AI',
  'Tools',
  'Logic',
  'Data',
  'Databases',
  'Core',
  'Output',
] as const;

export const MODEL_TYPES = [
  { id: 'google/gemini-2.0-flash-001', label: 'Gemini 2.0 Flash (Fastest)', provider: 'Google' },
  { id: 'openai/gpt-4o', label: 'GPT-4o (Smartest)', provider: 'OpenAI' },
  { id: 'anthropic/claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
];

export const INITIAL_NODES = [
  {
    id: 'node_trigger_1',
    type: 'wareweNode',
    position: { x: 100, y: 300 },
    data: {
      label: 'Manual Start',
      toolId: 'trigger.manual',
      executionKey: 'trigger_manual',
      isTrigger: true,
      status: 'idle',
      config: {},
    },
  },
  {
    id: 'node_1',
    type: 'wareweNode',
    position: { x: 450, y: 300 },
    data: {
      label: 'Agent',
      toolId: 'ai.llm',
      executionKey: 'synthesis',
      isTrigger: false,
      status: 'idle',
      config: {},
    },
  },
];

export const INITIAL_EDGES = [
  {
    id: 'e_initial_trigger_agent',
    source: 'node_trigger_1',
    sourceHandle: 'context',
    target: 'node_1',
    targetHandle: 'Input',
    type: 'deletableEdge',
    animated: false,
    markerEnd: { type: 'arrowclosed', width: 12, height: 12, color: '#777' },
    style: { strokeWidth: 1.5, stroke: '#777', opacity: 0.9 },
  },
];

export const makeNode = (toolId: string, position: { x: number; y: number }) => {
  const tool = TOOL_REGISTRY.find((t) => t.id === toolId);
  if (!tool) return null;

  const id = `${tool.id.replace(/\./g, '_')}_${Date.now()}`;

  return {
    id,
    type: 'wareweNode',
    position,
    data: {
      label: tool.label,
      toolId: tool.id,
      executionKey: tool.executionKey,
      isTrigger: tool.isTrigger,
      status: 'idle',
      config: {},
    },
  };
};

export const getToolById = (id: string) => {
  const tool = TOOL_REGISTRY.find((t) => t.id === id);
  return tool ?? TOOL_REGISTRY[0]!;
};

export const getToolByExecutionKey = (key: string) => {
  const tool = TOOL_REGISTRY.find((t) => t.executionKey === key);
  return tool ?? TOOL_REGISTRY[0]!;
};
