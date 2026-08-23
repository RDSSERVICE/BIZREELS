import { api } from '@/lib/api';
import type { Listing } from '@/features/search/types';

export async function fetchVendorListings(): Promise<Listing[]> {
  const { data } = await api.get('/listings', { params: { my_listings: true, limit: 100 } });
  const items = data.data || data.items || data.listings || data || [];
  return Array.isArray(items) ? items : [];
}

export async function createVendorListing(payload: {
  type: 'product' | 'service';
  title: string;
  category: string;
  description?: string;
  price: number;
  salePrice?: number;
  stock?: number;
  image?: string;
}): Promise<Listing> {
  const { data } = await api.post('/listings', payload);
  return data.data || data;
}

export async function deleteVendorListing(id: string): Promise<boolean> {
  const { data } = await api.delete(`/listings/${id}`);
  return data.success || true;
}
