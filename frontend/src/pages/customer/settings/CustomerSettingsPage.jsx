import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiSettings, FiUser, FiLock, FiTrash2, FiLogOut, FiMapPin, FiRefreshCw, FiSave, FiGrid
} from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation, useDeleteAccountMutation } from '../../../features/auth/authApi';
import { setCredentials, logout } from '../../../features/auth/authSlice';
import { api, locationApi, tokenStore } from '../../../lib/api';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import InterestSelector from '../../../components/app/InterestSelector';

export default function CustomerSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !authUser && !tokenStore.getUser(),
  });
  const [updateProfileApi] = useUpdateProfileMutation();
  const [deleteAccountApi] = useDeleteAccountMutation();

  const user = profileRes?.data?.user || profileRes?.user || authUser || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('male');
  const [occupation, setOccupation] = useState('');
  const [dob, setDob] = useState('');
  const [language, setLanguage] = useState('English');

  // Address subfields
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');

  const [isLocating, setIsLocating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Interests state
  const [selectedInterests, setSelectedInterests] = useState([]);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setGender(user.gender || 'male');
      setOccupation(user.occupation || '');
      setDob(user.dob || '');
      setLanguage(user.language || 'English');

      if (user.customerProfile && Array.isArray(user.customerProfile.interests)) {
        setSelectedInterests(user.customerProfile.interests);
      }

      const loc = user.location || {};
      setState(loc.state || '');
      setDistrict(loc.district || '');
      setCity(loc.city || user.city || '');
      setAddress(loc.address || '');
      setPincode(loc.pincode || '');
    }
  }, [user]);

  // Handle Geolocation Autofill
  const handleAutofillLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    toast.loading('Detecting location...', { id: 'geo-toast' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let resolvedCity = '';
        let resolvedDistrict = '';
        let resolvedState = '';
        let resolvedPincode = '';
        let resolvedAddress = '';

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};

            resolvedCity = addr.city || addr.town || addr.village || addr.suburb || '';
            resolvedDistrict = addr.state_district || addr.county || addr.city_district || '';
            resolvedState = addr.state || '';
            resolvedPincode = addr.postcode || '';
            resolvedAddress = data.display_name || `${resolvedCity}, ${resolvedState}`;
          }
        } catch (err) {
          console.warn('Nominatim reverse geocode failed, using backend fallback', err);
        }

        if (!resolvedCity && !resolvedState) {
          try {
            const backendGeo = await locationApi.reverseGeocode(latitude, longitude);
            const geoData = backendGeo.data?.data || backendGeo.data || {};
            resolvedCity = geoData.city || '';
            resolvedState = geoData.state || '';
            resolvedDistrict = geoData.area || '';
            resolvedPincode = geoData.pincode || '';
            resolvedAddress = `${resolvedCity}${resolvedState ? `, ${resolvedState}` : ''}`;
          } catch (e) {
            console.warn('Backend reverseGeocode fallback failed', e);
          }
        }

        if (resolvedCity || resolvedState) {
          setCity(resolvedCity);
          setDistrict(resolvedDistrict);
          setState(resolvedState);
          setPincode(resolvedPincode);
          setAddress(resolvedAddress);

          toast.success('Location details autofilled successfully!', { id: 'geo-toast' });
        } else {
          toast.error('Could not resolve location address', { id: 'geo-toast' });
        }
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        toast.error(`Geolocation error: ${error.message}`, { id: 'geo-toast' });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'interests', 'security'

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (dob) {
      const todayVal = new Date();
      todayVal.setHours(23, 59, 59, 999);
      if (new Date(dob) > todayVal) {
        toast.error('Date of Birth cannot be in the future.');
        return;
      }
    }

    setSaving(true);
    const toastId = toast.loading('Saving profile changes...');

    try {
      const payload = {
        name,
        email,
        phone,
        gender,
        occupation,
        dob,
        language,
        city,
        location: {
          type: 'Point',
          coordinates: user.location?.coordinates || [0, 0],
          address,
          city,
          district,
          state,
          pincode
        }
      };

      const res = await updateProfileApi(payload).unwrap();
      dispatch(setCredentials({ user: res.user || res.data?.user }));
      toast.success('Profile settings updated successfully!', { id: toastId });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.data?.message || 'Failed to update profile settings';
      toast.error(msg, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInterests = async (e) => {
    e.preventDefault();
    if (selectedInterests.length < 5) {
      toast.error('Please select at least 5 interests to personalize your feed');
      return;
    }
    setSaving(true);
    const toastId = toast.loading('Updating your feed interests...');
    try {
      await api.patch('/v1/users/me/interests', { interests: selectedInterests });
      toast.success('Your feed interests have been updated successfully!', { id: toastId });
    } catch (err) {
      const msg = err?.response?.data?.message || err?.data?.message || 'Failed to update interests';
      toast.error(msg, { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    navigate('/auth/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      const toastId = toast.loading('Deleting account...');
      try {
        await deleteAccountApi().unwrap();
        toast.success('Your account has been deleted.', { id: toastId });
        dispatch(logout());
        navigate('/auth/login');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to delete account.', { id: toastId });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-5 animate-fade-in p-2 sm:p-4 min-h-screen pb-24 lg:pb-8 font-sans">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">CUSTOMER PORTAL</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            ACCOUNT &amp; PROFILE SETTINGS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Manage your profile information, location autofill, preferences, and account security.
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiSettings size={20} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar Navigation */}
        <div className="col-span-12 md:col-span-3 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-md font-extrabold text-xs transition duration-150 border whitespace-nowrap md:w-full cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                : 'bg-white text-slate-700 hover:bg-[#f8f4ec] border-[#e3dccb]'
            }`}
          >
            <FiUser size={16} className={activeTab === 'profile' ? 'text-[#d99a3d]' : 'text-slate-500'} />
            <span>Profile &amp; Address</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('interests')}
            className={`flex items-center gap-3 px-4 py-3 rounded-md font-extrabold text-xs transition duration-150 border whitespace-nowrap md:w-full cursor-pointer ${
              activeTab === 'interests'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                : 'bg-white text-slate-700 hover:bg-[#f8f4ec] border-[#e3dccb]'
            }`}
          >
            <FiGrid size={16} className={activeTab === 'interests' ? 'text-[#d99a3d]' : 'text-slate-500'} />
            <span>Feed Interests</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-md font-extrabold text-xs transition duration-150 border whitespace-nowrap md:w-full cursor-pointer ${
              activeTab === 'security'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                : 'bg-white text-slate-700 hover:bg-[#f8f4ec] border-[#e3dccb]'
            }`}
          >
            <FiLock size={16} className={activeTab === 'security' ? 'text-[#d99a3d]' : 'text-slate-500'} />
            <span>Account Security</span>
          </button>
        </div>

        {/* Active Tab Panel */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Profile Info Section */}
              <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                    <FiUser className="text-brand-purple" />
                    <span>Personal Information</span>
                  </h3>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <FiSave size={13} />
                    <span>Update</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Occupation</label>
                    <input
                      type="text"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="e.g. Business Owner / Software Engineer"
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Date of Birth (Optional)</label>
                    <input
                      type="date"
                      value={dob}
                      max={todayStr}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const todayVal = new Date();
                          todayVal.setHours(23, 59, 59, 999);
                          if (new Date(val) > todayVal) {
                            toast.error('Date of Birth cannot be in the future.');
                            return;
                          }
                        }
                        setDob(val);
                      }}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Preferred Language</label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi (हिंदी)</option>
                      <option value="Marathi">Marathi (मराठी)</option>
                      <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                      <option value="Tamil">Tamil (தமிழ்)</option>
                      <option value="Bengali">Bengali (বাংলা)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
              </div>

              {/* Address & Geolocation Autofill Section */}
              <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                    <FiMapPin className="text-brand-orange" />
                    <span>Address & Location (Autofill Enabled)</span>
                  </h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAutofillLocation}
                      disabled={isLocating}
                      className="flex items-center gap-1.5 px-3 py-1.5 glass border border-border text-brand-purple hover:bg-brand-purple/10 rounded-xl text-xs font-bold transition"
                    >
                      <FiRefreshCw size={13} className={isLocating ? 'animate-spin' : ''} />
                      <span>Use Current Location</span>
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 gradient-brand text-white rounded-xl text-xs font-bold shadow-premium hover:opacity-90 transition hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <FiSave size={13} />
                      <span>Update</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Maharashtra"
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">District</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Mumbai Suburban"
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Mumbai"
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Full Street Address</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Flat 402, Sunshine Heights, Bandra West"
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 400050"
                      className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
              </div>

              {/* Save Settings Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <FiSave size={16} />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </form>
          )}

          {activeTab === 'interests' && (
            <form onSubmit={handleSaveInterests} className="space-y-6">
              {/* Interests Selection Section */}
              <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2">
                    <FiGrid className="text-brand-purple" />
                    <span>Personalized Feed Interests</span>
                  </h3>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    selectedInterests.length >= 5
                      ? 'bg-brand-purple/10 text-brand-purple'
                      : 'bg-error/10 text-error'
                  }`}>
                    {selectedInterests.length} Selected (Min 5)
                  </span>
                </div>

                <p className="text-[11px] text-text-tertiary">
                  Select at least 5 interests. We will personalize your Reels & Marketplace feed based on these categories and subcategories. Click on a category to expand it and select specific subcategories.
                </p>

                <InterestSelector selected={selectedInterests} setSelected={setSelectedInterests} />
              </div>

              {/* Update Interests Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center justify-center gap-2"
              >
                <FiSave size={16} />
                <span>{saving ? 'Updating Interests...' : 'Update Feed Interests'}</span>
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-5">
              <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-border pb-3">
                <FiLock className="text-amber-500" />
                <span>Account Security & Actions</span>
              </h3>

              <p className="text-[11px] text-text-tertiary">
                Manage your account session and membership. Warning: Deleting your account will remove all your data, reels history, and marketplace activity permanently.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 py-2.5 glass border border-border text-text-secondary font-bold text-xs rounded-xl hover:bg-surface-tertiary transition flex items-center justify-center gap-2"
                >
                  <FiLogOut size={16} />
                  <span>Logout Account</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="flex-1 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl text-xs font-bold hover:bg-error/20 transition flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={16} />
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
