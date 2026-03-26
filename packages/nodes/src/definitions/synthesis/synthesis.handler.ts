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

    // Find model configuration from upstream nodes (e.g. "OpenRouter" or "Google" model nodes)
    const incomingModelConfig = Object.values(incomingData).find((v: any) => v && v._type === 'model_config') as any;
    
    // Merge incoming config (from nodes) with local node config
    const finalModelConfig = { 
      ...config, 
      ...incomingModelConfig,
      apiKey: credentials?.apiKey || credentials?.key || '' 
    };
    
    const model = await getLangChainModel(finalModelConfig, userId);

    // Tools discovery from context...
    const rawTools = incomingData['@port:Tools'] || incomingData['@port:tools'] || [];
    const toolItems = Array.isArray(rawTools) ? rawTools : (rawTools ? [rawTools] : []);
    const toolDefinitions = toolItems.filter((t: any) => t && t.__toolDefinition === true);

    console.log(`[Synthesis] Tool Discovery: Found ${toolItems.length} items, ${toolDefinitions.length} are tool definitions`);
    if (toolDefinitions.length > 0) {
      console.log(`[Synthesis] Tools available: ${toolDefinitions.map((t: any) => t.label || t.executionKey).join(', ')}`);
    }

    if (toolDefinitions.length === 0) {
      console.log(`[Synthesis] No tools found - running Agent WITHOUT tools`);
      const response = await model.invoke([
        { role: 'system', content: systemMessage },
        { role: 'user', content: render(config.userMessage || 'Provide status report.') }
      ]);
      return { report: response.content, text: response.content };
    }

    // Agentic execution
    console.log(`[Synthesis] Starting agentic execution with ${toolDefinitions.length} tools`);
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemMessage],
      ['user', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    // Note: We'd need to pass the handlers for recursive agentic calling if desired
    const tools = getLangChainTools(toolDefinitions, context.handlers || {}, context);
    console.log(`[Synthesis] Converted ${toolDefinitions.length} tool definitions to LangChain tools`);

    const agent = await createToolCallingAgent({ llm: model, tools, prompt });
    const executor = new AgentExecutor({ agent, tools, maxIterations: 10 });
    const result = await executor.invoke({ input: render(config.userMessage || 'Fulfill objective.') });

    console.log(`[Synthesis] Agent completed with output: ${result.output?.substring(0, 100)}...`);
    return { report: result.output, content: result.output, toolsUsed: toolDefinitions.length };
  } catch (err: any) {
    return { error: err.message, failed: true };
  }
};
