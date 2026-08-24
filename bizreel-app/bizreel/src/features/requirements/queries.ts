import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createRequirement, fetchMyRequirements, type CreateRequirementPayload } from './api';

export function useCreateRequirement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRequirementPayload) => createRequirement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['requirements'] });
    },
  });
}

export function useMyRequirements() {
  return useQuery({
    queryKey: ['requirements', 'me'],
    queryFn: () => fetchMyRequirements(),
  });
}
