import React, { useState } from 'react';
import { FiTrash2, FiToggleLeft, FiToggleRight, FiPlus, FiPercent, FiDollarSign } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
  useListCouponsQuery,
  useCreateCouponMutation,
  useDeleteCouponMutation,
  useToggleCouponMutation,
} from '../../../../features/admin/adminApi';
import AdminStatusBadge from '../../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../../features/admin/components/AdminModal';

export default function CouponManagement() {
  const { data, isFetching } = useListCouponsQuery();
  const [createCoupon, { isLoading: creating }] = useCreateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();
  const [toggleCoupon] = useToggleCouponMutation();

  const coupons = data?.items || [];
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    max_discount_amount: '',
    min_purchase_amount: '',
    usage_limit: '',
    applicable_to: 'subscription',
    user_type_restriction: 'all',
    valid_until: '',
    description: '',
  });

  const handleToggle = async (c) => {
    try {
      await toggleCoupon(c.id).unwrap();
      toast.success(`Coupon status updated`);
    } catch (err) {
      toast.error('Toggle action failed');
    }
  };

  const handleDelete = async (c) => {
    if (!window.confirm(`Delete coupon code ${c.code}?`)) return;
    try {
      await deleteCoupon(c.id).unwrap();
      toast.success('Coupon deleted');
    } catch (err) {
      toast.error('Deletion failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.code) return toast.error('Coupon code is required');
    if (!form.value || parseFloat(form.value) <= 0) return toast.error('Please enter a valid discount value');

    const body = {
      ...form,
      code: form.code.toUpperCase().replace(/\s+/g, ''),
      value: parseFloat(form.value),
      max_discount_amount: form.max_discount_amount ? parseFloat(form.max_discount_amount) : null,
      min_purchase_amount: form.min_purchase_amount ? parseFloat(form.min_purchase_amount) : 0,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      valid_until: form.valid_until || null,
    };

    try {
      await createCoupon(body).unwrap();
      toast.success('New Coupon Created Successfully!');
      setShowAddModal(false);
      setForm({
        code: '',
        type: 'percentage',
        value: '',
        max_discount_amount: '',
        min_purchase_amount: '',
        usage_limit: '',
        applicable_to: 'subscription',
        user_type_restriction: 'all',
        valid_until: '',
        description: '',
      });
    } catch (err) {
      toast.error(err?.data?.message || 'Creation failed');
    }
  };

  return (
    <div className="space-y-4 font-sans">
      <div className="flex justify-between items-center">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">Coupon Codes & Campaigns ({coupons.length})</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#1a1a1a] text-white hover:bg-black rounded-xl text-xs font-black shadow-xs transition-all cursor-pointer border-none"
        >
          + Create Coupon
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#e3dccb] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#e3dccb] bg-[#f8f4ec] text-[10px] font-black text-slate-400 uppercase tracking-wider">
                <th className="text-left px-4 py-3">Coupon Code</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-right px-4 py-3">Discount Value</th>
                <th className="text-left px-4 py-3">Applicable To</th>
                <th className="text-left px-4 py-3">Usage Stats</th>
                <th className="text-left px-4 py-3">Expiry</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e3dccb]/50">
              {isFetching && coupons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400 font-bold animate-pulse">Loading coupons...</td></tr>
              ) : coupons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-400 font-bold">No coupons found.</td></tr>
              ) : coupons.map((c) => (
                <tr key={c.id} className="hover:bg-[#fbf9f4] transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-mono font-black text-[#1a1a1a] text-xs block">{c.code}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{c.description || 'No description'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize font-bold text-slate-600">{c.type}</td>
                  <td className="px-4 py-3 text-right font-black text-[#1a1a1a]">
                    {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    <span className="bg-[#f8f4ec] border border-[#e3dccb] px-2 py-0.5 rounded-md text-[10px] font-black text-[#1a1a1a]">
                      {c.applicable_to}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className="font-black text-[#1a1a1a]">{c.used_count || 0}</span>
                      <span className="text-slate-400 font-medium"> / {c.usage_limit || '∞'} uses</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-medium">
                    {c.valid_until ? new Date(c.valid_until).toLocaleDateString('en-IN') : 'Never Expires'}
                  </td>
                  <td className="px-4 py-3"><AdminStatusBadge status={c.is_active ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center items-center gap-1.5">
                      <button
                        onClick={() => handleToggle(c)}
                        className={`p-1.5 rounded-lg border border-[#e3dccb] bg-[#f8f4ec] hover:bg-white transition-colors cursor-pointer ${c.is_active ? 'text-emerald-600' : 'text-slate-400'}`}
                        title={c.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {c.is_active ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Coupon Modal */}
      <AdminModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Coupon">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Coupon Code *</label>
              <input
                type="text"
                placeholder="e.g. WELCOME50"
                value={form.code}
                onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] uppercase font-mono font-bold text-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Discount Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="flat">Flat Amount (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Discount Value *</label>
              <input
                type="number"
                placeholder="50"
                value={form.value}
                onChange={(e) => setForm(p => ({ ...p, value: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Max Discount (₹)</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={form.max_discount_amount}
                onChange={(e) => setForm(p => ({ ...p, max_discount_amount: e.target.value }))}
                disabled={form.type === 'flat'}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none disabled:opacity-50 font-bold text-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Min Purchase (₹)</label>
              <input
                type="number"
                placeholder="e.g. 1000"
                value={form.min_purchase_amount}
                onChange={(e) => setForm(p => ({ ...p, min_purchase_amount: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Applicable To</label>
              <select
                value={form.applicable_to}
                onChange={(e) => setForm(p => ({ ...p, applicable_to: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              >
                <option value="subscription">Subscriptions</option>
                <option value="boost">Listing Boosts</option>
                <option value="order">Marketplace Orders</option>
                <option value="all">All Transactions</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">User Limitation</label>
              <select
                value={form.user_type_restriction}
                onChange={(e) => setForm(p => ({ ...p, user_type_restriction: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              >
                <option value="all">All Roles</option>
                <option value="vendor">Vendors Only</option>
                <option value="creator">Creators Only</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Usage Limit</label>
              <input
                type="number"
                placeholder="e.g. 100 uses"
                value={form.usage_limit}
                onChange={(e) => setForm(p => ({ ...p, usage_limit: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Valid Until</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) => setForm(p => ({ ...p, valid_until: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              />
            </div>
            <div>
              <label className="block mb-1 text-slate-400 uppercase font-black tracking-wider text-[10px]">Description</label>
              <input
                type="text"
                placeholder="50% Off subscription"
                value={form.description}
                onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl focus:outline-none focus:border-[#1a1a1a] font-bold text-[#1a1a1a]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 bg-[#1a1a1a] text-[#d99a3d] hover:bg-black font-black rounded-xl shadow-xs transition-all disabled:opacity-50 mt-2 cursor-pointer border-none"
          >
            {creating ? 'Creating Campaign...' : 'Activate Coupon'}
          </button>
        </form>
      </AdminModal>
    </div>
  );
}
