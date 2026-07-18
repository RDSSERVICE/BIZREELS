import React, { useState } from 'react';
import { FiCreditCard, FiPlus, FiEdit, FiGift, FiFileText, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';

const TABS = [
  { key: 'plans', label: 'Subscription Plans', icon: FiCreditCard },
  { key: 'coupons', label: 'Discount Coupons', icon: FiGift },
  { key: 'invoices', label: 'Invoices', icon: FiFileText },
  { key: 'revenue', label: 'Revenue Summary', icon: FiDollarSign },
];

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [search, setSearch] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({ title: '', billing: 'monthly', price: 299, features: '' });

  const mockPlans = [
    { id: '1', title: 'Vendor Verified Monthly', billing: 'Monthly', price: 299, features: 'Verified badge, priority listings, unlimited leads', subscribers: 142, status: 'active' },
    { id: '2', title: 'Vendor Verified Yearly', billing: 'Yearly', price: 2999, features: 'Verified badge, 2 months free, top category ranking', subscribers: 89, status: 'active' },
    { id: '3', title: 'Creator Pro Monthly', billing: 'Monthly', price: 199, features: 'Marketplace priority, portfolio badge, direct vendor chat', subscribers: 64, status: 'active' },
  ];

  const handleSavePlan = () => {
    if (!planForm.title || !planForm.price) return toast.error('Title and price are required');
    toast.success('Subscription plan saved successfully!');
    setShowPlanModal(false);
    setPlanForm({ title: '', billing: 'monthly', price: 299, features: '' });
  };

  const columns = [
    {
      key: 'title',
      label: 'Plan Title',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val}</span>
          <span className="text-[10px] text-text-tertiary">{row.features}</span>
        </div>
      ),
    },
    {
      key: 'billing',
      label: 'Billing Cycle',
      render: (val) => <span className="font-bold text-xs uppercase text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded">{val}</span>,
    },
    {
      key: 'price',
      label: 'Price',
      render: (val) => <span className="font-bold text-emerald-600">₹{val}</span>,
    },
    {
      key: 'subscribers',
      label: 'Active Subscribers',
      render: (val) => <span className="font-bold text-text-primary">{val} users</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Subscription Management"
        subtitle="Manage vendor and creator subscription tiers, discount coupons, invoices, and subscription revenue"
      >
        <button
          onClick={() => setShowPlanModal(true)}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Create Plan
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'plans' ? (
        <AdminDataTable
          columns={columns}
          data={mockPlans}
          emptyMessage="No subscription plans configured."
          testId="subscriptions-table"
          actions={(row) => (
            <button
              onClick={() => { setPlanForm(row); setShowPlanModal(true); }}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="Edit Plan"
            >
              <FiEdit className="w-3.5 h-3.5" />
            </button>
          )}
        />
      ) : (
        <div className="glass p-8 rounded-2xl border border-white/50 text-center space-y-4">
          <FiDollarSign className="w-12 h-12 text-brand-purple mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-text-primary font-display">Subscription Revenue Metrics</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-4">
            <div className="bg-surface-secondary p-4 rounded-xl">
              <span className="text-[10px] text-text-tertiary font-bold uppercase block">Total Subscribers</span>
              <span className="text-xl font-black text-brand-purple font-display">295 Users</span>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <span className="text-[10px] text-text-tertiary font-bold uppercase block">Monthly Recurring (MRR)</span>
              <span className="text-xl font-black text-emerald-600 font-display">₹88,205</span>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <span className="text-[10px] text-text-tertiary font-bold uppercase block">Annual Recurring (ARR)</span>
              <span className="text-xl font-black text-brand-orange font-display">₹10.58L</span>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      <AdminModal isOpen={showPlanModal} onClose={() => setShowPlanModal(false)} title="Configure Subscription Plan">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Plan Title</label>
            <input
              type="text"
              placeholder="e.g. Vendor Verified Monthly"
              value={planForm.title}
              onChange={(e) => setPlanForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Billing Cycle</label>
              <select
                value={planForm.billing}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, billing: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Price (INR)</label>
              <input
                type="number"
                value={planForm.price}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Included Features Summary</label>
            <input
              type="text"
              placeholder="e.g. Verified badge, priority search placement"
              value={planForm.features}
              onChange={(e) => setPlanForm((prev) => ({ ...prev, features: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <button
            onClick={handleSavePlan}
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all"
          >
            Save Subscription Plan
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
