import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createInquiry, getInquiries, replyInquiry } from './api';
import type { CreateInquiryInput, ReplyInquiryInput } from './types';

export function useInquiries() {
  return useQuery({
    queryKey: ['inquiries', 'me'],
    queryFn: getInquiries,
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateInquiryInput) => createInquiry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'me'] });
    },
  });
}

export function useReplyInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReplyInquiryInput) => replyInquiry(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'me'] });
    },
  });
}
