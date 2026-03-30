import { AgentExecutor, createToolCallingAgent } from '@langchain/classic/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ToolContext, ToolHandler } from '../../types.js';
import { getLangChainModel, getLangChainTools } from '../../ai/langchain_helpers.js';

export const llmActionHandler: ToolHandler = async (context: ToolContext) => {
  const { config, incomingData, render, userId, credentials } = context;

  try {
    const systemPrompt = config.systemPrompt || 'You are a professional assistant.';
    const userPromptTemplate = config.prompt || config.userMessage || 'Provide status report.';
    const systemMessage = render(systemPrompt);
    const userMessage = render(userPromptTemplate);

    // Resolve model: Priority: 1. Local config (for Simple LLM), 2. Incoming model node
    const incomingModelConfig = Object.values(incomingData).find((v: any) => v && v._type === 'model_config') as any;
    
    // Merge: Node config > Incoming config > Credentials
    const finalModelConfig = { 
      model: config.model || 'google/gemini-2.0-flash-001', // Direct model support
      temperature: config.temperature || '0.7',
      ...incomingModelConfig, // Overwrites model if a Model node is connected
      apiKey: credentials?.apiKey || credentials?.key || '' 
    };
    
    const model = await getLangChainModel(finalModelConfig, userId);

    // Tools discovery...
    const rawTools = incomingData['@port:Tools'] || incomingData['@port:tools'] || [];
    const toolItems = Array.isArray(rawTools) ? rawTools : (rawTools ? [rawTools] : []);
    const toolDefinitions = toolItems.filter((t: any) => t && t.__toolDefinition === true);

    // LINEAR PATH: Simple LLM (No tools connected)
    if (toolDefinitions.length === 0) {
      console.log(`[LLM Action] Processing prompt with ${finalModelConfig.model}`);
      const response = await model.invoke([
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ]);
      return { 
        text: response.content, 
        content: response.content, 
        result: response.content,
        status: 'completed' 
      };
    }

    // AGENTIC PATH: (Maintained for power users but decoupled from default UI)
    const agentInstructions = `\nYour goal is to fulfill the user's objective autonomously using the tools provided.\n`;
    const fullSystemMessage = `${systemMessage}\n${agentInstructions}`;

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', fullSystemMessage],
      ['user', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const tools = getLangChainTools(toolDefinitions, context.handlers || {}, context);
    const agent = await createToolCallingAgent({ llm: model, tools, prompt });
    const executor = new AgentExecutor({ agent, tools, maxIterations: 10 });
    const result = await executor.invoke({ input: userMessage });

    return { 
      text: result.output, 
      content: result.output, 
      result: result.output,
      status: 'completed'
    };
  } catch (err: any) {
    console.error("[LLM Action] Execution failed:", err);
    return { error: err.message, failed: true, status: 'failed' };
  }
};
