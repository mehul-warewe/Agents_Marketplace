import type { NodeDefinition } from '../../types.js';

export const apiCallNode: NodeDefinition = {
  id: 'core.api',
  name: 'API Protocol',
  label: 'API Protocol',
  icon: 'Webhook',
  category: 'Core',
  description: 'Execute a standardized HTTP request to an external service.',
  executionKey: 'api_call',
  bg: 'bg-emerald-500/10',
  color: 'text-emerald-500',
  border: 'border-emerald-500/20',
  isTrigger: false,
  inputs: [
    {
      name: 'input',
      label: 'Input Data',
      type: 'any',
    },
  ],
  outputs: [
    {
      name: 'output',
      label: 'Response',
      type: 'any',
    },
  ],
  configFields: [
    {
      key: 'method',
      label: 'HTTP Method',
      type: 'select',
      required: true,
      options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      default: 'POST',
    },
    {
      key: 'url',
      label: 'Endpoint URL',
      type: 'text',
      required: true,
      placeholder: 'https://api.example.com/v1/resource',
    },
    {
      key: 'headers',
      label: 'Header Map',
      type: 'textarea',
      required: false,
      placeholder: '{"Authorization": "Bearer ..."}',
    },
    {
      key: 'body',
      label: 'Payload',
      type: 'textarea',
      required: false,
      placeholder: '{"key": "value"}',
    },
  ],
};
