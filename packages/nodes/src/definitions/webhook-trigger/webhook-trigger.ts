import type { NodeDefinition } from '../../types.js';

export const webhookTrigger: NodeDefinition = {
  id: 'trigger.webhook',
  label: 'Webhook',
  name: 'Webhook',
  category: 'Triggers',
  variant: 'trigger',
  description: 'Listen for an incoming HTTP request to start the workflow.',
  icon: 'Webhook',
  color: '#0ea5e9',
  bg: 'bg-[#0ea5e9]/10',
  border: 'border-[#0ea5e9]/20',
  isTrigger: true,
  executionKey: 'trigger_webhook',
  inputs: [],
  outputs: [{ name: 'output', type: 'data', position: 'top' }],
  configFields: [
    { key: 'path', label: 'Webhook Path', type: 'text', placeholder: 'my-endpoint' },
    {
      key: 'httpMethod',
      label: 'HTTP Method',
      type: 'select',
      options: ['GET', 'POST'],
      placeholder: 'POST',
    },
    { key: 'responseCode', label: 'HTTP Response Code', type: 'text', placeholder: '200' },
    {
      key: 'responseData',
      label: 'HTTP Response Data',
      type: 'textarea',
      placeholder: '{"success": true}',
    },
  ],
};
