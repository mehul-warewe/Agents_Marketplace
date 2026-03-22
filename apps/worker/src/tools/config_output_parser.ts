import { ToolContext } from './types.js';

export async function configOutputParser(context: ToolContext) {
  const { config } = context;
  
  return { 
    schemaType: config.schemaType || 'JSON Example',
    schema: config.schema || '{}',
    _type: 'output_parser_config'
  };
}
