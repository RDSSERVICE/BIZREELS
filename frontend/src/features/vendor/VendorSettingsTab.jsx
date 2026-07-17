import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../auth/authSlice';
import Button from '../../components/common/Button';
import { FiSliders, FiBell, FiLock, FiCalendar, FiTrash2, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const VendorSettingsTab = ({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Settings states
  const [bizCategory, setBizCategory] = useState(user?.vendorProfile?.category || 'Electronics');
  const [bizSubcategory, setBizSubcategory] = useState('Smartphones');
  
  // Close marker states
  const [isClosed, setIsClosed] = useState(false);
  const [tempCloseStart, setTempCloseStart] = useState('');
  const [tempCloseEnd, setTempCloseEnd] = useState('');

  // Notifications states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [orderPushAlerts, setOrderPushAlerts] = useState(true);

  // Privacy states
  const [hideProfile, setHideProfile] = useState(false);
  const [hideWhatsapp, setHideWhatsapp] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success('Business preferences saved successfully!');
  };

  const handleCloseMarkerUpdate = (e) => {
    e.preventDefault();
    if (isClosed) {
      toast.success('Shop marked as TEMPORARILY CLOSED.');
    } else if (tempCloseStart && tempCloseEnd) {
      toast.success(`Scheduled temporary closure from ${tempCloseStart} to ${tempCloseEnd}`);
    } else {
      toast.success('Shop status marked as OPEN.');
    }
  };

  const handleDeleteShop = () => {
    const confirmation = window.prompt('WARNING: This will permanently delete your local shop and listings from BizReels catalog! Type "DELETE" to confirm:');
    if (confirmation === 'DELETE') {
      toast.success('Your shop profile has been deactivated.');
      dispatch(logout());
      navigate('/auth/login');
    } else {
      toast.error('Deletion cancelled. Correct phrase was not typed.');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      dispatch(logout());
      navigate('/auth/login');
      toast.success('Logged out successfully.');
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Business Settings */}
      <form onSubmit={handleSaveSettings} className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <FiSliders className="text-brand-purple" /> Category Preferences
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-navy uppercase">Choose Main Category</label>
            <select
              value={bizCategory}
              onChange={(e) => setBizCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none h-[42px]"
            >
              <option value="Electronics">Electronics</option>
              <option value="Home Services">Home Services</option>
              <option value="Fashion & Apparel">Fashion & Apparel</option>
              <option value="Beauty & Wellness">Beauty & Wellness</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-brand-navy uppercase">Sub Category Selection</label>
            <select
              value={bizSubcategory}
              onChange={(e) => setBizSubcategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none h-[42px]"
            >
              <option value="Smartphones">Smartphones & Gadgets</option>
              <option value="Laptops">Laptops & PCs</option>
              <option value="Repairs">AC & Fridge Repair</option>
              <option value="Clothing">Clothing Apparel</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" className="text-xs py-2 px-5 rounded-xl cursor-pointer">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Shop Close Marker Calendar */}
      <form onSubmit={handleCloseMarkerUpdate} className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <FiCalendar className="text-brand-orange" /> Shop Close Marker Calendar
        </h4>
        
        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="isClosedCheck"
            checked={isClosed}
            onChange={(e) => setIsClosed(e.target.checked)}
            className="w-4.5 h-4.5 text-brand-purple border-slate-300 rounded focus:ring-brand-purple cursor-pointer"
          />
          <label htmlFor="isClosedCheck" className="text-xs font-bold text-brand-navy cursor-pointer select-none">
            Mark Storefront as Temporarily Closed Immediately
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Temporary Close Start Date</label>
            <input
              type="date"
              disabled={isClosed}
              value={tempCloseStart}
              onChange={(e) => setTempCloseStart(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none disabled:opacity-50 h-[42px]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Temporary Close End Date</label>
            <input
              type="date"
              disabled={isClosed}
              value={tempCloseEnd}
              onChange={(e) => setTempCloseEnd(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none disabled:opacity-50 h-[42px]"
            />
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" className="text-xs py-2 px-5 rounded-xl cursor-pointer">
            Update Close Schedule
          </Button>
        </div>
      </form>

      {/* Notifications Preferences */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <FiBell className="text-brand-pink" /> Notification Alert Settings
        </h4>
        <div className="flex flex-col gap-3">
          {[
            { label: 'E-mail notifications for requirement leads', val: emailAlerts, setVal: setEmailAlerts },
            { label: 'SMS alerts for buyer enquiry triggers', val: smsAlerts, setVal: setSmsAlerts },
            { label: 'Push alerts for checkouts & order status', val: orderPushAlerts, setVal: setOrderPushAlerts }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-slate-600">{item.label}</span>
              <input
                type="checkbox"
                checked={item.val}
                onChange={(e) => item.setVal(e.target.checked)}
                className="w-4.5 h-4.5 text-brand-purple border-slate-300 rounded focus:ring-brand-purple cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Privacy Preferences */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <FiLock className="text-info" /> Privacy Settings
        </h4>
        <div className="flex flex-col gap-3">
          {[
            { label: 'Hide store search discoverability in local directory list', val: hideProfile, setVal: setHideProfile },
            { label: 'Hide whatsapp storefront button on listings catalog pages', val: hideWhatsapp, setVal: setHideWhatsapp }
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-1">
              <span className="text-xs font-bold text-slate-600">{item.label}</span>
              <input
                type="checkbox"
                checked={item.val}
                onChange={(e) => item.setVal(e.target.checked)}
                className="w-4.5 h-4.5 text-brand-purple border-slate-300 rounded focus:ring-brand-purple cursor-pointer"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass p-5 rounded-2xl border border-red-200/50 bg-red-50/10 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider border-b border-red-100 pb-2 flex items-center gap-1.5">
          <FiTrash2 /> Danger Zone
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h5 className="text-xs font-bold text-brand-navy">Delete Shop Storefront</h5>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Permanently terminate listings catalog records, rating history, and followers links.</p>
          </div>
          <button
            type="button"
            onClick={handleDeleteShop}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors shrink-0"
          >
            Delete Shop Permanently
          </button>
        </div>
      </div>

      {/* Logout Row */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="px-5 py-2.5 bg-slate-200/60 hover:bg-slate-300/60 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-2"
        >
          <FiLogOut /> Logout Session
        </button>
      </div>
    </div>
  );
};

export default VendorSettingsTab;
