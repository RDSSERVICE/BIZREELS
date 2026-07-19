import React, { useState } from 'react';
import { FiCreditCard, FiPlus, FiEdit, FiGift, FiFileText, FiDollarSign, FiTrash2, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListSubscriptionPlansQuery,
  useCreateSubscriptionPlanMutation,
  useUpdateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useListCouponsQuery,
  useGetFinancialReportQuery,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'plans', label: 'Subscription Plans', icon: FiCreditCard },
  { key: 'coupons', label: 'Discount Coupons', icon: FiGift },
  { key: 'invoices', label: 'Invoices', icon: FiFileText },
  { key: 'revenue', label: 'Revenue Summary', icon: FiDollarSign },
];

const DEFAULT_FORM = { title: '', billing_cycle: 'monthly', price_inr: 299, features: '', target_role: 'vendor', verified_badge: true, is_active: true };

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [search, setSearch] = useState('');
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [planForm, setPlanForm] = useState({ ...DEFAULT_FORM });

  const { data: plansData, isFetching: plansLoading } = useListSubscriptionPlansQuery(undefined, { pollingInterval: 5000 });
  const { data: couponsData, isFetching: couponsLoading } = useListCouponsQuery(undefined, { pollingInterval: 5000 });
  const { data: reportData } = useGetFinancialReportQuery({ report_type: 'subscription' }, { pollingInterval: 10000 });

  const [createPlan] = useCreateSubscriptionPlanMutation();
  const [updatePlan] = useUpdateSubscriptionPlanMutation();
  const [deletePlan] = useDeleteSubscriptionPlanMutation();

  const plans = plansData?.items || [];
  const coupons = (couponsData?.items || []).filter(c => c.applicable_to === 'subscription' || c.applicable_to === 'all');
  const summary = reportData?.summary || {};

  const fmtCurrency = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  const handleSavePlan = async () => {
    if (!planForm.title || !planForm.price_inr) return toast.error('Title and price are required');
    try {
      if (editId) {
        await updatePlan({ id: editId, ...planForm }).unwrap();
        toast.success('Plan updated successfully!');
      } else {
        await createPlan(planForm).unwrap();
        toast.success('Plan created successfully!');
      }
      setShowPlanModal(false);
      setPlanForm({ ...DEFAULT_FORM });
      setEditId(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (id, title) => {
    if (!window.confirm(`Delete plan "${title}"?`)) return;
    try {
      await deletePlan(id).unwrap();
      toast.success('Plan deleted!');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  const handleEdit = (plan) => {
    setEditId(plan.id);
    setPlanForm({
      title: plan.title,
      billing_cycle: plan.billing_cycle,
      price_inr: plan.price_inr,
      features: plan.features,
      target_role: plan.target_role || 'vendor',
      verified_badge: plan.verified_badge !== false,
      is_active: plan.is_active !== false,
    });
    setShowPlanModal(true);
  };

  const planColumns = [
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
      key: 'target_role',
      label: 'For',
      render: (val) => <span className="font-bold text-xs capitalize text-brand-pink bg-brand-pink/10 px-2 py-0.5 rounded">{val || 'vendor'}</span>,
    },
    {
      key: 'billing_cycle',
      label: 'Billing',
      render: (val) => <span className="font-bold text-xs uppercase text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded">{val}</span>,
    },
    {
      key: 'price_inr',
      label: 'Price',
      render: (val) => <span className="font-bold text-emerald-600">₹{val}</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val !== false ? 'active' : 'inactive'} />,
    },
  ];

  const couponColumns = [
    { key: 'code', label: 'Coupon Code', render: (val) => <span className="font-bold font-mono text-brand-purple">{val}</span> },
    { key: 'type', label: 'Type', render: (val) => <span className="capitalize text-xs font-bold">{val}</span> },
    { key: 'value', label: 'Value', render: (val, row) => <span className="font-bold text-emerald-600">{row.type === 'percentage' ? `${val}%` : `₹${val}`}</span> },
    { key: 'used_count', label: 'Used', render: (val) => <span className="font-bold">{val || 0}x</span> },
    { key: 'is_active', label: 'Status', render: (val) => <AdminStatusBadge status={val ? 'active' : 'inactive'} /> },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Subscription Management"
        subtitle="Manage vendor and creator subscription tiers, discount coupons, invoices, and subscription revenue"
      >
        <button
          onClick={() => { setEditId(null); setPlanForm({ ...DEFAULT_FORM }); setShowPlanModal(true); }}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Create Plan
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'plans' && (
        <AdminDataTable
          columns={planColumns}
          data={plans}
          loading={plansLoading}
          searchPlaceholder="Search plans..."
          searchValue={search}
          onSearch={setSearch}
          emptyMessage="No subscription plans configured. Click 'Create Plan' to add one."
          testId="subscriptions-table"
          actions={(row) => (
            <>
              <button
                onClick={() => handleEdit(row)}
                className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
                title="Edit Plan"
              >
                <FiEdit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeletePlan(row.id, row.title)}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
                title="Delete Plan"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        />
      )}

      {activeTab === 'coupons' && (
        <AdminDataTable
          columns={couponColumns}
          data={coupons}
          loading={couponsLoading}
          emptyMessage="No subscription coupons found."
          testId="sub-coupons-table"
        />
      )}

      {activeTab === 'invoices' && (
        <div className="glass rounded-2xl p-8 border border-white/50 text-center space-y-4">
          <FiFileText className="w-12 h-12 text-brand-purple mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-text-primary font-display">Subscription Invoices</h3>
          <p className="text-xs text-text-tertiary max-w-md mx-auto">
            Invoices are automatically generated when vendors or creators subscribe. 
            View and download invoices from the Financial Reports section.
          </p>
          <div className="bg-surface-secondary p-4 rounded-xl max-w-xs mx-auto">
            <span className="text-[10px] text-text-tertiary font-bold uppercase block">Active Subscriptions</span>
            <span className="text-xl font-black text-brand-purple font-display">{summary.subscribed_vendors || 0} users</span>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass p-5 rounded-2xl border border-white/50">
              <span className="text-[10px] font-bold text-text-tertiary uppercase block">Total Subscribers</span>
              <span className="text-2xl font-black text-brand-purple mt-1 font-display block">{summary.subscribed_vendors || 0}</span>
              <span className="text-[10px] text-text-tertiary">verified vendors</span>
            </div>
            <div className="glass p-5 rounded-2xl border border-white/50">
              <span className="text-[10px] font-bold text-text-tertiary uppercase block">Gross Revenue</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 font-display block">{fmtCurrency(summary.gross_revenue_paise)}</span>
              <span className="text-[10px] text-text-tertiary">{summary.total_transactions || 0} transactions</span>
            </div>
            <div className="glass p-5 rounded-2xl border border-white/50">
              <span className="text-[10px] font-bold text-text-tertiary uppercase block">Net Revenue (Post GST)</span>
              <span className="text-2xl font-black text-brand-orange mt-1 font-display block">{fmtCurrency(summary.net_revenue_paise)}</span>
              <span className="text-[10px] text-text-tertiary">after 18% GST</span>
            </div>
          </div>
        </div>
      )}

      {/* Plan Modal */}
      <AdminModal isOpen={showPlanModal} onClose={() => { setShowPlanModal(false); setEditId(null); }} title={editId ? 'Edit Subscription Plan' : 'Create Subscription Plan'}>
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
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Target Role</label>
              <select
                value={planForm.target_role}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, target_role: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              >
                <option value="vendor">Vendor</option>
                <option value="creator">Creator</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Billing Cycle</label>
              <select
                value={planForm.billing_cycle}
                onChange={(e) => setPlanForm((prev) => ({ ...prev, billing_cycle: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Price (INR)</label>
            <input
              type="number"
              value={planForm.price_inr}
              onChange={(e) => setPlanForm((prev) => ({ ...prev, price_inr: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Included Features</label>
            <input
              type="text"
              placeholder="e.g. Verified badge, priority search placement"
              value={planForm.features}
              onChange={(e) => setPlanForm((prev) => ({ ...prev, features: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer">
              <input type="checkbox" checked={planForm.verified_badge} onChange={(e) => setPlanForm(prev => ({ ...prev, verified_badge: e.target.checked }))} className="rounded text-brand-purple" />
              Verified Badge
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-text-secondary cursor-pointer">
              <input type="checkbox" checked={planForm.is_active} onChange={(e) => setPlanForm(prev => ({ ...prev, is_active: e.target.checked }))} className="rounded text-brand-purple" />
              Active
            </label>
          </div>
          <button
            onClick={handleSavePlan}
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1"
          >
            <FiCheck className="w-4 h-4" /> {editId ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
