import type { NodeDefinition } from '../../types.js';

export const claudeNode: NodeDefinition = {
  id: 'llm.claude',
  label: 'Claude',
  name: 'Claude',
  category: 'Models',
  variant: 'connector', 
  description: 'Generic action to process text with Anthropic Claude.',
  icon: '/iconSvg/claude-color.svg',
  color: '#d97706',
  bg: 'bg-[#d97706]/10',
  border: 'border-[#d97706]/20',
  isTrigger: false,
  executionKey: 'llm_run',
  inputs: [
    { name: 'input', type: 'data', position: 'left', label: 'Input' }
  ],
  outputs: [
    { name: 'output', type: 'data', position: 'right', label: 'Output' }
  ],
  configFields: [
    {
      key: 'model',
      label: 'Claude Model',
      type: 'select',
      options: [],
      default: '',
    },
    {
      key: 'prompt',
      label: 'Prompt Template',
      type: 'textarea',
      placeholder: 'Task: {{ input.message }}',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
  ],
  credentialTypes: ['anthropic_api_key'],
};
