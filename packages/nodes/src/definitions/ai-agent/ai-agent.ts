import type { NodeDefinition } from '../../types.js';

export const aiAgentNode: NodeDefinition = {
  id: 'ai.llm',
  label: 'AI Agent',
  name: 'AI Agent',
  category: 'AI',
  variant: 'agent',
  description: 'Autonomous core for processing and action.',
  icon: 'Bot',
  color: '#3b82f6',
  bg: 'bg-[#1a1a1a]',
  border: 'border-blue-500/20',
  isTrigger: false,
  executionKey: 'synthesis',
  inputs: [
    { name: 'Input', type: 'data', position: 'left' },
    { name: 'Model', type: 'model', position: 'bottom', label: 'Model*', required: true, color: '#f59e0b' },
    { name: 'Memory', type: 'memory', position: 'bottom', label: 'Memory', color: '#a855f7' },
    { name: 'Tools', type: 'tool', position: 'bottom', label: 'Tools', color: '#10b981' },
    { name: 'Parser', type: 'parser', position: 'bottom', label: 'Output Parser', color: '#6366f1' },
  ],
  outputs: [{ name: 'output', type: 'data', position: 'right' }],
  runtime: { timeout: 60000, retry: 2 },
  configFields: [
    {
      key: 'promptSource',
      label: 'Source for Prompt (User Message)',
      type: 'select',
      options: [
        { label: 'Connected Chat Trigger Node', value: 'chat_trigger' },
        { label: 'Manual parameter', value: 'manual' },
      ],
      default: 'chat_trigger',
    },
    {
      key: 'userMessage',
      label: 'Prompt (User Message)',
      type: 'textarea',
      placeholder: '{{ input.message }}',
    },
    { key: 'requireFormat', label: 'Require Specific Output Format', type: 'boolean' },
    { key: 'enableFallback', label: 'Enable Fallback Model', type: 'boolean' },
    {
      key: 'systemPrompt',
      label: 'System Prompt (Agent Personality)',
      type: 'textarea',
      placeholder: 'You are a professional assistant...',
    },
  ],
  requiredInputs: [
    {
      key: 'userMessage',
      label: 'User Message / Objective',
      type: 'string',
      required: true,
      description: 'The prompt or objective for the AI agent to process',
      example: 'Send an email to john@example.com with the meeting notes',
    },
  ],
  outputSchema: [
    {
      key: 'text',
      type: 'string',
      description: 'Primary response from the AI agent',
      example: 'Email sent successfully to john@example.com',
    },
    {
      key: 'toolCalls',
      type: 'array',
      description: 'Tools called by the agent during execution',
      example: [{ tool: 'google_gmail', action: 'send', result: 'success' }],
    },
    {
      key: 'result',
      type: 'any',
      description: 'Structured result if output parser was connected',
      example: { status: 'completed' },
    },
  ],
};
