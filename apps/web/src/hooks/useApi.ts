import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await api.get('/skills'); // Marketplace now lists published skills
      return data;
    },
  });
}

export function useUser() {
  const { setUser, token, logout } = useAuthStore();
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!token) return null;
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
        return data;
      } catch (err) {
        if ((err as any).response?.status === 401) {
          logout();
        }
        throw err;
      }
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useMyAgents() {
  return useQuery({
    queryKey: ['my-agents'],
    queryFn: async () => {
      const { data } = await api.get('/skills/mine');
      return data;
    },
  });
}

export function useAgent(id: string | null) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/skills/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAgentRuns() {
  return useQuery({
    queryKey: ['agent-runs'],
    queryFn: async () => {
      // For my-runs, we now pull from employees system
      const { data } = await api.get('/employees/runs/my'); 
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/employees/dashboard/stats');
      return data;
    },
  });
}

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      // Tools are essentially the available Skills for building
      const { data } = await api.get('/skills/tools/registry');
      return data;
    },
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agentData: any) => {
      const { data } = await api.post('/skills', agentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agentData }: { id: string, agentData: any }) => {
      const { data } = await api.patch(`/skills/${id}`, agentData);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/skills/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
    },
  });
}

export function useRunAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, inputData, triggerNodeId, runMode }: { agentId: string, inputData?: any, triggerNodeId?: string, runMode?: 'single' | 'full' }) => {
      const { data } = await api.post(`/skills/${agentId}/run`, { inputData, triggerNodeId, runMode });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee-runs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAcquireAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/skills/${id}/clone`); // Cloning a published skill
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}

export function useUpdateSkillFromOriginal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/skills/${id}/update-from-original`);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    },
  });
}

export function useArchitect() {
  return useMutation({
    mutationFn: async ({ prompt, history = [] }: { prompt: string; history?: {role: string; content: string}[] }) => {
      const { data } = await api.post('/skills/architect', { prompt, history });
      return data;
    },
  });
}

export function usePublishAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, published, price, category }: { id: string, published: boolean, price?: number, category?: string }) => {
      const { data } = await api.post(`/skills/${id}/publish`, { published, price, category });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['published-skills'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function usePublishAsWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isWorker, workerDescription, workerInputSchema }: { id: string, isWorker?: boolean, workerDescription?: string, workerInputSchema?: any }) => {
      // Legacy operation, now Skills are just Skills
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data } = await api.get('/employees'); // Employees are the new workers
      return data;
    },
  });
}

export function useWorkerDirectory() {
  return useQuery({
    queryKey: ['worker-directory'],
    queryFn: async () => {
      const { data } = await api.get('/employees/directory');
      return data;
    },
  });
}


// ─── Credentials Hooks ───────────────────────────────────────────────────────

export function useCredentialSchemas() {
  return useQuery({
    queryKey: ['credential-schemas'],
    queryFn: async () => {
      const { data } = await api.get('/credentials/schemas');
      return data;
    },
  });
}

export function useCredentials() {
  return useQuery({
    queryKey: ['credentials'],
    queryFn: async () => {
      const { data } = await api.get('/credentials');
      return data;
    },
  });
}

export function usePipedreamAccounts(appSlug?: string) {
  return useQuery({
    queryKey: ['pipedream-accounts', appSlug],
    queryFn: async () => {
      const { data } = await api.get('/credentials/pipedream/accounts', {
        params: { appSlug }
      });
      return data.accounts || [];
    },
    refetchInterval: 30000,
  });
}

export function usePipedreamTriggers(appSlug?: string) {
  return useQuery({
    queryKey: ['pipedream-triggers', appSlug],
    queryFn: async () => {
      if (!appSlug) return [];
      const { data } = await api.get('/credentials/pipedream/triggers', {
        params: { appSlug }
      });
      return data || [];
    },
    enabled: !!appSlug,
  });
}

export function usePipedreamAppDetails(appSlug: string) {
  return useQuery({
    queryKey: ['pd-app-details', appSlug],
    queryFn: async () => {
      if (!appSlug) return null;
      const { data } = await api.get(`/credentials/pipedream/apps/${appSlug}`);
      return data;
    },
    enabled: !!appSlug,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentialData: any) => {
      const { data } = await api.post('/credentials', credentialData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      // Invalidate global store
      window.dispatchEvent(new CustomEvent('warewe:refresh-connections'));
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/credentials/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      window.dispatchEvent(new CustomEvent('warewe:refresh-connections'));
    },
  });
}

export function useTestCredential() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/credentials/test/${id}`);
      return data;
    },
  });
}

export function useAgentRun(runId: string | null) {
  return useQuery({
    queryKey: ['agent-run', runId],
    queryFn: async () => {
      if (!runId) return null;
      const { data } = await api.get(`/employees/runs/${runId}`);
      return data;
    },
    enabled: !!runId,
    refetchInterval: (data) => {
      const status = (data as any)?.status;
      return (status === 'completed' || status === 'failed') ? false : 1000;
    },
  });
}

export function useInfinitePipedreamApps(search: string = '', limit: number = 40) {
  return useInfiniteQuery({
    queryKey: ['pipedream-apps-infinite', search, limit],
    queryFn: async ({ pageParam = 0 }) => {
      const { data } = await api.get('/credentials/pipedream/apps', {
        params: { search, limit, offset: pageParam }
      });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * limit;
      if (lastPage.results.length < limit || currentOffset >= lastPage.total) {
        return undefined;
      }
      return currentOffset;
    },
  });
}

export function usePipedreamToken() {
  return useMutation({
    mutationFn: async (appSlug: string) => {
      const { data } = await api.post('/credentials/pipedream/token', { appSlug });
      return data;
    },
  });
}

export function useDeletePdAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/credentials/pipedream/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pd-accounts'] });
      window.dispatchEvent(new CustomEvent('warewe:refresh-connections'));
    },
  });
}

// ─── Templates Hooks ─────────────────────────────────────────────────────────

export function useTemplates() {
  return useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data } = await api.get('/templates');
      return data;
    },
  });
}

export function useUseTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/templates/${id}/use`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}
