import type { NodeDefinition } from '../../types.js';

export const openaiNode: NodeDefinition = {
  id: 'model.openai',
  label: 'OpenAI',
  name: 'OpenAI',
  category: 'Models',
  variant: 'connector',
  description: 'Connect OpenAI GPT models.',
  icon: '/iconSvg/openai.svg',
  color: '#10a37f',
  bg: 'bg-[#10a37f]/10',
  border: 'border-[#10a37f]/20',
  isTrigger: false,
  executionKey: 'config_model',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'model', type: 'model', position: 'top' }],
  configFields: [
    {
      key: 'model',
      label: 'Model Name',
      type: 'select',
      options: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
      placeholder: 'Select a model',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'text', placeholder: '4096' },
  ],
  credentialTypes: ['openai_api_key'],
};
