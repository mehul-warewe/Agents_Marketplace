import { AgentExecutor, createToolCallingAgent } from '@langchain/classic/agents';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ToolContext } from './types.js';
import { getLangChainModel, getLangChainTools } from '../nodes/ai/langchain_helpers.js';
import { WORKER_NODES } from '../nodes/index.js';
import { TOOL_SCHEMAS } from './toolSchemas.js';
import { AgentAction } from '@langchain/core/agents';

export async function synthesis(context: ToolContext) {
  try {
    const { config, incomingData, ctx, render, job, userId } = context;

    let systemMessage = render(config.systemPrompt || 'You are a professional assistant.');
    
    // Base instructions for Agentic behavior
    const agentInstructions = `
Your goal is to fulfill the user's objective autonomously using the tools provided to you.
- Use any tools or external services listed in your AVAILABLE_TOOLS section immediately when they are relevant to the user's objective.
- Do not merely describe what you will do or ask for permission; proceed with the tool calls immediately.
- If multiple steps are required, perform them sequentially until the objective is fully met.
- Provide a summary of your actions ONLY after the tools have been executed.
`;

    // Add Current Context
    const now = new Date();
    const offsetStr = now.getTimezoneOffset() === -330 ? 'IST (+5:30)' : 'UTC'; // Detect common Case
    systemMessage = `${systemMessage}\n${agentInstructions}\n\nCURRENT_CONTEXT:\n- Date & Time: ${now.toISOString()}\n- Timezone: ${offsetStr}\n- Day: ${now.toLocaleDateString('en-US', { weekday: 'long' })}\n`;

    // 1. Tool, Memory, Parser and Model Gathering from Ports
    const modelPortConfig = incomingData['@port:Model'];
    const resolvedModelConfig = Array.isArray(modelPortConfig) ? modelPortConfig[0] : modelPortConfig;
    const finalModelConfig = resolvedModelConfig || config;
    
    // Memory Integration
    const memoryPort = incomingData['@port:Memory'] || incomingData['@port:memory'];
    const memoryItems: any[] = Array.isArray(memoryPort) ? memoryPort : (memoryPort ? [memoryPort] : []);
    let recalledMemory = '';
    memoryItems.forEach(item => {
      const hist = item.history || item.memory || item.context || '';
      if (hist) recalledMemory += `${hist}\n`;
    });

    // Smart Truncation mapping (approx 12000 chars = 3000 tokens)
    const MAX_MEMORY_CHARS = 12000;
    if (recalledMemory.length > MAX_MEMORY_CHARS) {
      recalledMemory = recalledMemory.slice(-MAX_MEMORY_CHARS);
      recalledMemory = "...[older memory truncated]...\n" + recalledMemory;
    }

    if (recalledMemory) {
      systemMessage += `\n\nRECALLED_CONTEXT:\n${recalledMemory.trim()}\nConsider the above history/memory when deciding your next action.`;
    }

    const rawTools = incomingData['@port:Tools'] || incomingData['@port:tools'] || incomingData['@port:Tool'] || incomingData['@port:tool'];
    const toolItems: any[] = Array.isArray(rawTools) ? rawTools : (rawTools ? [rawTools] : []);
    const toolDefinitions = toolItems.filter(t => t.__toolDefinition === true);

    // Build Architecture Context for the LLM
    const brainName = finalModelConfig.label || finalModelConfig.model || 'General Reasoner';
    const archSummary = `
ARCHITECTURE_CONTEXT:
- BRAIN: Using ${brainName}
- MEMORY: ${memoryItems.length > 0 ? 'ACTIVE (Connected to storage)' : 'EPHEMERAL (No persistent storage)'}
- SKILLS: ${toolDefinitions.length} tool(s) attached and ready.
`;
    systemMessage = `${archSummary}\n${systemMessage}`;

    if (toolDefinitions.length > 0) {
      systemMessage += `\n\nAVAILABLE_TOOLS:\nYou have access to the following tools. Use them to fulfill the user's request. NEVER say you cannot do something if a tool for it exists below:\n`;
      toolDefinitions.forEach(td => {
        // Dynamic discovery from Canvas metadata
        const label = td.label || td.name || td.executionKey;
        const fallbackSchema = TOOL_SCHEMAS[td.executionKey];
        const description = td.description || fallbackSchema?.description || 'No description provided.';
        
        systemMessage += `- ${td.executionKey} (${label}): ${description}\n`;
        
        // Dynamic Config Field transparency for the LLM
        if (td.configFields && Array.isArray(td.configFields)) {
          const fields = td.configFields.map((f: any) => `${f.label} (${f.key})`).join(', ');
          if (fields) systemMessage += `  (Configuration fields this tool uses: ${fields})\n`;
        }
      });
    }

    // Resolve Output Parser
    const parserData = incomingData['@port:Parser'];
    const resolvedParser = Array.isArray(parserData) ? parserData[0] : parserData;
    if (resolvedParser && resolvedParser.schema) {
      const formatInstruction = resolvedParser.schemaType === 'JSON Schema'
        ? `\nYou MUST return your final answer as a JSON object that strictly follows this JSON Schema:\n${resolvedParser.schema}`
        : `\nYou MUST return your final answer as a JSON object that matches this example format:\n${resolvedParser.schema}`;
      systemMessage += formatInstruction;
      systemMessage += `\nDo not include any other text, explanations, or markdown code blocks in your final response. Return ONLY the raw JSON.`;
    }
    
    // Resolve data context (context port)
    let contextData = '';
    const contextPort = incomingData['@port:context'];
    if (contextPort) {
      const portItems = Array.isArray(contextPort) ? contextPort : [contextPort];
      systemMessage += `\n\nINCOMING_CONTEXT:\nYou have direct data from the trigger or upstream nodes below. Use this to inform your reasoning:\n`;
      portItems.forEach(item => {
        const val = item.message || item.report || item.content || item.result || item.objective || (typeof item === 'string' ? item : null);
        if (val) {
          contextData += `- DATA_PACKET: ${val}\n`;
        }
      });
      systemMessage += contextData;
    }

    // 2. Discover Task / User Message
    const promptSource = config.promptSource || 'chat_trigger';
    let userMessage = config.userMessage ? render(config.userMessage) : '';
    
    // Logic for Chat Trigger vs Manual
    const chatMessage = incomingData.message || (contextPort as any)?.message;
    
    if (promptSource === 'chat_trigger' && chatMessage) {
        userMessage = chatMessage;
    } else if (!userMessage || userMessage === '{{ message }}') {
      if (contextData.trim()) {
        userMessage = `OBJECTIVE: ${contextData.trim()}`;
      } else {
        userMessage = ctx.objective || 'Provide status report.';
      }
    } else {
      userMessage = contextData.trim() ? `${contextData.trim()}\n\nTASK: ${userMessage}` : userMessage;
    }

    console.log(`[Agent Task]: ${userMessage.substring(0, 150).replace(/\n/g, ' ')}${userMessage.length > 150 ? '...' : ''}`);

    // 3. Build LangChain Agent with Callbacks
    let totalTokens = 0;
    const actionLogs: any[] = [];

    const callbackHandler = {
      handleLLMEnd(output: any) {
        const usage = output.llmOutput?.tokenUsage || output.llmOutput?.estimatedTokenUsage;
        if (usage) totalTokens += (usage.totalTokens || 0);
      },
      handleAgentAction(action: AgentAction) {
        actionLogs.push({ type: 'action', tool: action.tool, input: action.toolInput, log: action.log, time: new Date().toISOString() });
      },
      handleToolEnd(output: string) {
        actionLogs.push({ type: 'tool_result', result: output.substring(0, 500) + (output.length > 500 ? '...' : ''), time: new Date().toISOString() });
      }
    };

    const model = await getLangChainModel(finalModelConfig, userId);

    // If no tools connected, do a standard LLM call
    if (toolDefinitions.length === 0) {
      const response = await model.invoke([
        { role: 'system', content: systemMessage },
        { role: 'user', content: userMessage }
      ], { callbacks: [callbackHandler] });
      return { 
        report: response.content, 
        text: response.content, 
        content: response.content,
        _actionLogs: actionLogs,
        _tokenUsage: totalTokens
      };
    }

    const tools = getLangChainTools(toolDefinitions, WORKER_NODES, context) as any[];
    
    if (tools.length > 0) {
      console.log(`[LangChain] Registered Tools: ${tools.map(t => t.name).join(', ')}`);
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', systemMessage],
      ['user', '{input}'],
      new MessagesPlaceholder('agent_scratchpad'),
    ]);

    const agent = await createToolCallingAgent({ llm: model, tools, prompt });
    const executor = new AgentExecutor({ 
      agent, 
      tools, 
      verbose: false,
      maxIterations: 10,
      handleParsingErrors: true,
    });

    const result = await executor.invoke({ input: userMessage }, { callbacks: [callbackHandler] });
    console.log(`[Agent Result]: ${result.output.substring(0, 100).replace(/\n/g, ' ')}${result.output.length > 100 ? '...' : ''}`);

    return {
      report: result.output,
      text: result.output,
      content: result.output,
      output: result.output, // Match Port Name for easy templating
      model: finalModelConfig.model || 'unknown',
      _actionLogs: actionLogs,
      _tokenUsage: totalTokens
    };
  } 
  catch (err: any) {
    console.error('[LangChain] Synthesis Failed:', err);
    
    // Translate technical errors into friendly messages
    let friendlyMessage = 'Something went wrong with the AI agent. Please try again.';
    const errMsg = err.message || '';
    const status = err.status || err.code;

    if (status === 402 || errMsg.includes('credits') || errMsg.includes('balance')) {
      friendlyMessage = 'Your AI provider ran out of credits. Please top up your OpenRouter/OpenAI balance and try again.';
    } else if (status === 401 || errMsg.includes('API key') || errMsg.includes('Unauthorized')) {
      friendlyMessage = 'Invalid API key. Please check your model credential and reconnect it.';
    } else if (status === 429 || errMsg.includes('rate limit') || errMsg.includes('too many requests')) {
      friendlyMessage = 'The AI provider is rate-limiting your requests. Please wait a moment and try again.';
    } else if (errMsg.includes('max iterations')) {
      friendlyMessage = 'The agent hit the maximum number of steps without completing. Try simplifying your request.';
    } else if (errMsg.includes('tool') || errMsg.includes('Tool')) {
      friendlyMessage = 'A tool call failed. Make sure your credentials are connected and try again.';
    } else if (errMsg.includes('fetch') || errMsg.includes('network') || errMsg.includes('ECONNREFUSED')) {
      friendlyMessage = 'Network error — could not reach the AI provider. Check your internet connection.';
    }

    return { 
      error: friendlyMessage, 
      errorRaw: errMsg,
      report: friendlyMessage,
      failed: true,
    };
  }
}
