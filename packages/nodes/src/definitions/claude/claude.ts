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
      key: 'systemPrompt',
      label: 'System Instructions',
      type: 'textarea',
      placeholder: 'You are a professional assistant using Claude AI...',
    },
    {
      key: 'prompt',
      label: 'User Prompt',
      type: 'textarea',
      placeholder: 'Task for Claude: {{ message }}',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'text', placeholder: '4096' },
  ],
  outputSchema: [
    {
      key: 'result',
      type: 'string',
      description: 'The response text from Claude.',
    },
  ],
  credentialTypes: ['anthropic_api_key'],
};
