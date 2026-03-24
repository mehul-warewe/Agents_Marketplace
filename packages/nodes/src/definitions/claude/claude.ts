import type { NodeDefinition } from '../../types.js';

export const claudeNode: NodeDefinition = {
  id: 'model.claude',
  label: 'Claude',
  name: 'Claude',
  category: 'Models',
  variant: 'connector',
  description: 'Connect Anthropic Claude models.',
  icon: '/iconSvg/claude-color.svg',
  color: '#d97706',
  bg: 'bg-[#d97706]/10',
  border: 'border-[#d97706]/20',
  isTrigger: false,
  executionKey: 'config_model',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'model', type: 'model', position: 'top' }],
  configFields: [
    {
      key: 'model',
      label: 'Model Name',
      type: 'select',
      options: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
      placeholder: 'Select a model',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'text', placeholder: '4096' },
  ],
  credentialTypes: ['anthropic_api_key'],
};
