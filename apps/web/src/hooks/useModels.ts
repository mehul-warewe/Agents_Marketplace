import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

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
  top_provider?: {
    max_completion_tokens: number;
    is_moderated: boolean;
  };
}

export function useModels() {
  return useQuery<OpenRouterModel[]>({
    queryKey: ['models'],
    queryFn: async () => {
      const { data } = await api.get('/models');
      return data;
    },
    staleTime: 1000 * 60 * 60, // Models don't change that often, 1 hour cache
  });
}
