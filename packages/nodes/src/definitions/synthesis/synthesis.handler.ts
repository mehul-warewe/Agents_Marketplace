import { AgentExecutor, createToolCallingAgent } from '@langchain/classic/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ToolContext, ToolHandler } from '../../types.js';
import { getLangChainModel, getLangChainTools } from '../../ai/langchain_helpers.js';
import { TOOL_SCHEMAS } from '../../ai/tool_schemas.js';

export const synthesisHandler: ToolHandler = async (context: ToolContext) => {
  const { config, incomingData, render, userId, credentials } = context;

  try {
    let systemMessage = render(config.systemPrompt || 'You are a professional assistant.');
    const agentInstructions = `\nYour goal is to fulfill the user's objective autonomously using the tools provided.\n- Proceed with tool calls immediately when relevant.\n- Summary results ONLY after tools executed.\n`;
    systemMessage = `${systemMessage}\n${agentInstructions}`;

    // Model and Memory resolution logic...
    const finalModelConfig = { ...config, apiKey: credentials?.apiKey || credentials?.key || '' };
    const model = await getLangChainModel(finalModelConfig, userId);

    // Tools discovery from context...
    const rawTools = incomingData['@port:Tools'] || incomingData['@port:tools'] || [];
    const toolItems = Array.isArray(rawTools) ? rawTools : [rawTools];
    const toolDefinitions = toolItems.filter(t => t.__toolDefinition === true);

    if (toolDefinitions.length === 0) {
      const response = await model.invoke([
        { role: 'system', content: systemMessage },
        { role: 'user', content: render(config.userMessage || 'Provide status report.') }
      ]);
      return { report: response.content, text: response.content };
    }

    // Agentic execution
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemMessage],
      ['user', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Note: We'd need to pass the handlers for recursive agentic calling if desired
    const tools = getLangChainTools(toolDefinitions, {}, context); 
    const agent = await createToolCallingAgent({ llm: model, tools, prompt });
    const executor = new AgentExecutor({ agent, tools, maxIterations: 10 });
    const result = await executor.invoke({ input: render(config.userMessage || 'Fulfill objective.') });

    return { report: result.output, content: result.output };
  } catch (err: any) {
    return { error: err.message, failed: true };
  }
};
