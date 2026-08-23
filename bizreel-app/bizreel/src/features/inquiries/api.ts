import { api } from '@/lib/api';
import type { CreateInquiryInput, Inquiry, ReplyInquiryInput } from './types';

export async function getInquiries(): Promise<Inquiry[]> {
  const { data } = await api.get('/inquiries');
  const items = data.data || data.inquiries || data.items || data || [];
  return Array.isArray(items) ? items : [];
}

export async function createInquiry(input: CreateInquiryInput): Promise<Inquiry> {
  const payload = {
    vendorId: input.vendorId || input.vendor_id,
    listingId: input.listingId || input.listing_id,
    subject: input.subject || 'Product/Service Quote Inquiry',
    message: input.message,
  };
  const { data } = await api.post('/inquiries', payload);
  return data.data || data;
}

export async function replyInquiry(input: ReplyInquiryInput): Promise<Inquiry> {
  const { data } = await api.post(`/inquiries/${input.inquiry_id}/reply`, {
    message: input.message,
  });
  return data.data || data;
}
