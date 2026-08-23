export interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  category?: 'order_payment' | 'recharge' | 'refund' | 'subscription';
  createdAt: string;
}

export interface WalletInfo {
  balance: number;
  total_spent?: number;
  transactions?: WalletTransaction[];
}

export interface RechargeWalletInput {
  amount: number;
}
