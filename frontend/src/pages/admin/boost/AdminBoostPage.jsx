import React, { useState } from 'react';
import { FiZap, FiPlus, FiEdit, FiDollarSign, FiBarChart2, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListBoostPlansQuery,
  useCreateBoostPlanMutation,
  useUpdateBoostPlanMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'plans', label: 'Boost Plans', icon: FiZap },
  { key: 'reports', label: 'Boost Reports & Analytics', icon: FiBarChart2 },
];

export default function AdminBoostPage() {
  const [activeTab, setActiveTab] = useState('plans');
  const [showModal, setShowModal] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', duration_days: 7, price_inr: 499, credits_cost: 50 });

  const { data, isFetching } = useListBoostPlansQuery(undefined, { pollingInterval: 5000 });
  const [createPlan] = useCreateBoostPlanMutation();
  const [updatePlan] = useUpdateBoostPlanMutation();

  const plans = data?.items || [
    { id: '1', name: '7-Day Starter Boost', description: '2x visibility on feed & search', duration_days: 7, price_inr: 499, credits_cost: 50, is_active: true },
    { id: '2', name: '15-Day Growth Boost', description: '3x visibility + sponsored badge', duration_days: 15, price_inr: 999, credits_cost: 100, is_active: true },
    { id: '3', name: '30-Day Premium Boost', description: '5x max reach + top category banner', duration_days: 30, price_inr: 1899, credits_cost: 200, is_active: true },
  ];

  const handleOpenCreate = () => {
    setEditPlan(null);
    setForm({ name: '', description: '', duration_days: 7, price_inr: 499, credits_cost: 50 });
    setShowModal(true);
  };

  const handleOpenEdit = (plan) => {
    setEditPlan(plan.id);
    setForm({ name: plan.name, description: plan.description || '', duration_days: plan.duration_days, price_inr: plan.price_inr, credits_cost: plan.credits_cost });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price_inr) return toast.error('Name and price are required');
    try {
      if (editPlan) {
        await updatePlan({ id: editPlan, ...form }).unwrap();
        toast.success('Boost plan updated!');
      } else {
        await createPlan(form).unwrap();
        toast.success('Boost plan created!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Plan Name',
      render: (val, row) => (
        <div>
          <span className="font-bold text-text-primary block">{val}</span>
          <span className="text-[10px] text-text-tertiary">{row.description || 'Standard boost plan'}</span>
        </div>
      ),
    },
    {
      key: 'duration_days',
      label: 'Duration',
      render: (val) => <span className="font-bold text-brand-purple">{val} Days</span>,
    },
    {
      key: 'price_inr',
      label: 'Price (INR)',
      render: (val) => <span className="font-bold text-emerald-600">₹{(val || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'credits_cost',
      label: 'Wallet Credits',
      render: (val) => <span className="font-bold text-amber-500">{val || 0} credits</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val !== false ? 'Active' : 'Inactive'} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiZap}
        title="Advertisement & Boost Management"
        subtitle="Configure boost packages, set pricing, view boost revenue and reports"
      >
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Create Boost Plan
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'plans' ? (
        <AdminDataTable
          columns={columns}
          data={plans}
          loading={isFetching}
          emptyMessage="No boost plans created yet."
          testId="boost-plans-table"
          actions={(row) => (
            <button
              onClick={() => handleOpenEdit(row)}
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
          <h3 className="text-lg font-bold text-text-primary font-display">Boost Revenue Summary</h3>
          <p className="text-xs text-text-tertiary max-w-md mx-auto">
            Track active sponsored listing campaigns, total revenue generated from reel boosts, and conversion metrics.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-4">
            <div className="bg-surface-secondary p-4 rounded-xl">
              <span className="text-[10px] text-text-tertiary font-bold uppercase block">Active Campaigns</span>
              <span className="text-xl font-black text-brand-purple font-display">24</span>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <span className="text-[10px] text-text-tertiary font-bold uppercase block">Total Boost Revenue</span>
              <span className="text-xl font-black text-emerald-600 font-display">₹48,500</span>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl">
              <span className="text-[10px] text-text-tertiary font-bold uppercase block">Avg Reach Boost</span>
              <span className="text-xl font-black text-brand-orange font-display">3.4x</span>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AdminModal isOpen={showModal} onClose={() => setShowModal(false)} title={editPlan ? 'Edit Boost Plan' : 'Create Boost Plan'}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Plan Title</label>
            <input
              type="text"
              placeholder="e.g. 7-Day Starter Boost"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. 2x visibility boost across platform"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Duration (Days)</label>
              <input
                type="number"
                value={form.duration_days}
                onChange={(e) => setForm((prev) => ({ ...prev, duration_days: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Price (INR)</label>
              <input
                type="number"
                value={form.price_inr}
                onChange={(e) => setForm((prev) => ({ ...prev, price_inr: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Credits Cost</label>
              <input
                type="number"
                value={form.credits_cost}
                onChange={(e) => setForm((prev) => ({ ...prev, credits_cost: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all"
          >
            {editPlan ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
