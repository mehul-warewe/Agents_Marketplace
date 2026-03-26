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
      { key: 'messageId', type: 'string', description: 'ID of sent message' },
      { key: 'threadId', type: 'string', description: 'Thread ID of sent message' },
      { key: 'status', type: 'string', description: 'Status: "sent"' },
      { key: 'timestamp', type: 'string', description: 'Send timestamp (ISO 8601)' },
    ],
    reply: [
      { key: 'messageId', type: 'string', description: 'ID of reply message' },
      { key: 'threadId', type: 'string', description: 'Thread ID' },
      { key: 'status', type: 'string', description: 'Status: "sent"' },
      { key: 'timestamp', type: 'string', description: 'Reply timestamp' },
    ],
    search: [
      { key: 'messages', type: 'array', description: 'Array of matching messages' },
      { key: 'threads', type: 'array', description: 'Array of matching threads' },
      { key: 'count', type: 'number', description: 'Number of results' },
      { key: 'nextPageToken', type: 'string', description: 'Token for pagination' },
    ],
    get: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'from', type: 'string', description: 'Sender email' },
      { key: 'to', type: 'string', description: 'Recipient email' },
      { key: 'subject', type: 'string', description: 'Email subject' },
      { key: 'body', type: 'string', description: 'Email body' },
      { key: 'timestamp', type: 'string', description: 'Email date' },
      { key: 'threadId', type: 'string', description: 'Thread ID' },
    ],
    mark_read: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'status', type: 'string', description: 'Update status' },
      { key: 'success', type: 'boolean', description: 'Whether mark succeeded' },
    ],
    delete: [
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
      { key: 'messageId', type: 'string', description: 'Deleted message ID' },
    ],
    archive: [
      { key: 'messageId', type: 'string', description: 'Archived message ID' },
      { key: 'status', type: 'string', description: 'Archive status' },
      { key: 'success', type: 'boolean', description: 'Whether archive succeeded' },
    ],
    list: [
      { key: 'messages', type: 'array', description: 'Array of messages' },
      { key: 'count', type: 'number', description: 'Number of messages' },
      { key: 'nextPageToken', type: 'string', description: 'Pagination token' },
    ],
    getAttachment: [
      { key: 'attachmentId', type: 'string', description: 'Attachment ID' },
      { key: 'filename', type: 'string', description: 'File name' },
      { key: 'mimeType', type: 'string', description: 'MIME type' },
      { key: 'size', type: 'number', description: 'File size in bytes' },
      { key: 'data', type: 'string', description: 'Attachment data (base64)' },
    ],
    addLabel: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'labelId', type: 'string', description: 'Label ID' },
      { key: 'status', type: 'string', description: 'Operation status' },
      { key: 'success', type: 'boolean', description: 'Whether label add succeeded' },
    ],
    removeLabel: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'labelId', type: 'string', description: 'Label ID' },
      { key: 'status', type: 'string', description: 'Operation status' },
      { key: 'success', type: 'boolean', description: 'Whether label remove succeeded' },
    ],
    forward: [
      { key: 'messageId', type: 'string', description: 'Forwarded message ID' },
      { key: 'newMessageId', type: 'string', description: 'ID of forwarded message' },
      { key: 'status', type: 'string', description: 'Forward status' },
    ],
    draftCreate: [
      { key: 'draftId', type: 'string', description: 'ID of created draft' },
      { key: 'messageId', type: 'string', description: 'Message ID in draft' },
      { key: 'status', type: 'string', description: 'Creation status' },
    ],
    draftSend: [
      { key: 'messageId', type: 'string', description: 'ID of sent message' },
      { key: 'threadId', type: 'string', description: 'Thread ID' },
      { key: 'status', type: 'string', description: 'Send status' },
    ],
    draftDelete: [
      { key: 'draftId', type: 'string', description: 'Draft ID' },
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
    ],
    moveToTrash: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'status', type: 'string', description: 'Move status' },
      { key: 'success', type: 'boolean', description: 'Whether move succeeded' },
    ],
    permanentlyDelete: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'status', type: 'string', description: 'Deletion status' },
      { key: 'success', type: 'boolean', description: 'Whether deletion succeeded' },
    ],
    restoreFromTrash: [
      { key: 'messageId', type: 'string', description: 'Restored message ID' },
      { key: 'status', type: 'string', description: 'Restore status' },
      { key: 'success', type: 'boolean', description: 'Whether restore succeeded' },
    ],
    getThread: [
      { key: 'threadId', type: 'string', description: 'Thread ID' },
      { key: 'messages', type: 'array', description: 'Array of messages in thread' },
      { key: 'count', type: 'number', description: 'Number of messages' },
    ],
    listThreads: [
      { key: 'threads', type: 'array', description: 'Array of threads' },
      { key: 'count', type: 'number', description: 'Number of threads' },
      { key: 'nextPageToken', type: 'string', description: 'Pagination token' },
    ],
    markAsSpam: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'status', type: 'string', description: 'Mark status' },
      { key: 'success', type: 'boolean', description: 'Whether mark succeeded' },
    ],
    unmarkAsSpam: [
      { key: 'messageId', type: 'string', description: 'Message ID' },
      { key: 'status', type: 'string', description: 'Unmark status' },
      { key: 'success', type: 'boolean', description: 'Whether unmark succeeded' },
    ],
    createFilter: [
      { key: 'filterId', type: 'string', description: 'ID of created filter' },
      { key: 'status', type: 'string', description: 'Creation status' },
      { key: 'success', type: 'boolean', description: 'Whether filter creation succeeded' },
    ],
    createSignature: [
      { key: 'signatureId', type: 'string', description: 'ID of created signature' },
      { key: 'status', type: 'string', description: 'Creation status' },
      { key: 'success', type: 'boolean', description: 'Whether signature creation succeeded' },
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
      key: 'messageId',
      type: 'string',
      description: 'Email message ID from Gmail',
      example: '18d3f2a7f8d9e5c',
    },
    {
      key: 'threadId',
      type: 'string',
      description: 'Thread ID',
      example: 'thread123',
    },
    {
      key: 'status',
      type: 'string',
      description: 'Operation status (success/error)',
      example: 'success',
    },
    {
      key: 'data',
      type: 'any',
      description: 'Operation result data',
      example: {},
    },
  ],
};
