import type { NodeDefinition } from '../../types.js';

export const slackNode: NodeDefinition = {
  id: 'slack.mcp',
  label: 'Slack',
  name: 'Slack',
  category: 'Tools',
  variant: 'connector',
  description: 'Complete Slack integration - manage messages, channels, reactions, users, files, and threads.',
  icon: '/iconSvg/slack.svg',
  color: '#4A154B',
  executionKey: 'slack_mcp',
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#4A154B]/10',
  border: 'border-[#4A154B]/20',
  credentialTypes: ['slack_oauth', 'slack_webhook'],
  configFields: [
    { key: 'resource', label: 'Resource Type', type: 'select',
      options: ['message', 'channel', 'reaction', 'user', 'file', 'thread'],
      default: 'message' },
    { key: 'operation', label: 'Operation', type: 'select',
      options: ['send', 'sendDirect', 'sendChannel', 'sendThread', 'update', 'delete', 'get', 'list', 'search', 'create', 'archive', 'unarchive', 'join', 'leave', 'invite', 'remove', 'setTopic', 'setDescription', 'add', 'removeReaction', 'getReactions', 'getUserInfo', 'updateProfile', 'getStatus', 'upload', 'listFiles', 'deleteFile', 'getFileInfo', 'listThreads', 'getThread', 'markRead'],
      default: 'send' },
  ],
  operationInputs: {
    send: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel or user to send message to', example: 'C12345678' },
      { key: 'text', label: 'Message Text', type: 'string', required: true, description: 'Message content', example: 'Hello!' },
      { key: 'blocks', label: 'Blocks (JSON)', type: 'string', required: false, description: 'Slack block kit JSON', example: '[]' },
      { key: 'threadTs', label: 'Thread Timestamp', type: 'string', required: false, description: 'Reply to thread', example: '1234567890.123456' },
    ],
    sendDirect: [
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to send DM to', example: 'U12345678' },
      { key: 'text', label: 'Message Text', type: 'string', required: true, description: 'Message content', example: 'Hello!' },
    ],
    sendChannel: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to send message to', example: 'C12345678' },
      { key: 'text', label: 'Message Text', type: 'string', required: true, description: 'Message content', example: 'Hello channel!' },
    ],
    sendThread: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel containing thread', example: 'C12345678' },
      { key: 'threadTs', label: 'Thread Timestamp', type: 'string', required: true, description: 'Message timestamp to reply to', example: '1234567890.123456' },
      { key: 'text', label: 'Reply Text', type: 'string', required: true, description: 'Reply content', example: 'Great point!' },
    ],
    update: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel containing message', example: 'C12345678' },
      { key: 'ts', label: 'Message Timestamp', type: 'string', required: true, description: 'Message timestamp', example: '1234567890.123456' },
      { key: 'text', label: 'New Text', type: 'string', required: true, description: 'Updated message text', example: 'Updated message' },
    ],
    delete: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel containing message', example: 'C12345678' },
      { key: 'ts', label: 'Message Timestamp', type: 'string', required: true, description: 'Message timestamp', example: '1234567890.123456' },
    ],
    get: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to get history from', example: 'C12345678' },
      { key: 'limit', label: 'Limit', type: 'string', required: false, description: 'Number of messages to return', example: '10' },
    ],
    list: [
      { key: 'types', label: 'Channel Types', type: 'string', required: false, description: 'public_channel, private_channel, im, mpim', example: 'public_channel' },
      { key: 'limit', label: 'Limit', type: 'string', required: false, description: 'Number of channels', example: '20' },
    ],
    search: [
      { key: 'query', label: 'Search Query', type: 'string', required: true, description: 'Search term', example: 'bug report' },
      { key: 'count', label: 'Count', type: 'string', required: false, description: 'Results to return', example: '10' },
    ],
    create: [
      { key: 'name', label: 'Channel Name', type: 'string', required: true, description: 'New channel name', example: 'my-channel' },
      { key: 'isPrivate', label: 'Private', type: 'string', required: false, description: 'true or false', example: 'false' },
      { key: 'description', label: 'Topic', type: 'string', required: false, description: 'Channel topic/description', example: 'Project discussions' },
    ],
    archive: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to archive', example: 'C12345678' },
    ],
    unarchive: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to unarchive', example: 'C12345678' },
    ],
    join: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to join', example: 'C12345678' },
    ],
    leave: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to leave', example: 'C12345678' },
    ],
    invite: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to invite to', example: 'C12345678' },
      { key: 'userIds', label: 'User IDs', type: 'string', required: true, description: 'Comma-separated user IDs', example: 'U123,U456' },
    ],
    remove: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel', example: 'C12345678' },
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to remove', example: 'U12345678' },
    ],
    setTopic: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel', example: 'C12345678' },
      { key: 'topic', label: 'Topic', type: 'string', required: true, description: 'New channel topic', example: 'New project focus' },
    ],
    setDescription: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel', example: 'C12345678' },
      { key: 'description', label: 'Description', type: 'string', required: true, description: 'Channel description', example: 'Channel for announcements' },
    ],
    add: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel containing message', example: 'C12345678' },
      { key: 'ts', label: 'Message Timestamp', type: 'string', required: true, description: 'Message timestamp', example: '1234567890.123456' },
      { key: 'emoji', label: 'Emoji Name', type: 'string', required: true, description: 'Emoji reaction to add', example: 'thumbsup' },
    ],
    removeReaction: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel containing message', example: 'C12345678' },
      { key: 'ts', label: 'Message Timestamp', type: 'string', required: true, description: 'Message timestamp', example: '1234567890.123456' },
      { key: 'emoji', label: 'Emoji Name', type: 'string', required: true, description: 'Emoji to remove', example: 'thumbsup' },
    ],
    getReactions: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel containing message', example: 'C12345678' },
      { key: 'ts', label: 'Message Timestamp', type: 'string', required: true, description: 'Message timestamp', example: '1234567890.123456' },
    ],
    getUserInfo: [
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to get info for', example: 'U12345678' },
    ],
    updateProfile: [
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to update', example: 'U12345678' },
      { key: 'profile', label: 'Profile (JSON)', type: 'string', required: true, description: 'Profile fields to update', example: '{"status_text":"Busy"}' },
    ],
    getStatus: [
      { key: 'userId', label: 'User ID', type: 'string', required: true, description: 'User to get status for', example: 'U12345678' },
    ],
    upload: [
      { key: 'channels', label: 'Channel IDs', type: 'string', required: true, description: 'Comma-separated channel IDs', example: 'C123,C456' },
      { key: 'filename', label: 'Filename', type: 'string', required: true, description: 'File name', example: 'report.pdf' },
      { key: 'file', label: 'File URL or Data', type: 'string', required: true, description: 'File URL or base64 data', example: 'https://...' },
      { key: 'title', label: 'Title', type: 'string', required: false, description: 'File title', example: 'Monthly Report' },
    ],
    listFiles: [
      { key: 'userId', label: 'User ID', type: 'string', required: false, description: 'User who uploaded file', example: 'U12345678' },
      { key: 'channelId', label: 'Channel ID', type: 'string', required: false, description: 'Channel containing files', example: 'C12345678' },
      { key: 'count', label: 'Count', type: 'string', required: false, description: 'Number of files', example: '10' },
    ],
    deleteFile: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to delete', example: 'F12345678' },
    ],
    getFileInfo: [
      { key: 'fileId', label: 'File ID', type: 'string', required: true, description: 'File to get info for', example: 'F12345678' },
    ],
    listThreads: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel to list threads from', example: 'C12345678' },
    ],
    getThread: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel containing thread', example: 'C12345678' },
      { key: 'ts', label: 'Thread Timestamp', type: 'string', required: true, description: 'Thread message timestamp', example: '1234567890.123456' },
    ],
    markRead: [
      { key: 'channelId', label: 'Channel ID', type: 'string', required: true, description: 'Channel', example: 'C12345678' },
      { key: 'ts', label: 'Timestamp', type: 'string', required: true, description: 'Message timestamp', example: '1234567890.123456' },
    ],
  },
  operationOutputs: {
    send: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.ts', type: 'string' },
      { key: 'data.channel', type: 'string' },
      { key: 'data.message.text', type: 'string' },
    ],
    sendDirect: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.ts', type: 'string' },
      { key: 'data.channel', type: 'string' },
    ],
    sendChannel: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.ts', type: 'string' },
    ],
    sendThread: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.ts', type: 'string' },
    ],
    update: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.text', type: 'string' },
    ],
    delete: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
    ],
    get: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.messages[0].text', type: 'string' },
      { key: 'data.messages[0].user', type: 'string' },
    ],
    list: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.channels[0].id', type: 'string' },
      { key: 'data.channels[0].name', type: 'string' },
    ],
    search: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.messages.matches[0].text', type: 'string' },
    ],
    create: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.channel.id', type: 'string' },
    ],
    archive: [{ key: 'status', type: 'string' }],
    unarchive: [{ key: 'status', type: 'string' }],
    join: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
    ],
    leave: [{ key: 'status', type: 'string' }],
    invite: [{ key: 'status', type: 'string' }],
    remove: [{ key: 'status', type: 'string' }],
    setTopic: [{ key: 'status', type: 'string' }, { key: 'data.topic', type: 'string' }],
    setDescription: [{ key: 'status', type: 'string' }],
    add: [{ key: 'status', type: 'string' }],
    removeReaction: [{ key: 'status', type: 'string' }],
    getReactions: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.message.reactions[0].name', type: 'string' },
    ],
    getUserInfo: [
      { key: 'status', type: 'string' },
      { key: 'data.ok', type: 'boolean' },
      { key: 'data.user.name', type: 'string' },
      { key: 'data.user.profile.email', type: 'string' },
    ],
    updateProfile: [{ key: 'status', type: 'string' }],
    getStatus: [
      { key: 'status', type: 'string' },
      { key: 'data.user.profile.status_text', type: 'string' },
    ],
    upload: [
      { key: 'status', type: 'string' },
      { key: 'data.file.id', type: 'string' },
    ],
    listFiles: [
      { key: 'status', type: 'string' },
      { key: 'data.files[0].name', type: 'string' },
    ],
    deleteFile: [{ key: 'status', type: 'string' }],
    getFileInfo: [
      { key: 'status', type: 'string' },
      { key: 'data.file.name', type: 'string' },
    ],
    listThreads: [
      { key: 'status', type: 'string' },
      { key: 'data.messages[0].text', type: 'string' },
    ],
    getThread: [
      { key: 'status', type: 'string' },
      { key: 'data.messages[0].text', type: 'string' },
    ],
    markRead: [{ key: 'status', type: 'string' }],
  },
  requiredInputs: [
    {
      key: 'operation',
      label: 'Operation',
      type: 'string',
      required: true,
      description: 'Slack operation to perform',
      example: 'send',
    },
  ],
  outputSchema: [
    {
      key: 'data',
      type: 'object',
      description: 'Raw Slack API response data',
    },
    {
      key: 'status',
      type: 'string',
      description: 'Operation status (success/error)',
      example: 'success',
    },
  ],
};
