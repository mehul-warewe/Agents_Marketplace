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
  usableAsTool: true,
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'any', position: 'right' }],
  isTrigger: false,
  bg: 'bg-[#4A154B]/10',
  border: 'border-[#4A154B]/20',
  credentialTypes: ['slack_oauth', 'slack_webhook'],
  configFields: [
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
