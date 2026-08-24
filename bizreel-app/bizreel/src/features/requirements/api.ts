import { api } from '@/lib/api';

export interface CreateRequirementPayload {
  title: string;
  description: string;
  category: string;
  budget?: number;
  quantity?: number;
  city?: string;
}

export interface Requirement {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget?: number;
  quantity?: number;
  city?: string;
  status: string;
  createdAt: string;
}

export async function createRequirement(payload: CreateRequirementPayload): Promise<Requirement> {
  const response = await api.post<{ success: boolean; data: Requirement }>('/requirements', payload);
  return response.data.data;
}

export async function fetchMyRequirements(): Promise<Requirement[]> {
  const response = await api.get<{ success: boolean; data: Requirement[] }>('/requirements');
  return response.data.data || [];
}
