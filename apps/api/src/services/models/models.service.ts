import axios from 'axios';
import { log } from '../../shared/logger.js';

export interface OpenRouterModel {
  id: string;
  name: string;
  description: string;
  context_length: number;
  architecture?: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
  };
  pricing: {
    prompt: string;
    completion: string;
    request?: string;
    image?: string;
    input_cache_read?: string;
    input_cache_write?: string;
    web_search?: string;
  };
  supported_parameters?: string[];
  top_provider: {
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}

export class ModelsService {
  private static instance: ModelsService;
  private readonly baseUrl = 'https://openrouter.ai/api/v1';

  public static getInstance(): ModelsService {
    if (!ModelsService.instance) {
      ModelsService.instance = new ModelsService();
    }
    return ModelsService.instance;
  }

  async listModels(): Promise<OpenRouterModel[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Agents Marketplace'
        }
      });

      return response.data.data;
    } catch (error: any) {
      log.error(`[ModelsService] Failed to fetch OpenRouter models: ${error.message}`);
      throw new Error(`Intelligence discovery failure: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

export const modelsService = ModelsService.getInstance();
