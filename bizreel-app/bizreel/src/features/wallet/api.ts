import { api } from '@/lib/api';
import type { RechargeWalletInput, WalletInfo, WalletTransaction } from './types';

export async function getWalletInfo(): Promise<WalletInfo> {
  const { data } = await api.get('/wallet/me');
  const resData = data.data || data;
  return {
    balance: resData.balance ?? resData.wallet_balance ?? 0,
    total_spent: resData.total_spent ?? 0,
    transactions: resData.transactions || [],
  };
}

export async function getWalletTransactions(): Promise<WalletTransaction[]> {
  const { data } = await api.get('/wallet/transactions');
  const items = data.data || data.transactions || data.items || data || [];
  return Array.isArray(items) ? items : [];
}

export async function rechargeWallet(input: RechargeWalletInput): Promise<WalletInfo> {
  const { data } = await api.post('/wallet/recharge', { amount: input.amount });
  return data.data || data;
}

export async function getTopupPacks(): Promise<Array<{ amount: number; label?: string; is_popular?: boolean }>> {
  try {
    const { data } = await api.get('/wallet/topup-packs');
    const packs = data?.data?.packs || data?.packs || data || [];
    return Array.isArray(packs) ? packs : [];
  } catch (err) {
    return [];
  }
}
