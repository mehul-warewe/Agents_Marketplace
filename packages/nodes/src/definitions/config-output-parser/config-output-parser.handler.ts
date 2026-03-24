import type { ToolHandler, ToolContext } from '../../types.js';

export const configOutputParserHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config } = ctx;
  return { 
    schemaType: config.schemaType || 'json_example',
    schema: config.schema,
    _type: 'output_parser'
  };
};
