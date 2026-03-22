import { ToolContext } from '../../tools/types.js';

export async function configOutputParser(context: ToolContext) {
  const { config } = context;
  
  return { 
    schemaType: config.schemaType || 'json_example',
    schema: config.schema,
    _type: 'output_parser'
  };
}
