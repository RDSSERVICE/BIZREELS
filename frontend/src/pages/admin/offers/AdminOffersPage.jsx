import React, { useState } from 'react';
import { FiGift, FiPlus, FiTag, FiRefreshCcw, FiUsers, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListCouponsQuery,
  useCreateCouponMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'coupons', label: 'Discount Coupons', icon: FiTag },
  { key: 'festival', label: 'Festival Offers', icon: FiGift },
  { key: 'referral', label: 'Referral Bonus Settings', icon: FiUsers },
  { key: 'cashback', label: 'Wallet Cashback Rules', icon: FiRefreshCcw },
];

export default function AdminOffersPage() {
  const [activeTab, setActiveTab] = useState('coupons');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ code: '', type: 'percentage', value: 20, min_order_inr: 500 });

  const { data, isFetching } = useListCouponsQuery(undefined, { pollingInterval: 5000 });
  const [createCoupon] = useCreateCouponMutation();

  const coupons = data?.items || [
    { id: '1', code: 'BIZBIZ20', type: 'percentage', value: 20, min_order_inr: 499, used_count: 84, is_active: true },
    { id: '2', code: 'FESTIVAL500', type: 'flat', value: 500, min_order_inr: 2499, used_count: 32, is_active: true },
    { id: '3', code: 'CASHBACK50', type: 'cashback', value: 50, min_order_inr: 299, used_count: 120, is_active: true },
  ];

  const handleCreateCoupon = async () => {
    if (!form.code || !form.value) return toast.error('Code and discount value required');
    try {
      await createCoupon(form).unwrap();
      toast.success('Coupon created successfully!');
      setShowModal(false);
      setForm({ code: '', type: 'percentage', value: 20, min_order_inr: 500 });
    } catch (err) {
      toast.error(err?.data?.message || 'Create coupon failed');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Coupon Code',
      render: (val) => <span className="font-bold text-xs font-mono uppercase bg-brand-purple/10 text-brand-purple px-2 py-1 rounded border border-brand-purple/20">{val}</span>,
    },
    {
      key: 'type',
      label: 'Discount Type',
      render: (val) => <span className="capitalize font-bold text-xs text-text-secondary">{val}</span>,
    },
    {
      key: 'value',
      label: 'Discount Value',
      render: (val, row) => (
        <span className="font-bold text-emerald-600">
          {row.type === 'percentage' ? `${val}% OFF` : `₹${val} OFF`}
        </span>
      ),
    },
    {
      key: 'used_count',
      label: 'Times Used',
      render: (val) => <span className="font-bold text-text-primary">{val || 0} times</span>,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val !== false ? 'Active' : 'Expired'} />,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiGift}
        title="Offers, Coupons & Cashback"
        subtitle="Manage discount promo codes, festival campaigns, referral reward bonuses, and wallet cashbacks"
      >
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-premium"
        >
          <FiPlus className="w-4 h-4" /> Create Promo Coupon
        </button>
      </AdminPageHeader>

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'coupons' && (
        <AdminDataTable
          columns={columns}
          data={coupons}
          loading={isFetching}
          searchPlaceholder="Search coupon code..."
          searchValue={search}
          onSearch={setSearch}
          emptyMessage="No promo coupons created."
          testId="coupons-table"
        />
      )}

      {activeTab === 'referral' && (
        <div className="glass p-6 rounded-2xl border border-white/50 max-w-xl space-y-4">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
            <FiUsers className="text-brand-purple" /> Referral Bonus Configuration
          </h3>
          <div className="bg-surface-secondary p-4 rounded-xl space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Referrer Reward (Wallet Credits)</label>
              <input type="number" defaultValue={50} className="w-full px-3 py-2 bg-surface border border-border rounded-xl font-bold" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Referred User Welcome Bonus (Wallet Credits)</label>
              <input type="number" defaultValue={25} className="w-full px-3 py-2 bg-surface border border-border rounded-xl font-bold" />
            </div>
            <button onClick={() => toast.success('Referral settings updated')} className="w-full py-2 bg-brand-purple text-white font-bold rounded-xl">
              Save Referral Rules
            </button>
          </div>
        </div>
      )}

      {/* Create Coupon Modal */}
      <AdminModal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Discount Coupon">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Coupon Code</label>
            <input
              type="text"
              placeholder="e.g. SUMMER2026"
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
                <option value="cashback">Wallet Cashback</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Discount Value</label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm((prev) => ({ ...prev, value: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <button
            onClick={handleCreateCoupon}
            className="w-full py-2.5 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1"
          >
            <FiPlus /> Create Coupon
          </button>
        </div>
      </AdminModal>
    </div>
  );
}
