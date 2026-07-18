import React, { useState } from 'react';
import { FiSettings, FiImage, FiGlobe, FiClock, FiAlertOctagon, FiSmartphone, FiKey, FiCheck } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import {
  useGetAppSettingsQuery,
  useUpdateAppSettingsMutation,
} from '../../../features/admin/adminApi';

export default function AdminAppSettingsPage() {
  const { data, isFetching } = useGetAppSettingsQuery(undefined, { pollingInterval: 5000 });
  const [updateSettings] = useUpdateAppSettingsMutation();

  const [form, setForm] = useState({
    theme: 'dark',
    currency: 'INR (₹)',
    timezone: 'Asia/Kolkata (IST)',
    maintenance_mode: false,
    min_app_version: '1.0.0',
    otp_provider: 'msg91',
  });

  const handleSave = async () => {
    try {
      await updateAppSettings(form).unwrap();
      toast.success('App settings saved successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiSettings}
        title="Application Configuration & Settings"
        subtitle="Manage App Logo, Splash screen, Theme, Languages, Currency, Timezone, Maintenance mode, Minimum app version, and OTP settings"
      />

      <div className="glass p-6 rounded-2xl border border-white/50 shadow-glass space-y-6">
        {/* Branding & Assets */}
        <div>
          <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-1.5">
            <FiImage /> App Branding & Splash Assets
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-secondary p-4 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">App Main Logo</span>
              <img src="/logo.png" alt="App Logo" className="h-10 w-auto my-2" />
              <button onClick={() => toast.success('Logo upload modal triggered')} className="text-xs text-brand-purple font-bold hover:underline">
                Change Logo Image
              </button>
            </div>
            <div className="bg-surface-secondary p-4 rounded-xl border border-border">
              <span className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Mobile Splash Screen</span>
              <div className="h-10 w-full bg-brand-purple/10 rounded-lg flex items-center justify-center text-[10px] font-bold text-brand-purple my-2">
                Splash Screen Ready
              </div>
              <button onClick={() => toast.success('Splash screen upload modal triggered')} className="text-xs text-brand-purple font-bold hover:underline">
                Change Splash Background
              </button>
            </div>
          </div>
        </div>

        {/* Region & Localization */}
        <div>
          <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-1.5">
            <FiGlobe /> Localization & Currency Settings
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Default Theme</label>
              <select
                value={form.theme}
                onChange={(e) => setForm((prev) => ({ ...prev, theme: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-brand-purple"
              >
                <option value="dark">Dark Theme (Default)</option>
                <option value="light">Light Theme</option>
                <option value="system">System Preference</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Currency Symbol</label>
              <select
                value={form.currency}
                onChange={(e) => setForm((prev) => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-brand-purple"
              >
                <option value="INR (₹)">INR (₹) — Indian Rupee</option>
                <option value="USD ($)">USD ($) — US Dollar</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Time Zone</label>
              <select
                value={form.timezone}
                onChange={(e) => setForm((prev) => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-brand-purple"
              >
                <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </div>

        {/* Maintenance & Versions */}
        <div>
          <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-1.5">
            <FiAlertOctagon /> Maintenance & Mobile App Version Gate
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-surface-secondary p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-text-primary block">Maintenance Mode</span>
                <span className="text-[10px] text-text-tertiary">Disable non-admin access during upgrades</span>
              </div>
              <input
                type="checkbox"
                checked={form.maintenance_mode}
                onChange={(e) => setForm((prev) => ({ ...prev, maintenance_mode: e.target.checked }))}
                className="w-5 h-5 accent-brand-purple rounded"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Minimum Mobile App Version</label>
              <input
                type="text"
                placeholder="1.0.0"
                value={form.min_app_version}
                onChange={(e) => setForm((prev) => ({ ...prev, min_app_version: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-brand-purple"
              />
            </div>
          </div>
        </div>

        {/* OTP Provider Settings */}
        <div>
          <h3 className="text-xs font-bold text-brand-purple uppercase tracking-wider mb-4 border-b border-border pb-2 flex items-center gap-1.5">
            <FiKey /> OTP Gateway Provider
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase block mb-1">Primary Gateway</label>
              <select
                value={form.otp_provider}
                onChange={(e) => setForm((prev) => ({ ...prev, otp_provider: e.target.value }))}
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-brand-purple"
              >
                <option value="msg91">MSG91 (Production SMS)</option>
                <option value="firebase">Firebase Phone Auth</option>
                <option value="dev">Dev Mock Mode (Code: 123456)</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 gradient-brand text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-premium"
        >
          <FiCheck /> Save App Settings
        </button>
      </div>
    </div>
  );
}
