import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import api from '@/lib/api';

export function useManagers() {
  return useQuery({
    queryKey: ['managers'],
    queryFn: async () => {
      const { data } = await api.get('/managers');
      return data;
    },
  });
}

export function useManager(id: string | null) {
  return useQuery({
    queryKey: ['manager', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await api.get(`/managers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (managerData: any) => {
      const { data } = await api.post('/managers', managerData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}

export function useUpdateManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const { data: updatedData } = await api.patch(`/managers/${id}`, data);
      return updatedData;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
      queryClient.invalidateQueries({ queryKey: ['manager', id] });
    },
  });
}

export function useDeleteManager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/managers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['managers'] });
    },
  });
}

export function useRunManager() {
  return useMutation({
    mutationFn: async ({ managerId, input }: { managerId: string, input: string }) => {
      const { data } = await api.post(`/managers/${managerId}/run`, { input });
      return data;
    },
  });
}

export function useManagerRun(runId: string | null) {
  return useQuery({
    queryKey: ['manager-run', runId],
    queryFn: async () => {
      if (!runId) return null;
      const { data } = await api.get(`/managers/runs/${runId}`);
      return data;
    },
    enabled: !!runId,
    refetchInterval: (data) => {
        const status = (data as any)?.status;
        return (status === 'completed' || status === 'failed') ? false : 2000;
    }
  });
}

export function useManagerStream(managerId: string) {
  const [steps, setSteps] = useState<any[]>([]);
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [runId, setRunId] = useState<string | null>(null);
  const [finalOutput, setFinalOutput] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startRun = useCallback(async (input: string) => {
    try {
      // Reset state
      setSteps([]);
      setStatus('running');
      setFinalOutput(null);

      // POST to start the run
      const { data } = await api.post(`/managers/${managerId}/run`, { input });
      const newRunId = data.runId;
      setRunId(newRunId);

      // Open EventSource for streaming
      const eventSource = new EventSource(`/managers/runs/${newRunId}/stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const step = JSON.parse(event.data);

          if (step.type === 'done') {
            setStatus(step.status === 'completed' ? 'completed' : 'failed');
            setFinalOutput(step.output);
            eventSource.close();
            eventSourceRef.current = null;
          } else {
            setSteps(prev => [...prev, step]);
          }
        } catch (e) {
          console.error('Failed to parse step:', e);
        }
      };

      eventSource.onerror = () => {
        setStatus('failed');
        eventSource.close();
        eventSourceRef.current = null;
      };

    } catch (err) {
      console.error('Failed to start run:', err);
      setStatus('failed');
    }
  }, [managerId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return { startRun, steps, status, runId, finalOutput };
}
