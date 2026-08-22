/**
 * TanStack Query hooks for the search screen.
 *
 * useCategories     — fetches /categories once, cached for 30 min (rarely changes)
 * useListings       — fetches /listings with search/category params, refetches on param change
 *                     enabled only when a query (search text or selected category) is active
 */

import { useQuery } from '@tanstack/react-query';

import { fetchCategories, fetchListings } from './api';
import type { ListingsParams } from './types';

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const CATEGORIES_QUERY_KEY = ['search', 'categories'] as const;

export function useCategories() {
  return useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: fetchCategories,
    staleTime: 1000 * 60 * 30, // 30 min — categories change rarely
    gcTime: 1000 * 60 * 60,    // 1 hour
  });
}

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------

export const LISTINGS_QUERY_KEY = (params: ListingsParams) =>
  ['search', 'listings', params] as const;

export const LISTINGS_PAGE_LIMIT = 10;

/**
 * Fetches listings filtered by search text and/or category.
 * @param params  - search, category, page
 * @param enabled - only run when the user has entered a query or selected a category
 */
export function useListings(params: ListingsParams, enabled: boolean) {
  return useQuery({
    queryKey: LISTINGS_QUERY_KEY({ ...params, limit: LISTINGS_PAGE_LIMIT }),
    queryFn: () => fetchListings({ ...params, limit: LISTINGS_PAGE_LIMIT }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 min
    gcTime: 1000 * 60 * 10,   // 10 min
    placeholderData: (prev) => prev, // keep previous results visible while refetching
  });
}
