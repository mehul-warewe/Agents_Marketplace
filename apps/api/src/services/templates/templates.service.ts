import { agents } from '@repo/database';
import { db } from '../../shared/db.js';

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
        { id: 'n1', data: { label: 'Manual Start', toolId: 'trigger.manual', config: {} }, position: { x: 100, y: 300 } },
        { id: 'n2', data: { label: 'Gemini 2.0', toolId: 'llm.gemini', config: { model: 'google/gemini-2.0-flash-001' } }, position: { x: 450, y: 550 } },
        { id: 'n3', data: { label: 'AI Agent', toolId: 'ai.llm', config: { systemPrompt: 'You are a professional support agent.', userMessage: '{{ message }}' } }, position: { x: 600, y: 300 } },
        { id: 'n4', data: { label: 'Gmail', toolId: 'google.gmail', config: { operation: 'send', to: '', subject: 'Support Response' } }, position: { x: 1050, y: 300 } }
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
    description: 'Generate high-quality LinkedIn posts automatically.',
    icon: 'Sparkles',
    category: 'Marketing',
    complexity: 'Simple',
    workflow: {
      nodes: [
        { id: 'n1', data: { label: 'Manual Start', toolId: 'trigger.manual', config: {} }, position: { x: 100, y: 300 } },
        { id: 'n2', data: { label: 'GPT-4o', toolId: 'llm.openai', config: { model: 'openai/gpt-4o' } }, position: { x: 450, y: 550 } },
        { id: 'n3', data: { label: 'AI Agent', toolId: 'ai.llm', config: { systemPrompt: 'Social media expert.', userMessage: 'Topic: {{ topic }}' } }, position: { x: 600, y: 300 } }
      ],
      edges: [
        { id: 'e1', source: 'n1', sourceHandle: 'output', target: 'n3', targetHandle: 'Input' },
        { id: 'e2', source: 'n2', sourceHandle: 'model', target: 'n3', targetHandle: 'Model' }
      ]
    }
  }
];

export const templatesService = {
  getTemplates() {
    return templates.map(({ workflow, ...rest }) => rest);
  },

  async useTemplate(userId: string, templateId: string) {
    const template = templates.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const [newAgent] = await db.insert(agents).values({
      name: template.title,
      description: template.description,
      workflow: template.workflow,
      category: template.category,
      price: 0,
      creatorId: userId,
      isPublished: false,
    }).returning();

    return newAgent;
  }
};
