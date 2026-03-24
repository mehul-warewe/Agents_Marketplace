import type { NodeDefinition } from '../../types.js';

export const slackNode: NodeDefinition = {
  id: 'slack.mcp',
  label: 'Slack',
  name: 'Slack',
  category: 'Tools',
  variant: 'connector',
  description: 'Send messages and manage channels via your Slack Bot Token.',
  icon: '/iconSvg/slack.svg',
  color: '#4A154B',
  executionKey: 'slack_mcp',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'tool', position: 'bottom' }],
  isTrigger: false,
  bg: 'bg-[#4A154B]/10',
  border: 'border-[#4A154B]/20',
  credentialTypes: ['slack_oauth', 'slack_webhook'],
  configFields: [
    { key: 'platform', label: 'Platform', type: 'hidden', default: 'slack' },
    { key: 'mcpUrl', label: 'MCP Server URL', type: 'text', placeholder: 'http://localhost:3002/sse', default: 'http://localhost:3002/sse' },
    { key: 'resource', label: 'Resource', type: 'select', options: ['message', 'channel'], default: 'message' },
    { key: 'operation', label: 'Operation', type: 'select', options: ['post', 'list', 'info'], default: 'post' },
  ],
  operationFields: {
    post: [
      { key: 'channelId', label: 'Channel ID', type: 'text', placeholder: 'C12345678' },
      { key: 'text', label: 'Message Text', type: 'textarea' },
    ],
    list: [{ key: 'types', label: 'Channel Types', type: 'text', placeholder: 'public_channel,private_channel' }]
  }
};
