/** Raw API call functions for search endpoints. */

import { api } from '@/lib/api';
import type { CategoriesResponse, Category, ListingsParams, ListingsResponse } from './types';

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<CategoriesResponse>('/categories');
  return response.data.items;
}

export async function fetchListings(params: ListingsParams): Promise<ListingsResponse> {
  const response = await api.get<ListingsResponse>('/listings', { params });
  return response.data;
}
