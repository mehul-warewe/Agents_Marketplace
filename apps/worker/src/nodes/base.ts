import { ToolContext } from '../tools/types.js';

export interface NodeHandler {
  (context: ToolContext): Promise<any>;
}

export interface NodeDefinition {
  executionKey: string;
  handler: NodeHandler;
}
