import type { NodeDefinition } from '../../types.js';

export const manualTrigger: NodeDefinition = {
  id: 'trigger.manual',
  label: "When clicking 'Execute workflow'",
  name: 'Manual Start',
  category: 'Triggers',
  variant: 'trigger',
  description: 'Trigger the workflow manually via the Run button.',
  icon: 'MousePointer2',
  color: '#94a3b8',
  bg: 'bg-[#1e1e1e]',
  border: 'border-zinc-700',
  isTrigger: true,
  executionKey: 'trigger_manual',
  inputs: [],
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
  configFields: [],
};
