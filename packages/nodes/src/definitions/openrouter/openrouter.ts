import type { NodeDefinition } from '../../types.js';

export const openrouterNode: NodeDefinition = {
  id: 'model.openrouter',
  label: 'OpenRouter',
  name: 'OpenRouter',
  category: 'Models',
  variant: 'connector',
  description: 'Connect any model via OpenRouter.',
  icon: '/iconSvg/openrouter.svg',
  color: '#7c3aed',
  bg: 'bg-[#7c3aed]/10',
  border: 'border-[#7c3aed]/20',
  isTrigger: false,
  executionKey: 'config_model',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'model', type: 'model', position: 'top' }],
  configFields: [
    {
      key: 'model',
      label: 'Model ID (OpenRouter)',
      type: 'select',
      options: ['openai/gpt-4o', 'anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5'],
      placeholder: 'Select or enter model ID',
    },
  ],
  credentialTypes: ['openrouter_api_key'],
};
