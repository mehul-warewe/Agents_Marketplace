import type { NodeDefinition } from '../../types.js';

export const codeNode: NodeDefinition = {
  id: 'logic.code',
  label: 'Code',
  name: 'Code',
  category: 'Logic',
  variant: 'connector',
  description: 'Run custom JavaScript in a secure sandbox.',
  icon: 'FileJson',
  color: 'text-amber-500',
  bg: 'bg-amber-500/10',
  border: 'border-amber-500/20',
  isTrigger: false,
  executionKey: 'logic_code',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  configFields: [
    {
      key: 'code',
      label: 'JavaScript Code',
      type: 'textarea',
      default: 'return {\n  ...input,\n  timestamp: new Date().toISOString()\n};',
      placeholder: 'Write your JS here...',
    },
  ],
  requiredInputs: [
    {
      key: 'input',
      label: 'Input Data',
      type: 'any',
      required: false,
      description: 'Any data passed from the previous node (optional - code can work without it)',
      example: { message: 'hello', data: {} },
    },
  ],
  outputSchema: [
    {
      key: 'result',
      type: 'any',
      description: 'Whatever the JavaScript code returns',
      example: { timestamp: '2024-03-25T10:30:00Z' },
    },
  ],
};
