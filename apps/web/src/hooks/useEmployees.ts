import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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

export function usePublishEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { data } = await api.patch(`/employees/${id}/publish`, { published });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}

export function useEmployeeStream(runId: string | null) {
  const [steps, setSteps] = useState<any[]>([]);
  const [status, setStatus] = useState<'pending' | 'running' | 'completed' | 'failed'>('pending');
  const [output, setOutput] = useState<any>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (!runId) return;

    setIsStreaming(true);
    setSteps([]);
    setStatus('running');

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const eventSource = new EventSource(`${apiUrl}/employees/runs/${runId}/stream`, {
      withCredentials: true,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('agent_token')}`
      }
    } as any);

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'connected') {
          // Connection established
          return;
        }

        if (data.type === 'done') {
          setStatus((data.status as any) || 'completed');
          setOutput(data.output);
          setIsStreaming(false);
          eventSource.close();
          return;
        }

        // Regular step event
        setSteps(prev => [...prev, data]);
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };

    const handleError = () => {
      setIsStreaming(false);
      setStatus('failed');
      eventSource.close();
    };

    eventSource.addEventListener('message', handleMessage);
    eventSource.addEventListener('error', handleError);

    return () => {
      eventSource.removeEventListener('message', handleMessage);
      eventSource.removeEventListener('error', handleError);
      eventSource.close();
    };
  }, [runId]);

  return { steps, status, output, isStreaming };
}
