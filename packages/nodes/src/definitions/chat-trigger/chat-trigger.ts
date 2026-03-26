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
    {
      key: 'responseMode',
      label: 'Response Mode',
      type: 'select',
      options: ['When execution is finished', 'Immediately'],
      placeholder: 'When execution is finished',
    },
    { key: 'allowFileUploads', label: 'Allow File Uploads', type: 'boolean' },
  ],
  outputSchema: [
    {
      key: 'message',
      type: 'string',
      description: 'The chat message from the user',
      example: 'Find repositories for user Mehul0161',
    },
    {
      key: 'input',
      type: 'string',
      description: 'Copy of the message for template references',
      example: 'Find repositories for user Mehul0161',
    },
    {
      key: 'source',
      type: 'string',
      description: 'Message source identifier',
      example: 'chat',
    },
    {
      key: 'timestamp',
      type: 'string',
      description: 'ISO 8601 timestamp when message was received',
      example: '2026-03-25T08:18:31.615Z',
    },
  ],
  operationOutputs: {
    default: [
      { key: 'message', type: 'string', description: 'The chat message from the user' },
      { key: 'input', type: 'string', description: 'Alias for message field' },
      { key: 'userId', type: 'string', description: 'ID of user who sent message' },
      { key: 'timestamp', type: 'string', description: 'ISO 8601 timestamp when message was received' },
      { key: 'source', type: 'string', description: 'Message source (usually "chat")' },
    ],
  },
};
