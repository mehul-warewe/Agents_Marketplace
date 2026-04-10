import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data } = await api.get('/agents');
      return data;
    },
  });
}

export function useMyAgents() {
  return useQuery({
    queryKey: ['my-agents'],
    queryFn: async () => {
      const { data } = await api.get('/agents/mine');
      return data;
    },
  });
}

export function useAgent(id: string | null) {
  return useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/agents/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAgentRuns() {
  return useQuery({
    queryKey: ['agent-runs'],
    queryFn: async () => {
      const { data } = await api.get('/agents/my-runs');
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const { data } = await api.get('/agents/dashboard-stats');
      return data;
    },
  });
}

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { data } = await api.get('/agents/tools/available');
      return data;
    },
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agentData: any) => {
      const { data } = await api.post('/agents', agentData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, agentData }: { id: string, agentData: any }) => {
      const { data } = await api.patch(`/agents/${id}`, agentData);
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent', id] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
    },
  });
}

export function useRunAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, inputData, triggerNodeId, runMode }: { agentId: string, inputData?: any, triggerNodeId?: string, runMode?: 'single' | 'full' }) => {
      const { data } = await api.post(`/agents/${agentId}/run`, { inputData, triggerNodeId, runMode });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-runs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useAcquireAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/agents/${id}/acquire`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
    },
  });
}


export function useArchitect() {
  return useMutation({
    mutationFn: async ({ prompt, history = [] }: { prompt: string; history?: {role: string; content: string}[] }) => {
      const { data } = await api.post('/agents/architect', { prompt, history });
      return data;
    },
  });
}

export function usePublishAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, published, price, category }: { id: string, published: boolean, price?: number, category?: string }) => {
      const { data } = await api.post(`/agents/${id}/publish`, { published, price, category });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] }); // Marketplace
      queryClient.invalidateQueries({ queryKey: ['my-agents'] }); // Personal list
    },
  });
}

export function usePublishAsWorker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isWorker, workerDescription, workerInputSchema }: { id: string, isWorker?: boolean, workerDescription?: string, workerInputSchema?: any }) => {
      const { data } = await api.post(`/agents/${id}/publish-as-worker`, { isWorker, workerDescription, workerInputSchema });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      queryClient.invalidateQueries({ queryKey: ['worker-directory'] });
    },
  });
}

export function useWorkers() {
  return useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const { data } = await api.get('/workers');
      return data;
    },
  });
}

export function useWorkerDirectory() {
  return useQuery({
    queryKey: ['worker-directory'],
    queryFn: async () => {
      const { data } = await api.get('/workers/directory');
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

export function useCreateCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (credentialData: any) => {
      const { data } = await api.post('/credentials', credentialData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
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
      const { data } = await api.get(`/agents/runs/${runId}`);
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
      queryClient.invalidateQueries({ queryKey: ['my-agents'] });
    },
  });
}
