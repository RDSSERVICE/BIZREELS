import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSettings, FiSliders, FiClock, FiTrash2, FiLogOut, FiSave,
  FiBriefcase, FiMapPin, FiMessageSquare, FiBell, FiCheckCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { selectCurrentUser, setCredentials, logout } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';

export default function VendorSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const vendorProfile = currentUser?.vendorProfile || {};

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form State
  const [businessName, setBusinessName] = useState(vendorProfile.businessName || currentUser?.name || '');
  const [category, setCategory] = useState(vendorProfile.category || 'Electronics');
  const [subcategory, setSubcategory] = useState(vendorProfile.subcategory || 'Smartphones & Audio');
  const [address, setAddress] = useState(vendorProfile.address || currentUser?.location?.address || '');

  // Shop Close Schedule Marker
  const [isTemporaryClosed, setIsTemporaryClosed] = useState(!!vendorProfile.isTemporaryClosed);
  const [closeScheduleReason, setCloseScheduleReason] = useState(vendorProfile.closeScheduleReason || 'Renovation / Vacation');
  const [autoResponseNote, setAutoResponseNote] = useState(vendorProfile.autoResponseNote || 'We are currently offline. We will reply to your inquiry shortly!');
  const [notificationsEnabled, setNotificationsEnabled] = useState(vendorProfile.notificationsEnabled !== false);

  // Fetch live settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/v1/vendors/me/settings');
        if (res.data?.success || res.success) {
          const s = res.data?.data || res.data || res;
          if (s.businessName) setBusinessName(s.businessName);
          if (s.category) setCategory(s.category);
          if (s.subcategory) setSubcategory(s.subcategory);
          if (s.address) setAddress(s.address);
          if (s.isTemporaryClosed !== undefined) setIsTemporaryClosed(s.isTemporaryClosed);
          if (s.closeScheduleReason) setCloseScheduleReason(s.closeScheduleReason);
          if (s.autoResponseNote) setAutoResponseNote(s.autoResponseNote);
          if (s.notificationsEnabled !== undefined) setNotificationsEnabled(s.notificationsEnabled);
        }
      } catch (err) {
        // Fallback to redux profile
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading('Saving Business Settings & Close Schedule...');

    try {
      const res = await api.post('/v1/vendors/me/settings', {
        businessName,
        category,
        subcategory,
        address,
        isTemporaryClosed,
        closeScheduleReason,
        autoResponseNote,
        notificationsEnabled,
      });

      const updatedUser = res.data?.user || res.user;

      // Update Redux state
      if (updatedUser) {
        dispatch(setCredentials({
          user: {
            ...currentUser,
            ...updatedUser,
            name: businessName || currentUser?.name,
            vendorProfile: {
              ...vendorProfile,
              businessName,
              category,
              subcategory,
              address,
              isTemporaryClosed,
              closeScheduleReason,
              autoResponseNote,
              notificationsEnabled,
            }
          }
        }));
      }

      toast.success('🟢 Vendor Business Settings & Shop Status Saved Successfully!', { id: toastId });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save settings', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShop = () => {
    if (window.confirm('Are you sure you want to permanently delete your shop listing and vendor account?')) {
      toast.success('Shop deletion request submitted');
      dispatch(logout());
      navigate('/auth/login');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiSettings}
        title="Vendor Settings & Business Configuration"
        subtitle="Configure business categories, subcategories, close schedule markers, auto-responses, and store info"
      />

      {loading ? (
        <div className="glass rounded-2xl p-8 text-center text-xs text-text-tertiary">
          Loading vendor configuration...
        </div>
      ) : (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          
          {/* Business Profile Information */}
          <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
              <FiBriefcase className="text-brand-purple" />
              <span>Business Profile Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                  Business / Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Apex Electronics & Services"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                  Primary Operating Address
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop 12, Main Commercial Complex, City Center"
                    className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                  />
                  <FiMapPin className="absolute left-3 top-3 text-text-tertiary" size={14} />
                </div>
              </div>
            </div>
          </div>

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
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple"
                >
                  <option value="Electronics">Electronics & IT</option>
                  <option value="Home Services">Home Services & Repairs</option>
                  <option value="Beauty & Wellness">Beauty & Wellness</option>
                  <option value="Fashion">Fashion & Apparel</option>
                  <option value="Education & Coaching">Education & Coaching</option>
                  <option value="Health & Medical">Health & Medical</option>
                  <option value="Automobile Services">Automobile Services</option>
                  <option value="Furniture">Furniture & Decor</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Sub-category</label>
                <input
                  type="text"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="e.g. Smartphones, Electrician, AC Repair"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>
            </div>
          </div>

          {/* Shop Temporary Close Marker */}
          <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
              <FiClock className="text-amber-500" />
              <span>Shop / Service Close Marker Schedule</span>
            </h3>

            <div className="flex items-center justify-between p-4 glass rounded-xl border border-border">
              <div>
                <h4 className="font-bold text-xs text-text-primary">Temporary Closed Status Marker</h4>
                <p className="text-[11px] text-text-tertiary">When enabled, your store will display a "TEMPORARY CLOSED" badge on search and customer feeds</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTemporaryClosed(!isTemporaryClosed)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isTemporaryClosed ? 'bg-red-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md'
                }`}
              >
                {isTemporaryClosed ? '🔴 MARKER: TEMPORARY CLOSED' : '🟢 MARKER: OPEN FOR BUSINESS'}
              </button>
            </div>

            {isTemporaryClosed && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2">
                <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                  Close Schedule Reason / Reopening Note for Customers
                </label>
                <input
                  type="text"
                  value={closeScheduleReason}
                  onChange={(e) => setCloseScheduleReason(e.target.value)}
                  placeholder="e.g. Closed for vacation until Monday 10:00 AM"
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>
            )}
          </div>

          {/* Customer Inquiry Auto-Response Note */}
          <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
            <h3 className="text-sm font-bold text-text-primary font-display border-b border-border pb-3 flex items-center gap-2">
              <FiMessageSquare className="text-brand-purple" />
              <span>Customer Inquiry Auto-Response Note</span>
            </h3>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">
                Auto-Reply Message for Customer Chat & Lead Inquiries
              </label>
              <textarea
                rows={2}
                value={autoResponseNote}
                onChange={(e) => setAutoResponseNote(e.target.value)}
                placeholder="Message sent automatically when a customer leaves an inquiry..."
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FiSave size={16} /> {saving ? 'Saving Settings...' : 'Save Business Settings & Shop Status'}
          </button>
        </form>
      )}

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
          className="flex-1 py-2.5 bg-red-500/10 text-red-600 border border-red-500/20 font-bold text-xs rounded-xl hover:bg-red-500/20 transition flex items-center justify-center gap-2"
        >
          <FiTrash2 size={16} /> Delete Shop Account
        </button>
      </div>
    </div>
  );
}
