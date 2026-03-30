import type { NodeDefinition } from '../../types.js';

export const ifNode: NodeDefinition = {
  id: 'logic.if',
  label: 'If',
  name: 'If',
  category: 'Logic',
  variant: 'connector', 
  description: 'A binary router that directs the workflow to either the True or False path.',
  icon: 'Signpost',
  color: '#408000',
  bg: 'bg-[#408000]/5',
  border: 'border-[#408000]/30',
  isTrigger: false,
  executionKey: 'logic_if',
  inputs: [
    { name: 'input', type: 'data', position: 'left', label: 'Input' }
  ],
  outputs: [
    { name: 'true', type: 'data', position: 'right', label: 'True' },
    { name: 'false', type: 'data', position: 'right', label: 'False' },
  ],
  configFields: [
    {
      key: 'conditions',
      label: 'Conditions',
      type: 'filter',
      default: {
        combine: 'and',
        conditions: [{ leftValue: '{{ input.status }}', operator: 'equal', rightValue: 'success' }],
      },
    },
  ],
};
