import type { NodeDefinition } from '../../types.js';

export const structuredOutputParserNode: NodeDefinition = {
  id: 'output.structured',
  label: 'Structured Output Parser',
  name: 'Structured Output Parser',
  category: 'Output',
  variant: 'connector',
  description: 'Forces the model to return data in a specific JSON format.',
  icon: 'FileJson',
  color: '#6366f1',
  bg: 'bg-[#6366f1]/10',
  border: 'border-[#6366f1]/20',
  isTrigger: false,
  executionKey: 'config_output_parser',
  inputs: [{ name: 'input', type: 'data', position: 'left' }],
  outputs: [{ name: 'output', type: 'parser', position: 'top', label: 'Output Parser' }],
  configFields: [
    {
      key: 'schemaType',
      label: 'Format Mode',
      type: 'select',
      options: ['JSON Example', 'JSON Schema'],
      placeholder: 'Select mode',
    },
    {
      key: 'schema',
      label: 'Schema / Example',
      type: 'textarea',
      placeholder: '{"name": "string", "age": "number"}',
    },
  ],
};
