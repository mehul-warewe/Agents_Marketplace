import { NodeDefinition } from '../../types.js';
import { pipedreamActionHandler } from './pipedream-action.handler.js';

/**
 * Universal Pipedream Action Node
 * 
 * This is the core definition for all 3,180+ Pipedream integrations.
 * the frontend 'makeNode' function clones this template and injects
 * the specific appSlug (e.g. 'slack', 'youtube') and styling for each platform.
 */
export const pipedreamActionNode: NodeDefinition = {
  id: 'pipedream.action',
  name: 'Pipedream Action',
  label: 'Integration Node',
  icon: 'Zap',
  category: 'Integrations',
  description: 'Connect to any of 3,100+ platforms via Pipedream.',
  executionKey: 'pipedream_action', // Universal key for the worker
  bg: 'bg-indigo-500/10',
  color: 'text-indigo-500',
  border: 'border-indigo-500/20',
  isTrigger: false,
  inputs: [
    { name: 'input', label: 'Input', type: 'any' }
  ],
  outputs: [
    { name: 'output', label: 'Output', type: 'any' }
  ],
  configFields: [
    {
      key: 'appSlug',
      label: 'Platform Identifier',
      type: 'text',
      required: true,
    },
    {
      key: 'actionName',
      label: 'Specific Action',
      type: 'text',
      required: true,
    },
    {
      key: 'credentialId',
      label: 'Authentication ID',
      type: 'credential',
      required: false,
    }
  ],
};
