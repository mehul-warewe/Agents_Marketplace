import type { NodeDefinition } from '../../types.js';

export const geminiNode: NodeDefinition = {
  id: 'llm.gemini',
  label: 'Gemini',
  name: 'Gemini',
  category: 'Models',
  variant: 'connector', 
  description: 'Generic action to process text with Google Gemini.',
  icon: '/iconSvg/gemini-color.svg',
  color: '#4285f4',
  bg: 'bg-[#4285f4]/10',
  border: 'border-[#4285f4]/20',
  isTrigger: false,
  executionKey: 'llm_run', // Generic key for all direct LLM calls
  inputs: [
    { name: 'input', type: 'data', position: 'left', label: 'Input' }
  ],
  outputs: [
    { name: 'output', type: 'data', position: 'right', label: 'Output' }
  ],
  configFields: [
    {
      key: 'model',
      label: 'Gemini Model',
      type: 'select',
      options: [],
      default: '',
    },
    {
      key: 'prompt',
      label: 'Prompt Template',
      type: 'textarea',
      placeholder: 'Process this: {{ input.message }}',
    },
    { key: 'temperature', label: 'Temperature (0-1)', type: 'text', placeholder: '0.7' },
    { key: 'maxTokens', label: 'Max Tokens', type: 'text', placeholder: '4096' },
  ],
  requiredInputs: [
    {
      key: 'prompt',
      label: 'Prompt',
      type: 'string',
      required: true,
      description: 'The template for processing input data.',
    },
  ],
  outputSchema: [
    {
      key: 'text',
      type: 'string',
      description: 'The response text from Gemini.',
      example: 'The summary is...',
    },
  ],
  credentialTypes: ['google_api_key'],
};
