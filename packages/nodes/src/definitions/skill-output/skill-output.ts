import { NodeDefinition } from '../../types.js';

export const skillOutputNode: NodeDefinition = {
  id: 'skill.output',
  name: 'Skill Output',
  label: 'Skill Output',
  icon: 'Signpost',
  category: 'Output',
  description: 'The final data returned by this skill to the calling employee or manager.',
  executionKey: 'skill_output',
  bg: 'bg-green-500/10',
  color: 'text-green-500',
  border: 'border-green-500/20',
  isTrigger: false,
  inputs: [
    { name: 'input', label: 'Output Data', type: 'any' }
  ],
  outputs: [],
  configFields: [
    {
      key: 'description',
      label: 'Summary of Output',
      type: 'text',
      required: false,
      description: 'Briefly describe what this node returns to the AI.'
    }
  ]
};
