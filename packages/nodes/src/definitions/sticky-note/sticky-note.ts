import type { NodeDefinition } from '../../types.js';

export const stickyNoteNode: NodeDefinition = {
  id: 'utility.stickyNote',
  label: 'Sticky Note',
  name: 'Instructions',
  category: 'Core',
  variant: 'connector',
  isDecorative: true,
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
      default: `# 🚀 Generate AI videos and carousels with Blotato and publish to Instagram & TikTok\n## (By Dr. Firas)\n\n![SORA2 logo](https://www.dr-firas.com/blotato-miniature.png)\n\n# 📘 Documentation  \nAccess detailed setup instructions, API config, platform connection guides, and workflow customization tips: 📎 [Open the full documentation on Notion](https://automatisation.notion.site/Turn-AI-Videos-Carousels-Into-Income-with-n8n-Fully-Automated-x-Blotato-30c3d6550fd9804b999ede955fdf409d?source=copy_link)\n\n## 🔐 Setup\n\nTo use this workflow, you will need:\n\n- An active **n8n** instance\n- A **[Blotato](https://blotato.com/?ref=firas)** account with API access\n- Instagram and/or TikTok accounts connected in **[Blotato](https://blotato.com/?ref=firas)**\n- A **Telegram Bot** for triggering the workflow and receiving notifications\n\nSetup steps:\n1. Import the workflow JSON into n8n.\n2. Add your **[Blotato](https://blotato.com/?ref=firas)** API credentials.\n3. Configure the Telegram Trigger with your bot token.\n4. Select your Instagram and TikTok accounts in the **[Blotato](https://blotato.com/?ref=firas)** post nodes.\n5. Activate the workflow.\n\n---\n## What this workflow does\n\nThis workflow provides a complete **end-to-end automation pipeline**:\n\n1. Receives a message from **Telegram** containing a public URL and a publishing instruction.\n2. Creates a content source from the URL using **Blotato**.\n3. Retrieves and validates the extracted text content.\n4. Generates either:\n   - An **AI tweet-card carousel** for Instagram, or\n   - An **AI-generated video** for TikTok.\n5. Continuously checks the visual generation status until it is fully completed.\n6. Publishes the final media automatically to **Instagram or TikTok**.\n7. Sends a confirmation message back to Telegram once the post is successfully published.`,
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
