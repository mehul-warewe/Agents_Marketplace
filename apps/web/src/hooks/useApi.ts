import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export function useUser() {
  const { setUser, token, logout } = useAuthStore();
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      if (!token) {
        useAuthStore.getState().setLoading(false);
        return null;
      }
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
    enabled: true, // Always run to ensure isLoading is resolved if !token
    staleTime: 1000 * 60 * 5, // 5 minutes
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

export function useCredentials() {
  return useQuery({
    queryKey: ['credentials'],
    queryFn: async () => {
      const { data } = await api.get('/credentials');
      return data;
    },
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

// Global Workforce Activity (Legacy: useAgentRuns)
export function useWorkforceRuns() {
  return useQuery({
    queryKey: ['workforce-runs'],
    queryFn: async () => {
      const { data } = await api.get('/employees/runs/my'); 
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useWorkforceRunDetails(runId: string | null) {
  return useQuery({
    queryKey: ['workforce-run-details', runId],
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

// Billing / Subscription
export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/billing/customer-portal');
      return data;
    },
  });
}

export function useSubscribe() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const { data } = await api.post('/billing/subscribe', { priceId });
      return data;
    },
  });
}

export function useKnowledgeBase() {
  return useQuery({
    queryKey: ['knowledge'],
    queryFn: async () => {
      const { data } = await api.get('/knowledge');
      return data;
    },
  });
}

export function useUploadKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const { data } = await api.post('/knowledge/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}

// Temporary: keeping legacy tools/registry here for now, or move to skills/tools
export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { data } = await api.get('/skills/tools/registry');
      return data;
    },
  });
}
export function useCredentialSchemas() {
  return useQuery({
    queryKey: ['credential-schemas'],
    queryFn: async () => {
      const { data } = await api.get('/credentials/schemas');
      return data;
    },
  });
}

export function useTestCredential() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/credentials/${id}/test`);
      return data;
    },
  });
}

// ── Pipedream Integration ──────────────────────────────────────────────────
export function usePipedreamAccounts() {
  return useQuery({
    queryKey: ['pipedream-accounts'],
    queryFn: async () => {
      const { data } = await api.get('/skills/pipedream/accounts');
      return data;
    },
  });
}

export function useDeletePdAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/skills/pipedream/accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipedream-accounts'] });
    },
  });
}

export function usePipedreamToken() {
  return useMutation({
    mutationFn: async (appId: string) => {
      const { data } = await api.post('/skills/pipedream/token', { appId });
      return data;
    },
  });
}

export function useInfinitePipedreamApps(query: string = '', limit: number = 40) {
  return useInfiniteQuery({
    queryKey: ['pipedream-apps', query],
    queryFn: async ({ pageParam = undefined }) => {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (limit) params.append('limit', limit.toString());
      if (pageParam) params.append('cursor', pageParam as string);
      
      const { data } = await api.get(`/skills/pipedream/apps?${params.toString()}`);
      return data;
    },
    getNextPageParam: (lastPage: any) => lastPage.next_cursor,
    initialPageParam: undefined,
  });
}

export function usePipedreamTriggers(appSlug: string | null | undefined) {
  return useQuery({
    queryKey: ['pipedream-triggers', appSlug],
    queryFn: async () => {
      if (!appSlug) return [];
      const { data } = await api.get('/skills/pipedream/triggers', {
        params: { appSlug }
      });
      return data;
    },
    enabled: !!appSlug,
  });
}

// ── Templates ─────────────────────────────────────────────────────────────
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
    mutationFn: async (templateId: string) => {
      const { data } = await api.post(`/templates/${templateId}/use`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
    },
  });
}
