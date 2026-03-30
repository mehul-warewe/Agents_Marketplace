import type { NodeDefinition } from '../../types.js';

export const chatTrigger: NodeDefinition = {
  id: 'trigger.chat',
  label: 'When chat message received',
  name: 'Chat Trigger',
  category: 'Triggers',
  variant: 'trigger',
  description: 'Starts the workflow when a webchat message is submitted.',
  icon: 'MessageSquare',
  color: '#94a3b8',
  bg: 'bg-[#1e1e1e]',
  border: 'border-zinc-700',
  isTrigger: true,
  executionKey: 'trigger_chat',
  inputs: [],
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
  configFields: [
    { key: 'test_input', label: 'Test Chat Message', type: 'chat_test' },
    { key: 'allowFileUploads', label: 'Attach Reference Files', type: 'boolean' },
  ],
  outputSchema: [
    {
      key: 'message',
      type: 'string',
      description: 'The chat message from the user',
      example: 'Hello!',
    },
  ],
  operationOutputs: {
    default: [
      { key: 'message', type: 'string', description: 'The chat message from the user' },
    ],
  },
};
