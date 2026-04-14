import { ChatOpenAI } from "@langchain/openai";

export function createLLM(model: string, temperature = 0.1) {
  return new ChatOpenAI({
    modelName: model || 'google/gemini-2.0-flash-001',
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Warewe Workforce Platform',
      },
    },
  });
}
