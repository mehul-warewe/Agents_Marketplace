import type { NodeDefinition } from '../../types.js';

export const linkedinNode: NodeDefinition = {
  id: 'linkedin.mcp',
  label: 'LinkedIn',
  name: 'LinkedIn',
  category: 'Tools',
  variant: 'connector',
  description: 'Manage LinkedIn posts and profile.',
  icon: '/iconSvg/linkedin.svg',
  color: '#0077b5',
  executionKey: 'linkedin_mcp',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#0077b5]/10',
  border: 'border-[#0077b5]/20',
  credentialTypes: ['linkedin_oauth'],
  configFields: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: [
        { label: 'Create Post', value: 'createPost' },
        { label: 'Get Member Profile', value: 'getMe' },
      ],
      default: 'createPost',
    },
  ],
  operationInputs: {
    createPost: [
      {
        key: 'text',
        label: 'Message',
        type: 'string',
        required: true,
        description: 'The text of the post',
        example: 'Hello LinkedIn network!',
      },
      {
        key: 'postAs',
        label: 'Post As',
        type: 'string', // Changed from select to match InputType
        default: 'member',
        required: true,
        description: 'Whether to post as a person or an organization',
      },
    ],
    getMe: [],
  },
  operationOutputs: {
    createPost: [
      { key: 'status', type: 'string' },
      { key: 'id', type: 'string' },
    ],
    getMe: [
      { key: 'status', type: 'string' },
      { key: 'id', type: 'string' },
      { key: 'localizedFirstName', type: 'string' },
      { key: 'localizedLastName', type: 'string' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'The operation to perform',
    },
  ],
};
