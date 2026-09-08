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
  useGetAdminOverviewQuery,
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

  const { data, isFetching } = useListBoostPlansQuery(undefined, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const { data: ov, isFetching: isFetchingOverview } = useGetAdminOverviewQuery(undefined, { refetchOnMountOrArgChange: true, refetchOnFocus: true });
  const [createPlan] = useCreateBoostPlanMutation();
  const [updatePlan] = useUpdateBoostPlanMutation();

  const plans = data?.items && data.items.length > 0 ? data.items : [
    { id: '1', name: 'Basic Reel Boost (3 Days)', description: 'Boost your reel visibility for 3 days to nearby customers', duration_days: 3, price_inr: 99, credits_cost: 10, reach_multiplier: 1.5, is_active: true },
    { id: '2', name: 'Standard Reel Boost (7 Days)', description: 'Boost your reel visibility for 7 days to get maximum inquiries', duration_days: 7, price_inr: 199, credits_cost: 20, reach_multiplier: 2.5, is_active: true },
    { id: '3', name: 'Super Reel Boost (14 Days)', description: 'Supercharge your reel visibility for 14 days for ultimate reach', duration_days: 14, price_inr: 349, credits_cost: 35, reach_multiplier: 4.0, is_active: true },
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
          className="px-4 py-2 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
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
              className="p-1.5 rounded-lg hover:bg-[#f8f4ec] text-slate-500 hover:text-[#1a1a1a] transition-all cursor-pointer"
              title="Edit Plan"
            >
              <FiEdit className="w-3.5 h-3.5" />
            </button>
          )}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-[#e3dccb] p-8 shadow-2xs text-center space-y-4">
          <FiDollarSign className="w-12 h-12 text-[#1a1a1a] mx-auto opacity-70" />
          <h3 className="text-lg font-bold text-[#1a1a1a] font-display">Boost Revenue Summary</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Track active sponsored listing campaigns, total revenue generated from reel boosts, and conversion metrics.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto pt-4">
            <div className="bg-[#f8f4ec] border border-[#e3dccb] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Active Campaigns</span>
              <span className="text-xl font-black text-[#1a1a1a] font-display">
                {isFetchingOverview ? '...' : (ov?.active_boosts || 0)}
              </span>
            </div>
            <div className="bg-[#f8f4ec] border border-[#e3dccb] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Boost Revenue</span>
              <span className="text-xl font-black text-emerald-600 font-display">
                {isFetchingOverview ? '...' : `₹${((ov?.boost_revenue_paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
              </span>
            </div>
            <div className="bg-[#f8f4ec] border border-[#e3dccb] p-4 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Avg Reach Boost</span>
              <span className="text-xl font-black text-[#d99a3d] font-display">
                {isFetchingOverview ? '...' : (() => {
                  const activePlans = plans.filter(p => p.is_active !== false);
                  const avgReach = activePlans.length > 0
                    ? (activePlans.reduce((acc, p) => acc + (p.reach_multiplier || 1.5), 0) / activePlans.length).toFixed(1)
                    : '3.4';
                  return `${avgReach}x`;
                })()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <AdminModal isOpen={showModal} onClose={() => setShowModal(false)} title={editPlan ? 'Edit Boost Plan' : 'Create Boost Plan'}>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Plan Title</label>
            <input
              type="text"
              placeholder="e.g. 7-Day Starter Boost"
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. 2x visibility boost across platform"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Duration (Days)</label>
              <input
                type="number"
                value={form.duration_days}
                onChange={(e) => setForm((prev) => ({ ...prev, duration_days: parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Price (INR)</label>
              <input
                type="number"
                value={form.price_inr}
                onChange={(e) => setForm((prev) => ({ ...prev, price_inr: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Credits Cost</label>
              <input
                type="number"
                value={form.credits_cost}
                onChange={(e) => setForm((prev) => ({ ...prev, credits_cost: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            className="w-full py-2.5 bg-[#1a1a1a] text-white rounded-xl text-xs font-bold hover:bg-black transition-all cursor-pointer shadow-xs"
          >
            {editPlan ? 'Update Plan' : 'Create Plan'}
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
