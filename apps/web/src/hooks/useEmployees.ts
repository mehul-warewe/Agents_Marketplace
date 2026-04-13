import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await api.get('/employees');
      return data;
    },
  });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: ['employee', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/employees/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeData: any) => {
      const { data } = await api.post('/employees', employeeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await api.patch(`/employees/${id}`, data);
      return res.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useAssignSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, skillId, instruction }: { employeeId: string, skillId: string, instruction?: string }) => {
      const { data } = await api.post(`/employees/${employeeId}/skills`, { skillId, instruction });
      return data;
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}

export function useRemoveSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, skillId }: { employeeId: string, skillId: string }) => {
      await api.delete(`/employees/${employeeId}/skills/${skillId}`);
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}

export function useRunEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, task }: { employeeId: string, task: string }) => {
      const { data } = await api.post(`/employees/${employeeId}/run`, { task });
      return data;
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee-runs', employeeId] });
    },
  });
}

export function useEmployeeRuns(employeeId: string | null) {
  return useQuery({
    queryKey: ['employee-runs', employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data } = await api.get(`/employees/${employeeId}/runs`);
      return Array.isArray(data) ? data : [];
    },
    enabled: !!employeeId,
    refetchInterval: (data) => {
      if (!Array.isArray(data)) return false;
      const hasPending = data.some(r => r.status === 'pending' || r.status === 'running');
      return hasPending ? 2000 : false;
    },
  });
}

export function useAssignKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, knowledgeId }: { employeeId: string, knowledgeId: string }) => {
      const { data } = await api.post(`/employees/${employeeId}/knowledge`, { knowledgeId });
      return data;
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}

export function useRemoveKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeId, knowledgeId }: { employeeId: string, knowledgeId: string }) => {
      await api.delete(`/employees/${employeeId}/knowledge/${knowledgeId}`);
    },
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
}
