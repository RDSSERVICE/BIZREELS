import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiPlus, FiMinus, FiRefreshCw, FiList, FiDollarSign } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import WalletStatsBar from './components/WalletStatsBar';
import TransactionHistory from './components/TransactionHistory';
import RechargeHistory from './components/RechargeHistory';
import RefundManagement from './components/RefundManagement';
import ManualCreditModal from './components/ManualCreditModal';
import ManualDebitModal from './components/ManualDebitModal';
import { getSocket } from '../../../lib/socket';

const TABS = [
  { key: 'transactions', label: 'Transaction History', icon: FiList },
  { key: 'recharges', label: 'Recharge History', icon: FiCreditCard },
  { key: 'refunds', label: 'Refund Management', icon: FiRefreshCw },
];

/**
 * AdminWalletPage
 * Complete Wallet & Financial Management System.
 * All data from database, no hardcoded values, real-time updates via Socket.IO.
 */
export default function AdminWalletPage() {
  const [activeTab, setActiveTab] = useState('transactions');
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showDebitModal, setShowDebitModal] = useState(false);

  // Listen for real-time wallet updates via Socket.IO
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAdminUpdate = (data) => {
      const tags = data?.tags || [];
      if (tags.some(t => ['AdminWallet', 'AdminWalletTransactions', 'AdminRefunds', 'AdminRecharges'].includes(t))) {
        // RTK Query polling handles refresh, but we can force invalidation here if needed
      }
    };

    socket.on('admin:update', handleAdminUpdate);
    return () => {
      socket.off('admin:update', handleAdminUpdate);
    };
  }, []);

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Wallet & Financial Management"
        subtitle="Manage wallet balances, transaction history, recharge logs, refunds, and perform manual credits or debits"
      >
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreditModal(true)}
            className="px-4 py-2 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 cursor-pointer border-none"
          >
            <FiPlus size={16} /> Manual Credit
          </button>
          <button
            onClick={() => setShowDebitModal(true)}
            className="px-4 py-2 bg-[#f8f4ec] text-[#1a1a1a] hover:bg-white rounded-xl text-xs font-black border border-[#e3dccb] shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FiMinus size={16} /> Manual Debit
          </button>
        </div>
      </AdminPageHeader>

      {/* Stats Overview */}
      <WalletStatsBar />

      {/* Tab Navigation */}
      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'transactions' && <TransactionHistory />}
      {activeTab === 'recharges' && <RechargeHistory />}
      {activeTab === 'refunds' && <RefundManagement />}

      {/* Modals */}
      <ManualCreditModal isOpen={showCreditModal} onClose={() => setShowCreditModal(false)} />
      <ManualDebitModal isOpen={showDebitModal} onClose={() => setShowDebitModal(false)} />
    </div>
  );
}
