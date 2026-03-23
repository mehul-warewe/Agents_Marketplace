import type { NodeDefinition } from '../types';

export const logicNodes: NodeDefinition[] = [
  {
    id: 'logic.if',
    label: 'If',
    name: 'If',
    category: 'Logic',
    variant: 'connector',
    description: 'A binary router that splits the workflow into True and False paths based on data values.',
    icon: 'Signpost',
    color: '#408000',
    bg: 'bg-[#408000]/5',
    border: 'border-[#408000]/30',
    isTrigger: false,
    executionKey: 'logic_if',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [
      { name: 'true', type: 'data', position: 'right', label: 'true' },
      { name: 'false', type: 'data', position: 'right', label: 'false' },
    ],
    configFields: [
      {
        key: 'conditions',
        label: 'Conditions',
        type: 'filter',
        default: {
          combine: 'and',
          conditions: [{ leftValue: '', operator: 'equal', rightValue: '{input.success}' }],
        },
      },
    ],
  },
  {
    id: 'logic.code',
    label: 'Code',
    name: 'Code',
    category: 'Logic',
    variant: 'connector',
    description: 'Execute custom JavaScript (Node.js vm) to transform data.',
    icon: 'Code',
    color: '#8b5cf6',
    bg: 'bg-[#8b5cf6]/10',
    border: 'border-[#8b5cf6]/30',
    isTrigger: false,
    executionKey: 'logic_code',
    inputs: [{ name: 'input', type: 'data', position: 'left' }],
    outputs: [{ name: 'output', type: 'data', position: 'right' }],
    configFields: [
      {
        key: 'jsCode',
        label: 'JavaScript Code',
        type: 'textarea',
        default: 'return {\n  ...$input,\n  customField: "Hello World"\n};',
      },
    ],
  },
];
