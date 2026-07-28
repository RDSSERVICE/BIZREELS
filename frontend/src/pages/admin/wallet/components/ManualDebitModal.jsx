import React, { useState, useEffect, useCallback } from 'react';
import { FiSearch, FiAlertTriangle, FiUser } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminModal from '../../../../features/admin/components/AdminModal';
import { useManualDebitWalletMutation, useLazySearchWalletUsersQuery } from '../../../../features/admin/adminApi';

/**
 * ManualDebitModal
 * Enhanced manual debit form with balance validation and duplicate prevention.
 */
export default function ManualDebitModal({ isOpen, onClose }) {
  const [form, setForm] = useState({ user_id: '', amount: '', reason: '', notes: '' });
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [triggerSearch, { data: searchData, isFetching: searching }] = useLazySearchWalletUsersQuery();
  const [manualDebit] = useManualDebitWalletMutation();

  const users = searchData?.items || [];

  const handleUserSearch = useCallback(() => {
    if (userSearch.length >= 2) triggerSearch(userSearch);
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

    if (selectedUser && parseInt(form.amount) > selectedUser.wallet_balance) {
      return toast.error(`Cannot debit ${form.amount} credits. User only has ${selectedUser.wallet_balance} credits.`);
    }

    setIsSubmitting(true);
    try {
      await manualDebit({
        user_id: form.user_id,
        amount: parseInt(form.amount),
        reason: form.reason,
        notes: form.notes,
      }).unwrap();
      toast.success(`Successfully debited ${form.amount} credits from ${selectedUser?.name || 'user'}!`);
      setForm({ user_id: '', amount: '', reason: '', notes: '' });
      setSelectedUser(null);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Debit operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const overBalance = selectedUser && form.amount && parseInt(form.amount) > selectedUser.wallet_balance;

  return (
    <AdminModal isOpen={isOpen} onClose={onClose} title="Manual Wallet Debit">
      <div className="space-y-4">
        {/* Warning banner */}
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <FiAlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span className="text-[10px] text-red-400">
            This action will deduct credits from the user's wallet. This cannot be undone automatically.
          </span>
        </div>

        {/* User Search */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Search User</label>
          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded-xl">
              <div className="w-8 h-8 rounded-full bg-brand-purple/20 flex items-center justify-center">
                <FiUser className="w-4 h-4 text-brand-purple" />
              </div>
              <div className="flex-1">
                <span className="font-bold text-xs text-text-primary block">{selectedUser.name}</span>
                <span className="text-[10px] text-text-tertiary">
                  {selectedUser.phone} • Balance: <span className="font-bold text-brand-purple">{selectedUser.wallet_balance} credits</span>
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
                        <span className="text-[10px] text-text-tertiary">{user.phone}</span>
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

        {/* User ID */}
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
            placeholder="e.g. 50"
            value={form.amount}
            onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
            className={`w-full px-3 py-2 bg-surface border rounded-xl text-xs focus:outline-none ${overBalance ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-brand-purple'}`}
          />
          {overBalance && (
            <span className="text-[10px] text-red-500 mt-1 block">
              ⚠ Amount exceeds user's balance ({selectedUser.wallet_balance} credits)
            </span>
          )}
        </div>

        {/* Reason */}
        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Reason *</label>
          <input
            type="text"
            placeholder="e.g. Policy violation penalty"
            value={form.reason}
            onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
            className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
          />
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
          disabled={isSubmitting || overBalance}
          className="w-full py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <FiAlertTriangle className="w-4 h-4" />
          {isSubmitting ? 'Processing...' : 'Confirm Debit'}
        </button>
      </div>
    </AdminModal>
  );
}
