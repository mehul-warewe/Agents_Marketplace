import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useKnowledge() {
  return useQuery({
    queryKey: ['knowledge'],
    queryFn: async () => {
      const { data } = await api.get('/knowledge');
      return data;
    },
  });
}

export function useCreateKnowledge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (knowledgeData: any) => {
      const { data } = await api.post('/knowledge', knowledgeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge'] });
    },
  });
}
