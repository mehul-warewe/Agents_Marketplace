import { Router } from 'express';
import { createClient, agents } from '@repo/database';
import passport from './auth.js';

const router: Router = Router();
const db = createClient(process.env.POSTGRES_URL!);

export const templates = [
  {
    id: 'customer-support-bot',
    title: 'Customer Support Bot',
    description: 'Automate customer support queries with AI-driven responses and seamless escalation.',
    icon: 'Bot',
    category: 'Automation',
    complexity: 'Moderate',
    workflow: {
      nodes: [
        { id: 'n1', data: { label: 'Manual Start', toolId: 'trigger.manual', executionKey: 'trigger_manual', config: {} }, position: { x: 100, y: 300 } },
        { id: 'n2', data: { label: 'Gemini 2.0', toolId: 'model.gemini', executionKey: 'config_model', config: { model: 'gemini-2.0-flash-001' } }, position: { x: 450, y: 550 } },
        { id: 'n3', data: { label: 'AI Agent', toolId: 'ai.llm', executionKey: 'synthesis', config: { systemPrompt: 'You are a professional support agent. Use the user input to generate a helpful response.', userMessage: '{{ message }}' } }, position: { x: 600, y: 300 } },
        { id: 'n4', data: { label: 'Gmail', toolId: 'google.gmail', executionKey: 'google_gmail', config: { operation: 'send', to: '', subject: 'Support Response' } }, position: { x: 1050, y: 300 } }
      ],
      edges: [
        { id: 'e1', source: 'n1', sourceHandle: 'output', target: 'n3', targetHandle: 'Input' },
        { id: 'e2', source: 'n2', sourceHandle: 'model', target: 'n3', targetHandle: 'Model' },
        { id: 'e3', source: 'n3', sourceHandle: 'output', target: 'n4', targetHandle: 'input' }
      ]
    }
  },
  {
    id: 'linkedin-content-engine',
    title: 'LinkedIn Content Engine',
    description: 'Generate high-quality LinkedIn posts automatically based on industry trends.',
    icon: 'Sparkles',
    category: 'Marketing',
    complexity: 'Simple',
    workflow: {
      nodes: [
        { id: 'n1', data: { label: 'Manual Start', toolId: 'trigger.manual', executionKey: 'trigger_manual', config: {} }, position: { x: 100, y: 300 } },
        { id: 'n2', data: { label: 'GPT-4o', toolId: 'model.openai', executionKey: 'config_model', config: { model: 'gpt-4o' } }, position: { x: 450, y: 550 } },
        { id: 'n3', data: { label: 'AI Agent', toolId: 'ai.llm', executionKey: 'synthesis', config: { systemPrompt: 'You are a social media expert. Create viral LinkedIn content for the given topic.', userMessage: 'Topic: {{ topic }}' } }, position: { x: 600, y: 300 } }
      ],
      edges: [
        { id: 'e1', source: 'n1', sourceHandle: 'output', target: 'n3', targetHandle: 'Input' },
        { id: 'e2', source: 'n2', sourceHandle: 'model', target: 'n3', targetHandle: 'Model' }
      ]
    }
  },
  {
    id: 'multi-channel-outreach',
    title: 'Multi-Channel Outreach',
    description: 'Coordinate personalized outreach across Email and Google Sheets tracking.',
    icon: 'Share2',
    category: 'Sales',
    complexity: 'Advanced',
    workflow: {
      nodes: [
        { id: 'n1', data: { label: 'Manual Start', toolId: 'trigger.manual', executionKey: 'trigger_manual', config: {} }, position: { x: 100, y: 300 } },
        { id: 'n2', data: { label: 'Claude 3.5', toolId: 'model.claude', executionKey: 'config_model', config: { model: 'claude-3-5-sonnet-20240620' } }, position: { x: 450, y: 550 } },
        { id: 'n3', data: { label: 'AI Agent', toolId: 'ai.llm', executionKey: 'synthesis', config: { systemPrompt: 'You are a head of sales. Personalize this outreach message for the lead.', userMessage: 'Lead: {{ lead }}' } }, position: { x: 600, y: 300 } },
        { id: 'n4', data: { label: 'Sheets', toolId: 'google.sheets', executionKey: 'google_sheets', config: { operation: 'append', spreadsheetId: '', range: 'Sheet1!A1' } }, position: { x: 1050, y: 300 } }
      ],
      edges: [
        { id: 'e1', source: 'n1', sourceHandle: 'output', target: 'n3', targetHandle: 'Input' },
        { id: 'e2', source: 'n2', sourceHandle: 'model', target: 'n3', targetHandle: 'Model' },
        { id: 'e3', source: 'n3', sourceHandle: 'output', target: 'n4', targetHandle: 'input' }
      ]
    }
  },
  {
    id: 'data-extraction-protocol',
    title: 'Data Extraction Protocol',
    description: 'Extract and process structured data from web sources via secure API endpoints.',
    icon: 'Zap',
    category: 'Data',
    complexity: 'Moderate',
    workflow: {
      nodes: [
        { id: 'n1', data: { label: 'Webhook', toolId: 'trigger.webhook', executionKey: 'trigger_webhook', config: {} }, position: { x: 100, y: 300 } },
        { id: 'n2', data: { label: 'Gemini 2.0', toolId: 'model.gemini', executionKey: 'config_model', config: { model: 'gemini-2.0-flash-001' } }, position: { x: 450, y: 550 } },
        { id: 'n3', data: { label: 'AI Agent', toolId: 'ai.llm', executionKey: 'synthesis', config: { systemPrompt: 'Extract structured JSON from this text provided in the body.', userMessage: '{{ body }}' } }, position: { x: 600, y: 300 } },
        { id: 'n4', data: { label: 'Sheets', toolId: 'google.sheets', executionKey: 'google_sheets', config: { operation: 'append', spreadsheetId: '', range: 'Sheet1!A1' } }, position: { x: 1050, y: 300 } }
      ],
      edges: [
        { id: 'e1', source: 'n1', sourceHandle: 'output', target: 'n3', targetHandle: 'Input' },
        { id: 'e2', source: 'n2', sourceHandle: 'model', target: 'n3', targetHandle: 'Model' },
        { id: 'e3', source: 'n3', sourceHandle: 'output', target: 'n4', targetHandle: 'input' }
      ]
    }
  }
];

router.get('/', (req, res) => {
  res.json(templates.map(({ workflow, ...rest }) => rest));
});

router.post('/:id/use', passport.authenticate('jwt', { session: false }), async (req: any, res) => {
  const template = templates.find(t => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });

  try {
    const newAgent = await db.insert(agents).values({
      name: template.title,
      description: template.description,
      workflow: template.workflow,
      category: template.category,
      price: 0,
      creatorId: req.user.id,
      isPublished: false,
    }).returning();

    res.status(201).json(newAgent[0]);
  } catch (err) {
    console.error('Failed to use template:', err);
    res.status(500).json({ error: 'Failed to initialize template' });
  }
});

export default router;
