export type { NodeDefinition, NodeSocket, ConfigField, ConfigFieldType, NodeCategory, SocketType, SocketPosition } from './types';

import { triggers } from './definitions/triggers';
import { aiNodes } from './definitions/ai';
import { modelNodes } from './definitions/models';
import { googleNodes } from './definitions/google';
import { youtubeNodes } from './definitions/youtube';
import { logicNodes } from './definitions/logic';
import { outputParserNodes } from './definitions/output_parser';
import { dataNodes } from './definitions/data';
import type { NodeDefinition } from './types';

/**
 * The single source of truth for all node definitions.
 * Both the frontend (toolRegistry) and the worker (nodes/index) reference this.
 *
 * - Frontend: adds icon components on top via ICON_MAP
 * - Worker:   maps executionKey → handler; validates against this registry at startup
 */
export const NODE_REGISTRY: NodeDefinition[] = [
  ...triggers,
  ...aiNodes,
  ...modelNodes,
  ...googleNodes,
  ...youtubeNodes,
  ...logicNodes,
  ...outputParserNodes,
  ...dataNodes,
];

/** All unique executionKeys in the registry (used for worker validation). */
export const EXECUTION_KEYS: Set<string> = new Set(
  NODE_REGISTRY.map((n) => n.executionKey),
);

export { triggers, aiNodes, modelNodes, googleNodes, youtubeNodes, logicNodes, outputParserNodes, dataNodes };
