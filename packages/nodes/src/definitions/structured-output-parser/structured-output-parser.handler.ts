import { ToolContext, ToolHandler } from '../../types.js';

/**
 * Structured Output Parser node.
 * For now, this node provides configuration for the LLM. 
 * Its runtime execution is a no-op that just passes data through.
 */
export const structuredOutputParserHandler: ToolHandler = async (context: ToolContext) => {
  return { 
    ...context.incomingData,
    _type: 'output_parser_config',
    schema: context.config.schema,
    status: 'completed'
  };
};
