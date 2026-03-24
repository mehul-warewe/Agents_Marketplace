import type { NodeDefinition } from '../../types.js';

export const stickyNoteNode: NodeDefinition = {
  id: 'utility.stickyNote',
  label: 'Sticky Note',
  name: 'Sticky Note',
  category: 'Logic',
  variant: 'connector',
  description: 'Add comments and documentation to your canvas.',
  icon: 'StickyNote',
  color: '#FFD233',
  bg: 'bg-[#FFD233]/20',
  border: 'border-[#FFD233]/50',
  executionKey: 'sticky_note',
  isTrigger: false,
  inputs: [],
  outputs: [],
  configFields: [
    {
      key: 'content',
      label: 'Content',
      type: 'textarea',
      default: "# I'm a note \n**Double click** to edit me.",
      placeholder: 'Enter markdown text...',
    },
    {
        key: 'noteColor',
        label: 'Color',
        type: 'color',
        default: '#FFD233'
    }
  ],
};
