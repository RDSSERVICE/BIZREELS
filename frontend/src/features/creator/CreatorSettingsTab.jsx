import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../auth/authSlice';
import Button from '../../components/common/Button';
import { FiSliders, FiBell, FiLock, FiTrash2, FiLogOut } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const CreatorSettingsTab = ({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Settings states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);
  const [hidePortfolio, setHidePortfolio] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success('Creator preferences saved successfully!');
  };

  const handleDeleteCreator = () => {
    const confirmation = window.prompt('WARNING: This will permanently delete your Creator Profile and Portfolio! Type "DELETE" to confirm:');
    if (confirmation === 'DELETE') {
      toast.success('Your creator profile has been deactivated.');
      dispatch(logout());
      navigate('/auth/login');
    } else {
      toast.error('Deletion cancelled.');
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
    <div className="flex flex-col gap-6 animate-fade-in pb-8">
      {/* Alerts */}
      <form onSubmit={handleSaveSettings} className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <FiBell className="text-brand-pink" /> Campaign Notification Settings
        </h4>
        <div className="flex flex-col gap-3">
          {[
            { label: 'E-mail alerts for brand hire requests', val: emailAlerts, setVal: setEmailAlerts },
            { label: 'SMS alerts for urgent project messages', val: smsAlerts, setVal: setSmsAlerts },
            { label: 'Push alerts for payouts & project approvals', val: pushAlerts, setVal: setPushAlerts }
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
        <div className="flex justify-end pt-2">
          <Button type="submit" variant="primary" className="text-xs py-2 px-5 rounded-xl cursor-pointer">
            Save Preferences
          </Button>
        </div>
      </form>

      {/* Privacy */}
      <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <FiLock className="text-info" /> Directory Visibility Settings
        </h4>
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-bold text-slate-600">Hide my portfolio and profile from Creator Marketplace listing directory</span>
          <input
            type="checkbox"
            checked={hidePortfolio}
            onChange={(e) => setHidePortfolio(e.target.checked)}
            className="w-4.5 h-4.5 text-brand-purple border-slate-300 rounded focus:ring-brand-purple cursor-pointer"
          />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="glass p-5 rounded-2xl border border-red-200/50 bg-red-50/10 shadow-glass flex flex-col gap-4">
        <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider border-b border-red-100 pb-2 flex items-center gap-1.5">
          <FiTrash2 /> Danger Zone
        </h4>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h5 className="text-xs font-bold text-brand-navy">Delete Creator Workspace</h5>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">Permanently terminate listings catalog records, rating history, and followers links.</p>
          </div>
          <button
            type="button"
            onClick={handleDeleteCreator}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-colors shrink-0"
          >
            Delete Creator Profile
          </button>
        </div>
      </div>

      {/* Logout */}
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

export default CreatorSettingsTab;
