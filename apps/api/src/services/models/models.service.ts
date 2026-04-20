import axios from 'axios';
import { log } from '../../shared/logger.js';
import { getRedisConnection } from '@repo/queue';

export interface ModelOption {
  id: string;
  name: string;
}

const CACHE_TTL = 60 * 60 * 24; // 24 hours

export class ModelsService {
  private static instance: ModelsService;
  private redis = getRedisConnection();

  public static getInstance(): ModelsService {
    if (!ModelsService.instance) {
      ModelsService.instance = new ModelsService();
    }
    return ModelsService.instance;
  }

  async listModels(provider: string): Promise<ModelOption[]> {
    const cacheKey = `models:${provider}:list`;
    
    try {
      // Check Cache
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      let models: ModelOption[] = [];

      switch (provider.toLowerCase()) {
        case 'google':
        case 'gemini':
          models = await this.fetchGoogleModels();
          break;
        case 'openai':
          models = await this.fetchOpenAIModels();
          break;
        case 'anthropic':
        case 'claude':
          models = await this.fetchAnthropicModels();
          break;
        case 'openrouter':
          models = await this.fetchOpenRouterModels();
          break;
        default:
          throw new Error(`Unsupported intelligence provider: ${provider}`);
      }

      // Store in Cache
      await this.redis.setex(cacheKey, CACHE_TTL, JSON.stringify(models));
      return models;
    } catch (error: any) {
      log.error(`[ModelsService] Discovery failure for ${provider}: ${error.message}`);
      return [];
    }
  }

  private async fetchGoogleModels(): Promise<ModelOption[]> {
    const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    if (!key) return [];
    
    const res = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    return res.data.models
      .filter((m: any) => m.supportedGenerationMethods.includes('generateContent'))
      .map((m: any) => ({
        id: m.name.replace('models/', ''),
        name: m.displayName
      }));
  }

  private async fetchOpenAIModels(): Promise<ModelOption[]> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return [];

    const res = await axios.get('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    return res.data.data
      .filter((m: any) => m.id.startsWith('gpt'))
      .map((m: any) => ({
        id: m.id,
        name: m.id.toUpperCase()
      }));
  }

  private async fetchAnthropicModels(): Promise<ModelOption[]> {
    // Anthropic doesn't have a public models list API like others, using high-trust defaults
    return [
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' }
    ];
  }

  private async fetchOpenRouterModels(): Promise<ModelOption[]> {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return [];

    const res = await axios.get('https://openrouter.ai/api/v1/models', {
      headers: { 'Authorization': `Bearer ${key}` }
    });
    return res.data.data.map((m: any) => ({
      id: m.id,
      name: m.name
    }));
  }
}

export const modelsService = ModelsService.getInstance();
