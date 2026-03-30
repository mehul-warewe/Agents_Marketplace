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
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
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
  outputSchema: [
    {
      key: '_webhook',
      type: 'object',
      description: 'Webhook metadata (path, method, response code)',
      example: {
        path: 'my-endpoint',
        method: 'POST',
        responseCode: 200,
        responseData: '{"success": true}',
      },
    },
    {
      key: 'body',
      type: 'any',
      description: 'HTTP request body data (if JSON)',
      example: { name: 'John', email: 'john@example.com' },
    },
    {
      key: 'query',
      type: 'object',
      description: 'Query string parameters',
      example: { token: 'abc123', user: 'john' },
    },
    {
      key: 'headers',
      type: 'object',
      description: 'HTTP request headers',
      example: { 'content-type': 'application/json' },
    },
  ],
};
