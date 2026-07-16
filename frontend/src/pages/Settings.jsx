import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  FiSettings,
  FiUser,
  FiBell,
  FiMoon,
  FiSun,
  FiTrash2,
  FiCheck,
  FiLoader
} from 'react-icons/fi';
import { selectCurrentUser, updateUser } from '../features/auth/authSlice';
import { useUpdateProfileMutation } from '../features/auth/authApi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';

/**
 * Settings Page
 * Manages user profile details, real-time notification alerts toggling,
 * color theme settings, and workspace settings.
 */
const Settings = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [activeTab, setActiveTab] = useState('profile'); // profile | notifications | appearance | danger
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // React Hook Form for Profile settings
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: '',
      phone: '',
      avatarUrl: ''
    }
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('phone', user.phone || '');
      setValue('avatarUrl', user.avatarUrl || '');
    }
  }, [user, setValue]);

  // Toggle Theme between Light and Dark modes
  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    // Set class on html/body element
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-navy-dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-navy-dark');
    }
    toast.success(`Switched to ${nextTheme} theme`);
  };

  // Submit Profile update
  const onSubmitProfile = async (data) => {
    try {
      const res = await updateProfileApi(data).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success('Profile settings updated successfully!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update profile.');
    }
  };

  // Dummy notification states
  const [notifPrefs, setNotifPrefs] = useState({
    quotes: true,
    reels: true,
    chats: true,
    wallet: true
  });

  const toggleNotifPref = (key) => {
    setNotifPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} notification preference updated.`);
      return updated;
    });
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 p-4 md:p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-purple/10 text-brand-purple rounded-premium">
          <FiSettings className="w-6 h-6 animate-spin-slow" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-brand-navy">Account Settings</h2>
          <p className="text-xs text-text-secondary">Manage your profile, preferences, and workspaces.</p>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="flex flex-col gap-2 md:col-span-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left
              ${activeTab === 'profile'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiUser className="w-4 h-4" />
            <span>Profile Details</span>
          </button>
          
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left
              ${activeTab === 'notifications'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiBell className="w-4 h-4" />
            <span>Notifications</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left
              ${activeTab === 'appearance'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            {theme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4" />}
            <span>Theme & Display</span>
          </button>

          <button
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left
              ${activeTab === 'danger'
                ? 'bg-error text-white shadow-premium'
                : 'text-error hover:bg-error/5'
              }
            `}
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Danger Zone</span>
          </button>
        </div>

        {/* Configurations Box */}
        <div className="md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col gap-6"
          >
            {/* 1. Profile Details Form */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit(onSubmitProfile)} className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2">
                  Profile Information
                </h3>

                <div className="flex flex-col md:flex-row items-center gap-6 py-2">
                  <img
                    src={user?.avatarUrl || 'https://via.placeholder.com/150'}
                    alt={user?.name}
                    className="w-20 h-20 rounded-full border-2 border-brand-purple object-cover shadow-premium"
                  />
                  <div className="flex-1 w-full">
                    <Input
                      label="Avatar Image URL"
                      placeholder="https://example.com/avatar.jpg"
                      {...register('avatarUrl')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="Enter full name"
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Phone Number"
                    placeholder="+919876543210"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>

                <div className="flex justify-end mt-4">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? (
                      <span className="flex items-center gap-2">
                        <FiLoader className="animate-spin" /> Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* 2. Notifications Preferences */}
            {activeTab === 'notifications' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2">
                  Notification Alerts Preferences
                </h3>
                <p className="text-xs text-text-tertiary">Select what updates you want to receive instantly.</p>

                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-white/50">
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy">Requirement & Bids Updates</h4>
                      <p className="text-[10px] text-text-secondary">Get notified when a quote is submitted or accepted.</p>
                    </div>
                    <button
                      onClick={() => toggleNotifPref('quotes')}
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1
                        ${notifPrefs.quotes ? 'bg-brand-purple justify-end' : 'bg-border justify-start'}
                      `}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-premium" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-white/50">
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy">Reels Comments & Likes</h4>
                      <p className="text-[10px] text-text-secondary">Get notified when someone likes or comments on your reels.</p>
                    </div>
                    <button
                      onClick={() => toggleNotifPref('reels')}
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1
                        ${notifPrefs.reels ? 'bg-brand-purple justify-end' : 'bg-border justify-start'}
                      `}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-premium" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-white/50">
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy">Direct Chat Messaging</h4>
                      <p className="text-[10px] text-text-secondary">Get notified when vendors or customers message you.</p>
                    </div>
                    <button
                      onClick={() => toggleNotifPref('chats')}
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1
                        ${notifPrefs.chats ? 'bg-brand-purple justify-end' : 'bg-border justify-start'}
                      `}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-premium" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-white/50">
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy">Wallet Transactions</h4>
                      <p className="text-[10px] text-text-secondary">Get notified on successful deposit, escrow lock, or withdrawal.</p>
                    </div>
                    <button
                      onClick={() => toggleNotifPref('wallet')}
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1
                        ${notifPrefs.wallet ? 'bg-brand-purple justify-end' : 'bg-border justify-start'}
                      `}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-premium" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Appearance Options */}
            {activeTab === 'appearance' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2">
                  Theme & Display
                </h3>
                <p className="text-xs text-text-tertiary">Select your preferred viewing color theme profile.</p>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/40 border border-white/50 mt-2">
                  <div className="flex items-center gap-3">
                    {theme === 'light' ? (
                      <FiSun className="w-5 h-5 text-brand-orange" />
                    ) : (
                      <FiMoon className="w-5 h-5 text-brand-purple" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy capitalize">{theme} Mode Active</h4>
                      <p className="text-[10px] text-text-secondary">Toggle theme style parameters globally.</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleThemeToggle}>
                    Toggle Theme Mode
                  </Button>
                </div>
              </div>
            )}

            {/* 4. Danger Zone */}
            {activeTab === 'danger' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-error border-b border-border pb-2">
                  Danger Zone
                </h3>
                <p className="text-xs text-text-tertiary">Irreversible account cancellation settings.</p>

                <div className="p-4 border border-error/20 bg-error-light/10 rounded-premium flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  <div>
                    <h4 className="text-xs font-bold text-error">Deactivate Account</h4>
                    <p className="text-[10px] text-text-secondary">Temporarily disable your profile listings and bids visibility.</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => toast.error('Account deactivation is disabled in demo mode.')}>
                    Deactivate Account
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
