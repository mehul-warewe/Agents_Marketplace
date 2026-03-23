import type { NodeDefinition } from '../types';

export const agentCallerNodes: NodeDefinition[] = [
  {
    id: 'tool.agent_caller',
    label: 'Call Published Agent',
    name: 'Published Agent',
    category: 'Tools',
    variant: 'connector',
    description: 'Call another published AI agent to perform a sub-task.',
    icon: 'Bot',
    color: '#3b82f6',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    isTrigger: false,
    executionKey: 'tool_agent_caller',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'data', position: 'right' }],
    configFields: [
      {
        key: 'agentId',
        label: 'Agent ID (UUID)',
        type: 'text',
        placeholder: 'Enter the UUID of the published agent',
      },
      {
        key: 'inputData',
        label: 'Input Data / Objective',
        type: 'textarea',
        placeholder: 'What should the sub-agent do? e.g., {{ incoming.report }}',
      },
    ],
  },
];
