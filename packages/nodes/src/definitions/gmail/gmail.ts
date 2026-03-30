import type { NodeDefinition } from '../../types.js';

export const gmailNode: NodeDefinition = {
  id: 'google.gmail',
  label: 'Gmail',
  name: 'Gmail',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Gmail integration - send, search, manage emails, drafts, labels, and filters.',
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
    { key: 'resource', label: 'Resource Type', type: 'select', options: ['message', 'thread', 'draft', 'label', 'filter', 'signature', 'attachment'] },
    {
      key: 'operation',
      label: 'Operation',
      type: 'select',
      options: ['send', 'reply', 'search', 'get', 'mark_read', 'delete', 'archive', 'list', 'getAttachment', 'addLabel', 'removeLabel', 'forward', 'draftCreate', 'draftSend', 'draftDelete', 'moveToTrash', 'permanentlyDelete', 'restoreFromTrash', 'getThread', 'listThreads', 'markAsSpam', 'unmarkAsSpam', 'createFilter', 'createSignature'],
    },
  ],
  operationInputs: {
    send: [
      { key: 'to', label: 'To Address', type: 'string', required: true, description: 'Recipient email', example: 'user@gmail.com' },
      { key: 'cc', label: 'CC', type: 'string', required: false, description: 'CC recipients', example: 'cc@gmail.com' },
      { key: 'bcc', label: 'BCC', type: 'string', required: false, description: 'BCC recipients', example: 'bcc@gmail.com' },
      { key: 'subject', label: 'Subject', type: 'string', required: true, description: 'Email subject', example: 'Hello' },
      { key: 'body', label: 'Body', type: 'string', required: true, description: 'Email content', example: 'Message text' },
    ],
    reply: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'ID of message to reply to', example: '18d3f2a' },
      { key: 'body', label: 'Body', type: 'string', required: true, description: 'Reply text', example: 'Your reply' },
    ],
    search: [
      { key: 'query', label: 'Query', type: 'string', required: true, description: 'Gmail search query', example: 'from:boss is:unread' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Limit results', example: '10' },
    ],
    get: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email message ID', example: '18d3f2a' },
    ],
    mark_read: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email message ID', example: '18d3f2a' },
      { key: 'markAs', label: 'Mark As', type: 'string', required: true, description: 'read or unread', example: 'read' },
    ],
    delete: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email message ID', example: '18d3f2a' },
    ],
    archive: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email to archive', example: '18d3f2a' },
    ],
    list: [
      { key: 'q', label: 'Query', type: 'string', required: false, description: 'Search query', example: 'is:unread' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of emails', example: '20' },
      { key: 'pageToken', label: 'Page Token', type: 'string', required: false, description: 'For pagination', example: 'token123' },
    ],
    getAttachment: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Message ID', example: '18d3f2a' },
      { key: 'attachmentId', label: 'Attachment ID', type: 'string', required: true, description: 'Attachment ID', example: 'attach123' },
    ],
    addLabel: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email message ID', example: '18d3f2a' },
      { key: 'label', label: 'Label Name', type: 'string', required: true, description: 'Label to add', example: 'Important' },
    ],
    removeLabel: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email message ID', example: '18d3f2a' },
      { key: 'label', label: 'Label Name', type: 'string', required: true, description: 'Label to remove', example: 'Important' },
    ],
    forward: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Message to forward', example: '18d3f2a' },
      { key: 'to', label: 'Forward To', type: 'string', required: true, description: 'Recipient email', example: 'user@gmail.com' },
      { key: 'message', label: 'Message', type: 'string', required: false, description: 'Additional text', example: 'FYI...' },
    ],
    draftCreate: [
      { key: 'to', label: 'To Address', type: 'string', required: true, description: 'Recipient email', example: 'user@gmail.com' },
      { key: 'subject', label: 'Subject', type: 'string', required: true, description: 'Email subject', example: 'Draft subject' },
      { key: 'body', label: 'Body', type: 'string', required: true, description: 'Draft content', example: 'Draft message' },
    ],
    draftSend: [
      { key: 'draftId', label: 'Draft ID', type: 'string', required: true, description: 'Draft to send', example: 'draft123' },
    ],
    draftDelete: [
      { key: 'draftId', label: 'Draft ID', type: 'string', required: true, description: 'Draft to delete', example: 'draft123' },
    ],
    moveToTrash: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email to trash', example: '18d3f2a' },
    ],
    permanentlyDelete: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email to permanently delete', example: '18d3f2a' },
    ],
    restoreFromTrash: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email to restore', example: '18d3f2a' },
    ],
    getThread: [
      { key: 'threadId', label: 'Thread ID', type: 'string', required: true, description: 'Thread to get', example: 'thread123' },
    ],
    listThreads: [
      { key: 'q', label: 'Query', type: 'string', required: false, description: 'Search query', example: 'is:unread' },
      { key: 'maxResults', label: 'Max Results', type: 'string', required: false, description: 'Number of threads', example: '10' },
    ],
    markAsSpam: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email to mark as spam', example: '18d3f2a' },
    ],
    unmarkAsSpam: [
      { key: 'messageId', label: 'Message ID', type: 'string', required: true, description: 'Email to unmark', example: '18d3f2a' },
    ],
    createFilter: [
      { key: 'from', label: 'From', type: 'string', required: false, description: 'Filter from address', example: 'sender@gmail.com' },
      { key: 'to', label: 'To', type: 'string', required: false, description: 'Filter to address', example: 'me@gmail.com' },
      { key: 'subject', label: 'Subject', type: 'string', required: false, description: 'Subject filter', example: 'invoice' },
      { key: 'action', label: 'Action', type: 'string', required: true, description: 'Skip, label, archive, etc.', example: 'archive' },
    ],
    createSignature: [
      { key: 'signature', label: 'Signature', type: 'string', required: true, description: 'Email signature text', example: 'Best regards, Name' },
    ],
  },
  operationOutputs: {
    send: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.threadId', type: 'string' },
      { key: 'data.labelIds', type: 'array' },
    ],
    reply: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.threadId', type: 'string' },
    ],
    search: [
      { key: 'status', type: 'string' },
      { key: 'data.messages[0].id', type: 'string' },
      { key: 'data.messages[0].threadId', type: 'string' },
      { key: 'data.resultSizeEstimate', type: 'number' },
    ],
    get: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.threadId', type: 'string' },
      { key: 'data.snippet', type: 'string' },
      { key: 'data.internalDate', type: 'string' },
    ],
    mark_read: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.labelIds', type: 'array' },
    ],
    delete: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    archive: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    list: [
      { key: 'status', type: 'string' },
      { key: 'data.messages[0].id', type: 'string' },
      { key: 'data.messages[0].threadId', type: 'string' },
      { key: 'data.nextPageToken', type: 'string' },
    ],
    getAttachment: [
      { key: 'status', type: 'string' },
      { key: 'data.attachmentId', type: 'string' },
      { key: 'data.size', type: 'number' },
      { key: 'data.data', type: 'string' },
    ],
    addLabel: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.labelIds', type: 'array' },
    ],
    removeLabel: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.labelIds', type: 'array' },
    ],
    forward: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.threadId', type: 'string' },
    ],
    draftCreate: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.message', type: 'object' },
    ],
    draftSend: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.threadId', type: 'string' },
    ],
    draftDelete: [
      { key: 'status', type: 'string' },
    ],
    moveToTrash: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    permanentlyDelete: [
      { key: 'status', type: 'string' },
    ],
    restoreFromTrash: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    getThread: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
      { key: 'data.messages[0].id', type: 'string' },
      { key: 'data.messages[0].snippet', type: 'string' },
    ],
    listThreads: [
      { key: 'status', type: 'string' },
      { key: 'data.threads[0].id', type: 'string' },
      { key: 'data.threads[0].snippet', type: 'string' },
    ],
    markAsSpam: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    unmarkAsSpam: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    createFilter: [
      { key: 'status', type: 'string' },
      { key: 'data.id', type: 'string' },
    ],
    createSignature: [
      { key: 'status', type: 'string' },
      { key: 'data.sendAsEmail', type: 'string' },
      { key: 'data.signature', type: 'string' },
    ],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Gmail operation to perform',
      example: 'send',
    },
  ],
  outputSchema: [
    {
      key: 'status',
      type: 'string',
      description: 'Operation status (success/error)',
      example: 'success',
    },
    {
      key: 'data',
      type: 'any',
      description: 'Raw API response from Gmail',
      example: {},
    },
  ],
};
