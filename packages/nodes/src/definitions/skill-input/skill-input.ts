import { NodeDefinition } from '../../types.js';

export const skillInputNode: NodeDefinition = {
  id: 'skill.input',
  name: 'Skill Input',
  label: 'Skill Input',
  icon: 'Signpost',
  category: 'Triggers',
  description: 'The starting point for this skill. Defines what parameters this skill accepts when called by an AI Agent.',
  executionKey: 'trigger_manual', // Reuse manual trigger executor
  bg: 'bg-indigo-500/10',
  color: 'text-indigo-500',
  border: 'border-indigo-500/20',
  isTrigger: true,
  inputs: [],
  outputs: [
    { name: 'output', label: 'Inputs', type: 'any' }
  ],
  configFields: []
};
