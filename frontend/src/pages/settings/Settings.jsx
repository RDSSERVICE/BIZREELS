import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
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
  FiLoader,
  FiPhone,
  FiMail,
  FiEye,
  FiGlobe,
  FiLogOut,
  FiLock
} from 'react-icons/fi';
import { selectCurrentUser, updateUser, logout } from '../../features/auth/authSlice';
import { useUpdateProfileMutation, useLogoutMutation, useDeleteAccountMutation } from '../../features/auth/authApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

/**
 * Settings Page
 * Manages user profile details, real-time notification alerts toggling,
 * color theme settings, and workspace settings.
 */
const Settings = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();

  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [logoutApi] = useLogoutMutation();
  const [deleteAccountApi] = useDeleteAccountMutation();

  const [activeTab, setActiveTab] = useState('profile'); // profile | mobile | email | privacy | notifications | language | delete
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Change Mobile States
  const [newMobile, setNewMobile] = useState(user?.phone || '');
  const [mobileOtp, setMobileOtp] = useState('');
  const [isMobileOtpSent, setIsMobileOtpSent] = useState(false);

  // Change Email States
  const [newEmail, setNewEmail] = useState(user?.email || '');

  // Privacy Visibility State
  const [isProfilePublic, setIsProfilePublic] = useState(user?.isActive || true);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'English');

  // Account deletion verification password
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  // Sync user details on load
  useEffect(() => {
    if (user) {
      setNewMobile(user.phone || '');
      setNewEmail(user.email || '');
      setIsProfilePublic(user.isActive !== false);
      setSelectedLanguage(user.language || 'English');
    }
  }, [user]);

  const handleSendMobileOtp = () => {
    if (!newMobile) return toast.error('Please enter a valid mobile number.');
    setIsMobileOtpSent(true);
    toast.success(`Verification OTP sent to ${newMobile}! (Use any 6 digit code)`);
  };

  const handleVerifyMobileOtp = async () => {
    if (!mobileOtp || mobileOtp.length < 4) return toast.error('Enter valid verification OTP.');
    try {
      const res = await updateProfileApi({ phone: newMobile }).unwrap();
      dispatch(updateUser(res.data.user));
      setIsMobileOtpSent(false);
      setMobileOtp('');
      toast.success('Mobile number updated and verified successfully!');
    } catch (e) {
      toast.error('Failed to change mobile number.');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail) return toast.error('Please enter a valid email address.');
    try {
      const res = await updateProfileApi({ email: newEmail }).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success('Email updated successfully!');
    } catch (e) {
      toast.error(e?.data?.message || 'Failed to update email.');
    }
  };

  const handleSaveLanguage = async (lang) => {
    setSelectedLanguage(lang);
    try {
      const res = await updateProfileApi({ language: lang }).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success(`Language preference set to ${lang}.`);
    } catch (e) {
      toast.error('Failed to update language.');
    }
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    if (window.confirm('WARNING: Are you absolutely sure you want to permanently delete your account? This action is irreversible.')) {
      try {
        await deleteAccountApi().unwrap();
        dispatch(logout());
        toast.success('Your account has been deleted.');
        navigate('/auth/login');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete account.');
      }
    }
  };

  const handleLogoutAction = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      try {
        await logoutApi().unwrap();
        dispatch(logout());
        toast.success('Signed out successfully.');
        navigate('/auth/login');
      } catch (e) {
        dispatch(logout());
        navigate('/auth/login');
      }
    }
  };

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
      avatarUrl: '',
      gender: '',
      occupation: '',
      dob: '',
      language: 'English',
      address: '',
      city: '',
      district: '',
      state: '',
      pincode: '',
      lat: 0,
      lng: 0
    }
  });

  // Load user data into form
  useEffect(() => {
    if (user) {
      setValue('name', user.name || '');
      setValue('phone', user.phone || '');
      setValue('avatarUrl', user.avatarUrl || '');
      setValue('gender', user.gender || '');
      setValue('occupation', user.occupation || '');
      setValue('dob', user.dob ? new Date(user.dob).toISOString().split('T')[0] : '');
      setValue('language', user.language || 'English');
      setValue('address', user.location?.address || '');
      setValue('city', user.location?.city || '');
      setValue('district', user.location?.district || '');
      setValue('state', user.location?.state || '');
      setValue('pincode', user.location?.pincode || '');
      setValue('lat', user.location?.coordinates?.[1] || 0);
      setValue('lng', user.location?.coordinates?.[0] || 0);
    }
  }, [user, setValue]);

  const [detecting, setDetecting] = useState(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      return toast.error('Geolocation is not supported by your browser.');
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setValue('lat', latitude);
        setValue('lng', longitude);

        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`);
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const state = addr.state || '';
            const district = addr.county || addr.state_district || addr.suburb || '';
            const city = addr.city || addr.town || addr.village || addr.suburb || '';
            const pincode = addr.postcode || '';
            const fullAddress = data.display_name || '';

            setValue('state', state);
            setValue('district', district);
            setValue('city', city);
            setValue('pincode', pincode);
            setValue('address', fullAddress);
            toast.success('Location details retrieved and autofilled!');
          } else {
            toast.warning('Coordinates retrieved, but reverse geocoding did not return an address.');
          }
        } catch (err) {
          console.error(err);
          toast.error('Failed to geocode address components. Please enter manually.');
        } finally {
          setDetecting(false);
        }
      },
      (error) => {
        console.error(error);
        toast.error('Could not access current location. Please grant permission.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
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
      const payload = {
        name: data.name,
        phone: data.phone,
        avatarUrl: data.avatarUrl,
        gender: data.gender,
        occupation: data.occupation,
        dob: data.dob || undefined,
        language: data.language,
        location: {
          coordinates: [parseFloat(data.lng) || 0, parseFloat(data.lat) || 0],
          address: data.address,
          city: data.city,
          district: data.district,
          state: data.state,
          pincode: data.pincode
        }
      };
      const res = await updateProfileApi(payload).unwrap();
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
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left cursor-pointer
              ${activeTab === 'profile'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiUser className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left cursor-pointer
              ${activeTab === 'mobile'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiPhone className="w-4 h-4" />
            <span>Change Mobile</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left cursor-pointer
              ${activeTab === 'email'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiMail className="w-4 h-4" />
            <span>Change Email</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left cursor-pointer
              ${activeTab === 'privacy'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiEye className="w-4 h-4" />
            <span>Privacy</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left cursor-pointer
              ${activeTab === 'notifications'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiBell className="w-4 h-4" />
            <span>Notification Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left cursor-pointer
              ${activeTab === 'language'
                ? 'bg-brand-purple text-white shadow-premium'
                : 'text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple'
              }
            `}
          >
            <FiGlobe className="w-4 h-4" />
            <span>Language</span>
          </button>

          <button
            onClick={() => setActiveTab('delete')}
            className={`flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left cursor-pointer
              ${activeTab === 'delete'
                ? 'bg-error text-white shadow-premium'
                : 'text-error hover:bg-error/5'
              }
            `}
          >
            <FiTrash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>

          <button
            onClick={handleLogoutAction}
            className="flex items-center gap-3 px-4 py-3 rounded-premium text-xs font-bold transition-all text-left text-text-secondary hover:bg-brand-purple/5 hover:text-brand-purple cursor-pointer"
          >
            <FiLogOut className="w-4 h-4" />
            <span>Logout</span>
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
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-brand-navy uppercase">Gender</label>
                    <select
                      {...register('gender')}
                      className="w-full px-4 py-2.5 text-xs border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-10"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer Not to Say</option>
                    </select>
                  </div>

                  <Input
                    label="Occupation"
                    placeholder="e.g. Merchant, Creator"
                    {...register('occupation')}
                  />

                  <Input
                    label="Date of Birth (Optional)"
                    type="date"
                    {...register('dob')}
                  />

                  <Input
                    label="Preferred Language"
                    placeholder="e.g. Hindi, English"
                    {...register('language')}
                  />
                </div>

                <div className="flex flex-col gap-4 border-t border-border pt-4 mt-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-brand-navy uppercase tracking-wider">Address details</h4>
                    <button
                      type="button"
                      disabled={detecting}
                      onClick={handleDetectLocation}
                      className="px-3 py-1.5 text-[10px] font-bold bg-brand-purple/10 text-brand-purple border border-brand-purple/20 hover:bg-brand-purple hover:text-white rounded-premium transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {detecting ? 'Detecting Location...' : 'Use My Current Location & Autofill'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Street Address / Landmark"
                        placeholder="House no, block, sector, street name"
                        {...register('address')}
                      />
                    </div>
                    <Input
                      label="City"
                      placeholder="e.g. Mumbai"
                      {...register('city')}
                    />
                    <Input
                      label="District"
                      placeholder="e.g. Thane"
                      {...register('district')}
                    />
                    <Input
                      label="State"
                      placeholder="e.g. Maharashtra"
                      {...register('state')}
                    />
                    <Input
                      label="Pin Code"
                      placeholder="e.g. 400601"
                      {...register('pincode')}
                    />
                  </div>
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

            {/* 2. Change Mobile Form */}
            {activeTab === 'mobile' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2 font-display">
                  Change Mobile Number
                </h3>
                <p className="text-xs text-text-tertiary">Verify and update your primary mobile number.</p>

                <div className="flex flex-col gap-4 mt-2 max-w-sm">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase">New Mobile Number</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="e.g. +919876543210"
                        value={newMobile}
                        onChange={(e) => setNewMobile(e.target.value)}
                        className="flex-1 px-4 py-2 text-xs border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-10"
                      />
                      <button
                        type="button"
                        onClick={handleSendMobileOtp}
                        className="px-4 py-2 text-xs font-bold bg-brand-purple/10 text-brand-purple hover:bg-brand-purple hover:text-white rounded-premium transition-all h-10 border border-brand-purple/20 cursor-pointer whitespace-nowrap"
                      >
                        Send OTP
                      </button>
                    </div>
                  </div>

                  {isMobileOtpSent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col gap-1.5"
                    >
                      <label className="text-xs font-bold text-brand-navy uppercase">Enter 6-Digit OTP</label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="e.g. 123456"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value)}
                          className="flex-1 px-4 py-2 text-xs border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-10"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyMobileOtp}
                          className="px-4 py-2 text-xs font-bold bg-brand-purple text-white hover:bg-brand-purple-dark rounded-premium transition-all h-10 cursor-pointer whitespace-nowrap"
                        >
                          Verify & Save
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Change Email Form */}
            {activeTab === 'email' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2 font-display">
                  Change Email Address
                </h3>
                <p className="text-xs text-text-tertiary">Modify your account login & notification email address.</p>

                <div className="flex flex-col gap-4 mt-2 max-w-sm">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-brand-navy uppercase">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. name@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-4 py-2 text-xs border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-10"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleUpdateEmail} variant="primary">
                      Save Email
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Privacy Visibility */}
            {activeTab === 'privacy' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2 font-display">
                  Privacy Options
                </h3>
                <p className="text-xs text-text-tertiary">Manage your profile search visibility index settings.</p>

                <div className="flex flex-col gap-3 mt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-white/50">
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy">Public Profile Search</h4>
                      <p className="text-[10px] text-text-secondary">Allow customers and vendors to discover your profile in searches.</p>
                    </div>
                    <button
                      onClick={() => handleTogglePrivacy(!isProfilePublic)}
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 cursor-pointer
                        ${isProfilePublic ? 'bg-brand-purple justify-end' : 'bg-border justify-start'}
                      `}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-premium" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-white/50">
                    <div>
                      <h4 className="text-xs font-bold text-brand-navy">Theme & Display Mode</h4>
                      <p className="text-[10px] text-text-secondary">Toggle between light and dark modes.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleThemeToggle}>
                      {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Notifications Settings */}
            {activeTab === 'notifications' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2 font-display">
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
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 cursor-pointer
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
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 cursor-pointer
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
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 cursor-pointer
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
                      className={`w-10 h-6 rounded-full transition-all relative flex items-center px-1 cursor-pointer
                        ${notifPrefs.wallet ? 'bg-brand-purple justify-end' : 'bg-border justify-start'}
                      `}
                    >
                      <span className="w-4 h-4 rounded-full bg-white shadow-premium" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 6. Language Selector */}
            {activeTab === 'language' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-lg font-bold text-brand-navy border-b border-border pb-2 font-display">
                  Language Preference
                </h3>
                <p className="text-xs text-text-tertiary">Select your primary communication and system interface language.</p>

                <div className="flex flex-col gap-4 mt-2 max-w-sm">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-brand-navy uppercase">Preferred Language</label>
                    <select
                      value={selectedLanguage}
                      onChange={(e) => handleSaveLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 text-xs border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple h-10"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिन्दी)</option>
                      <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 7. Delete Account Zone */}
            {activeTab === 'delete' && (
              <div className="flex flex-col gap-4 animate-fade-in">
                <h3 className="text-lg font-bold text-error border-b border-border pb-2 font-display">
                  Delete Account
                </h3>
                <p className="text-xs text-text-tertiary">Irreversibly delete your account and all associated stores, listings, and workspace history.</p>

                <div className="p-4 border border-error/25 bg-error-light/5 rounded-premium flex flex-col gap-4 mt-2">
                  <div className="flex items-start gap-3">
                    <FiTrash2 className="w-5 h-5 text-error mt-0.5 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-error">Warning: Deletion is Permanent</h4>
                      <p className="text-[10px] text-text-secondary leading-relaxed mt-1">
                        Deleting your account will remove your identity records, reset wallets balances, clear catalog list listings, and erase customer chat histories.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleDeleteAccountSubmit} className="flex flex-col gap-3">
                    <Input
                      type="password"
                      label="Type Password to Confirm"
                      placeholder="Enter account password"
                      value={deleteConfirmPassword}
                      onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                      required
                    />
                    <div className="flex justify-end">
                      <Button variant="danger" type="submit">
                        Confirm Permanent Deletion
                      </Button>
                    </div>
                  </form>
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
