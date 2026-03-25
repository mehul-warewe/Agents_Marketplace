import type { NodeDefinition } from '../../types.js';

export const gmailNode: NodeDefinition = {
  id: 'google.gmail',
  label: 'Gmail',
  name: 'Gmail',
  category: 'Tools',
  variant: 'connector',
  description: 'Send, search, read, reply to, or delete emails via Gmail.',
  icon: '/iconSvg/google-gmail.svg',
  color: '#ea4335',
  bg: 'bg-[#ea4335]/10',
  border: 'border-[#ea4335]/20',
  isTrigger: false,
  executionKey: 'google_gmail',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  credentialTypes: ['google_gmail_oauth'],
  configFields: [
    {
      key: 'auth_notice',
      label: 'Note: Ensure your Google account is connected to allow authentication for this node.',
      type: 'notice',
    },
    { key: 'resource', label: 'Resource', type: 'select', options: ['message', 'thread'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['send', 'reply', 'search', 'get', 'mark_read', 'delete'],
    },
  ],
  operationFields: {
    send: [
      { key: 'to', label: 'To Address', type: 'text', placeholder: 'recipient@gmail.com' },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Hello from warewe' },
      { key: 'body', label: 'Body', type: 'textarea', placeholder: 'Write your message...' },
    ],
    search: [
      { key: 'query', label: 'Search Query', type: 'text', placeholder: 'from:boss@company.com is:unread' },
      { key: 'maxResults', label: 'Max Results', type: 'text', placeholder: '10' },
    ],
    get: [
      { key: 'messageId', label: 'Message ID', type: 'text', placeholder: '18d3f2a...' },
    ],
    reply: [
      { key: 'messageId', label: 'Message ID to Reply To', type: 'text', placeholder: '18d3f2a...' },
      { key: 'body', label: 'Reply Body', type: 'textarea', placeholder: 'Your reply...' },
    ],
    mark_read: [
      { key: 'messageId', label: 'Message ID', type: 'text', placeholder: '18d3f2a...' },
      { key: 'markAs', label: 'Mark As', type: 'select', options: ['read', 'unread'] },
    ],
    delete: [
      { key: 'messageId', label: 'Message ID', type: 'text', placeholder: '18d3f2a...' },
    ],
  },
};
