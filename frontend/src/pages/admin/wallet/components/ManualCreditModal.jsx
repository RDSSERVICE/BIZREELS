import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiCheck, FiUser } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminModal from '../../../../features/admin/components/AdminModal';
import { useManualCreditWalletMutation, useLazySearchWalletUsersQuery } from '../../../../features/admin/adminApi';

const CATEGORIES = [
  { value: 'promotional', label: 'Promotional Bonus' },
  { value: 'referral', label: 'Referral Reward' },
  { value: 'compensation', label: 'Compensation' },
  { value: 'adjustment', label: 'Balance Adjustment' },
  { value: 'refund', label: 'Refund' },
  { value: 'cashback', label: 'Cashback' },
  { value: 'contest', label: 'Contest Prize' },
  { value: 'manual', label: 'Manual / Other' },
];

/**
 * ManualCreditModal
 * Enhanced manual credit form with user search, category, and notes.
 */
export default function ManualCreditModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    user_id: '',
    amount: '',
    reason: '',
    category: 'manual',
    notes: '',
  });
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [triggerSearch, { data: searchData, isFetching: searching }] = useLazySearchWalletUsersQuery();
  const [manualCredit] = useManualCreditWalletMutation();

  const users = searchData?.items || [];

  const handleUserSearch = useCallback(() => {
    if (userSearch.length >= 2) {
      triggerSearch(userSearch);
    }
  }, [userSearch, triggerSearch]);

  useEffect(() => {
    const timer = setTimeout(handleUserSearch, 400);
    return () => clearTimeout(timer);
  }, [handleUserSearch]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setForm(prev => ({ ...prev, user_id: user.id }));
    setUserSearch('');
  };

  const handleSubmit = async () => {
    if (!form.user_id) return toast.error('Please select a user');
    if (!form.amount || parseInt(form.amount) <= 0) return toast.error('Amount must be positive');
    if (!form.reason) return toast.error('Reason is required');

    setIsSubmitting(true);
    try {
      await manualCredit({
        user_id: form.user_id,
        amount: parseInt(form.amount),
        reason: form.reason,
        category: form.category,
        notes: form.notes,
      }).unwrap();
      toast.success(`Successfully credited ${form.amount} credits to ${selectedUser?.name || 'user'}!`);
      setForm({ user_id: '', amount: '', reason: '', category: 'manual', notes: '' });
      setSelectedUser(null);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Credit operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Manual Wallet Credit">
      <div className="space-y-4">
        {/* User Search */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
            Search User
          </label>
          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center">
                <FiUser className="w-4 h-4 text-brand-purple" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-xs text-text-primary block">{selectedUser.name}</span>
                <span className="text-[10px] text-text-tertiary">
                  {selectedUser.phone} • {selectedUser.roles?.join(', ')} • Balance: {selectedUser.wallet_balance}
                </span>
              </div>
              <button
                onClick={() => { setSelectedUser(null); setForm(prev => ({ ...prev, user_id: '' })); }}
                className="text-[10px] text-red-500 font-bold hover:underline"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              />
              {userSearch.length >= 2 && users.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto">
                  {users.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary text-left text-xs transition-all"
                    >
                      <FiUser className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-text-primary block truncate">{user.name}</span>
                        <span className="text-[10px] text-text-tertiary">{user.phone} • {user.roles?.join(', ')}</span>
                      </div>
                      <span className="text-[10px] font-bold text-brand-purple">{user.wallet_balance} cr</span>
                    </button>
                  ))}
                </div>
              )}
              {searching && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-xl p-3 text-xs text-text-tertiary text-center">
                  Searching...
                </div>
              )}
            </div>
          )}
        </div>

        {/* User ID (manual entry fallback) */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">User ID</label>
          <input
            type="text"
            placeholder="Or paste User ID directly"
            value={form.user_id}
            onChange={(e) => setForm(prev => ({ ...prev, user_id: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Amount (Credits)</label>
          <input
            type="number"
            min="1"
            placeholder="e.g. 100"
            value={form.amount}
            onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Reason */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Reason *</label>
          <input
            type="text"
            placeholder="e.g. Promotional bonus for new vendor"
            value={form.reason}
            onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Transaction Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
          >
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Notes (Optional)</label>
          <textarea
            rows={2}
            placeholder="Additional notes..."
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple resize-none"
          />
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <FiCheck className="w-4 h-4" />
          {isSubmitting ? 'Processing...' : 'Confirm Credit'}
        </button>
      </div>
    </AdminModal>
  );
}
