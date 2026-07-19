import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiSettings, FiSliders, FiClock, FiTrash2, FiLogOut, FiSave } from 'react-icons/fi';
import { logout } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function VendorSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('Smartphones & Audio');

  // Shop Close Schedule Marker
  const [isTemporaryClosed, setIsTemporaryClosed] = useState(false);
  const [closeScheduleReason, setCloseScheduleReason] = useState('Renovation / Vacation');

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success('Vendor Business Settings & Close Schedule updated!');
  };

  const handleDeleteShop = () => {
    if (window.confirm('Are you sure you want to permanently delete your shop listing and vendor account?')) {
      toast.success('Shop deletion request submitted');
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiSettings}
        title="Vendor Settings & Shop Close Schedule"
        subtitle="Configure business categories, subcategories, close schedule markers, and privacy"
      />

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Category & Subcategory */}
        <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
            <FiSliders className="text-brand-purple" />
            <span>Business Category & Sub-category</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Primary Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="Electronics">Electronics & IT</option>
                <option value="Fashion">Fashion & Apparel</option>
                <option value="Furniture">Furniture & Decor</option>
                <option value="Services">Services & Repairs</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Sub-category</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Laptops & Accessories"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>
        </div>

        {/* Shop Marker */}
        <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
            <FiClock className="text-error" />
            <span>Shop / Service Close Marker Schedule</span>
          </h3>

          <div className="flex items-center justify-between p-4 glass rounded-xl border border-border">
            <div>
              <h4 className="font-bold text-xs text-text-primary">Temporary Close Shop Status</h4>
              <p className="text-[11px] text-text-tertiary">When enabled, your shop will show a "TEMPORARY CLOSED" badge on customer feed</p>
            </div>
            <button
              type="button"
              onClick={() => setIsTemporaryClosed(!isTemporaryClosed)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                isTemporaryClosed ? 'bg-error text-white' : 'bg-surface-tertiary text-text-tertiary'
              }`}
            >
              {isTemporaryClosed ? 'MARKER: CLOSED' : 'MARKER: OPEN'}
            </button>
          </div>

          {isTemporaryClosed && (
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Close Schedule Reason / Reopening Note</label>
              <input
                type="text"
                value={closeScheduleReason}
                onChange={(e) => setCloseScheduleReason(e.target.value)}
                placeholder="e.g. Closed for holiday until Monday 10 AM"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <FiSave size={16} /> Save Business Settings
        </button>
      </form>

      {/* Delete Shop & Logout */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => { dispatch(logout()); navigate('/auth/login'); }}
          className="flex-1 py-2.5 glass border border-border text-text-secondary font-bold text-xs rounded-xl hover:bg-surface-tertiary transition flex items-center justify-center gap-2"
        >
          <FiLogOut size={16} /> Logout Vendor
        </button>

        <button
          onClick={handleDeleteShop}
          className="flex-1 py-2.5 bg-error/10 text-error border border-error/20 font-bold text-xs rounded-xl hover:bg-error/20 transition flex items-center justify-center gap-2"
        >
          <FiTrash2 size={16} /> Delete Shop
        </button>
      </div>
    </div>
  );
}
