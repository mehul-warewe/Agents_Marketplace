import type { NodeDefinition } from '../../types.js';

export const branchNode: NodeDefinition = {
  id: 'logic.branch',
  name: 'Split Branch',
  label: 'Split Branch',
  icon: 'Signpost',
  category: 'Logic',
  description: 'Split the logic stream into two parallel branches.',
  executionKey: 'logic_branch',
  bg: 'bg-indigo-500/10',
  color: 'text-indigo-500',
  border: 'border-indigo-500/20',
  isTrigger: false,
  inputs: [
    {
      name: 'input',
      label: 'Input Data',
      type: 'any',
    },
  ],
  outputs: [
    {
      name: 'branch_a',
      label: 'Branch A',
      type: 'any',
    },
    {
      name: 'branch_b',
      label: 'Branch B',
      type: 'any',
    },
  ],
  configFields: [],
};
