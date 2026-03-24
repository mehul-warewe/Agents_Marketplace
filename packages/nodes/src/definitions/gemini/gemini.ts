import type { NodeDefinition } from '../../types.js';

export const geminiNode: NodeDefinition = {
  id: 'model.gemini',
  label: 'Gemini',
  name: 'Gemini',
  category: 'Models',
  variant: 'connector',
  description: 'Connect Google Gemini models.',
  icon: '/iconSvg/gemini-color.svg',
  color: '#4285f4',
  bg: 'bg-[#4285f4]/10',
  border: 'border-[#4285f4]/20',
  isTrigger: false,
  executionKey: 'config_model',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'model', type: 'model', position: 'top' }],
  configFields: [
    {
      key: 'model',
      label: 'Model Name',
      type: 'select',
      options: ['gemini-2.0-flash-001', 'gemini-1.5-pro', 'gemini-1.5-flash'],
      placeholder: 'Select a model',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'text', placeholder: '4096' },
  ],
  credentialTypes: ['google_api_key'],
};
