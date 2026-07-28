import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiUsers, FiGift, FiFileText, FiDollarSign } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import PlansList from './components/PlansList';
import CreatePlanModal from './components/CreatePlanModal';
import UserSubscriptions from './components/UserSubscriptions';
import CouponManagement from './components/CouponManagement';
import InvoiceList from './components/InvoiceList';
import RevenueSummary from './components/RevenueSummary';
import { getSocket } from '../../../lib/socket';

const TABS = [
  { key: 'plans', label: 'Subscription Plans', icon: FiCreditCard },
  { key: 'usersub', label: 'User Subscriptions', icon: FiUsers },
  { key: 'coupons', label: 'Discount Coupons', icon: FiGift },
  { key: 'invoices', label: 'Invoices', icon: FiFileText },
  { key: 'revenue', label: 'Revenue Summary', icon: FiDollarSign },
];

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [editingPlan, setEditingPlan] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleSubscriptionUpdate = (data) => {
      // Re-fetch gets triggered automatically by RTK Query's tag invalidation,
      // but we can add secondary logs or handlers here if desired.
    };

    socket.on('subscription:updated', handleSubscriptionUpdate);
    return () => {
      socket.off('subscription:updated', handleSubscriptionUpdate);
    };
  }, []);

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setShowCreateModal(true);
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    setShowCreateModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Subscriptions & Billing Management"
        subtitle="Configure pricing tiers, manage subscriber benefits, customize discount coupons, view invoices, and analyze subscription analytics."
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'plans' && <PlansList onEdit={handleEditPlan} onCreateNew={handleCreateNew} />}
      {activeTab === 'usersub' && <UserSubscriptions />}
      {activeTab === 'coupons' && <CouponManagement />}
      {activeTab === 'invoices' && <InvoiceList />}
      {activeTab === 'revenue' && <RevenueSummary />}

      <CreatePlanModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingPlan(null); }}
        editingPlan={editingPlan}
      />
    </div>
  );
}
