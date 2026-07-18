import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FiSettings, FiSliders, FiClock, FiBell, FiLock, FiTrash2, FiLogOut, FiSave } from 'react-icons/fi';
import { logout } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function VendorSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('Smartphones & Audio');

  // Shop Close Schedule Marker
  const [isTemporaryClosed, setIsTemporaryClosed] = useState(false);
  const [closeScheduleReason, setCloseScheduleReason] = useState('Renovation / Vacation');

  const [notifyNewLeads, setNotifyNewLeads] = useState(true);
  const [notifyOrders, setNotifyOrders] = useState(true);

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiSettings className="text-pink-400" />
            <span>Vendor Settings & Shop Close Schedule</span>
          </h2>
          <p className="text-xs text-slate-400">Configure business categories, subcategories, close schedule markers, and privacy</p>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Category & Subcategory */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FiSliders className="text-indigo-400" />
            <span>Business Category & Sub-category</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              >
                <option value="Electronics">Electronics & IT</option>
                <option value="Fashion">Fashion & Apparel</option>
                <option value="Furniture">Furniture & Decor</option>
                <option value="Services">Services & Repairs</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Sub-category</label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. Laptops & Accessories"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          </div>
        </div>

        {/* Shop / Service Close Marker Schedule */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
            <FiClock className="text-rose-400" />
            <span>Shop / Service Close Marker Schedule</span>
          </h3>

          <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
            <div>
              <h4 className="font-bold text-xs text-white">Temporary Close Shop Status</h4>
              <p className="text-[11px] text-slate-400">When enabled, your shop will show a "TEMPORARY CLOSED" badge on customer feed</p>
            </div>
            <button
              type="button"
              onClick={() => setIsTemporaryClosed(!isTemporaryClosed)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                isTemporaryClosed ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isTemporaryClosed ? 'MARKER: CLOSED' : 'MARKER: OPEN'}
            </button>
          </div>

          {isTemporaryClosed && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Close Schedule Reason / Reopening Note</label>
              <input
                type="text"
                value={closeScheduleReason}
                onChange={(e) => setCloseScheduleReason(e.target.value)}
                placeholder="e.g. Closed for holiday until Monday 10 AM"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
        >
          <FiSave size={16} />
          <span>Save Business Settings</span>
        </button>
      </form>

      {/* Delete Shop & Logout */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => { dispatch(logout()); navigate('/auth/login'); }}
          className="flex-1 py-3 bg-slate-800 text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2"
        >
          <FiLogOut size={16} />
          <span>Logout Vendor</span>
        </button>

        <button
          onClick={handleDeleteShop}
          className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs rounded-2xl flex items-center justify-center gap-2"
        >
          <FiTrash2 size={16} />
          <span>Delete Shop</span>
        </button>
      </div>
    </div>
  );
}
