import type { NodeDefinition } from '../../types.js';

export const openaiNode: NodeDefinition = {
  id: 'llm.openai',
  label: 'OpenAI',
  name: 'OpenAI',
  category: 'Models',
  variant: 'connector', 
  description: 'Generic action to process text with OpenAI.',
  icon: '/iconSvg/openai.svg',
  color: '#10a37f',
  bg: 'bg-[#10a37f]/10',
  border: 'border-[#10a37f]/20',
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
      label: 'OpenAI Model',
      type: 'select',
      options: [],
      default: '',
    },
    {
      key: 'systemPrompt',
      label: 'System Instructions',
      type: 'textarea',
      placeholder: 'You are a professional AI assistant...',
    },
    {
      key: 'prompt',
      label: 'User Prompt',
      type: 'textarea',
      placeholder: 'Task for GPT: {{ message }}',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'text', placeholder: '4096' },
  ],
  outputSchema: [
    {
      key: 'result',
      type: 'string',
      description: 'The response text from OpenAI.',
    },
  ],
  credentialTypes: ['openai_api_key'],
};
