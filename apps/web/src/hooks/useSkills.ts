import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const { data } = await api.get('/skills/mine');
      return data;
    },
  });
}

export function useMarketplaceSkills() {
  return useQuery({
    queryKey: ['marketplace-skills'],
    queryFn: async () => {
      const { data } = await api.get('/skills');
      return data;
    },
  });
}

export function useSkill(id: string | null) {
  return useQuery({
    queryKey: ['skill', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/skills/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (skillData: any) => {
      const { data } = await api.post('/skills', skillData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, skillData }: { id: string, skillData: any }) => {
      const { data } = await api.patch(`/skills/${id}`, skillData);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['skill', id] });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useRunSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ skillId, inputData, triggerNodeId, runMode }: { skillId: string, inputData?: any, triggerNodeId?: string, runMode?: 'single' | 'full' }) => {
      const { data } = await api.post(`/skills/${skillId}/run`, { inputData, triggerNodeId, runMode });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-runs'] });
    },
  });
}

export function useSkillArchitect() {
  return useMutation({
    mutationFn: async ({ prompt, history = [] }: { prompt: string; history?: {role: string; content: string}[] }) => {
      const { data } = await api.post('/skills/architect', { prompt, history });
      return data;
    },
  });
}

export function usePublishSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, published, price, category }: { id: string, published: boolean, price?: number, category?: string }) => {
      const { data } = await api.post(`/skills/${id}/publish`, { published, price, category });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace-skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useAcquireSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/skills/${id}/clone`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}
export function useUpdateSkillFromOriginal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/skills/${id}/sync`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function usePipedreamAppDetails(slug: string) {
  return useQuery({
    queryKey: ['pipedream-app', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await api.get(`/skills/pipedream/apps/${slug}`);
      return data;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}
