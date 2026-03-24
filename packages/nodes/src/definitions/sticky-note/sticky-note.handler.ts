import type { ToolHandler, ToolContext } from '../../types.js';

export const stickyNoteHandler: ToolHandler = async (ctx: ToolContext) => {
  const { config, render } = ctx;
  return { 
    content: render(config.content || ''),
    width: render(config.width || '240'),
    height: render(config.height || '160'),
    color: config.noteColor || 'Yellow',
    source: 'sticky_note',
  };
};
