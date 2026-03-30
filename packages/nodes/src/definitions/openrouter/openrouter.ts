import type { NodeDefinition } from '../../types.js';

export const openrouterNode: NodeDefinition = {
  id: 'llm.openrouter',
  label: 'OpenRouter',
  name: 'OpenRouter',
  category: 'Models',
  variant: 'connector', 
  description: 'Generic AI action using OpenRouter.',
  icon: '/iconSvg/openrouter.svg',
  color: '#7c3aed',
  bg: 'bg-[#7c3aed]/10',
  border: 'border-[#7c3aed]/20',
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
      label: 'OpenRouter Model',
      type: 'select',
      options: [],
      default: '',
    },
    {
      key: 'systemPrompt',
      label: 'System Instructions',
      type: 'textarea',
      placeholder: 'You are an AI assistant processing instructions via OpenRouter...',
    },
    {
      key: 'prompt',
      label: 'User Prompt',
      type: 'textarea',
      placeholder: 'Task: {{ message }}',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'text', placeholder: '4096' },
  ],
  outputSchema: [
    {
      key: 'result',
      type: 'string',
      description: 'The response text from OpenRouter.',
    },
  ],
  credentialTypes: ['openrouter_api_key'],
};
