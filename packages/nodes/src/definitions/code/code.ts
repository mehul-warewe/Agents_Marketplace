import type { NodeDefinition } from '../../types.js';

export const codeNode: NodeDefinition = {
  id: 'logic.code',
  label: 'Code',
  name: 'Code',
  category: 'Logic',
  variant: 'connector',
  description: 'Run custom JavaScript in a secure sandbox.',
  icon: 'FileJson',
  color: '#f59e0b',
  bg: 'bg-[#f59e0b]/10',
  border: 'border-[#f59e0b]/20',
  isTrigger: false,
  executionKey: 'logic_code',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
  configFields: [
    {
      key: 'code',
      label: 'JavaScript Code',
      type: 'textarea',
      default: 'return {\n  ...input,\n  timestamp: new Date().toISOString()\n};',
      placeholder: 'Write your JS here...',
    },
  ],
};
