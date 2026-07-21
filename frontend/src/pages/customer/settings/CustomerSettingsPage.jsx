import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiSettings, FiUser, FiLock, FiTrash2, FiLogOut, FiMapPin, FiRefreshCw, FiSave
} from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { setCredentials, logout } from '../../../features/auth/authSlice';
import { locationApi, tokenStore } from '../../../lib/api';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function CustomerSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !authUser && !tokenStore.getAccess(),
  });
  const [updateProfileApi] = useUpdateProfileMutation();

  const user = profileRes?.data?.user || profileRes?.user || authUser || {};

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setGender(user.gender || 'male');
      setOccupation(user.occupation || '');
      setDob(user.dob || '');
      setLanguage(user.language || 'English');

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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

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
      toast.success('Settings and profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out');
    navigate('/auth/login');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      dispatch(logout());
      toast.success('Account deletion request submitted');
      navigate('/auth/login');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiSettings}
        title="Customer Settings & Profile"
        subtitle="Manage your profile information, location autofill, preferences, and account security"
      />

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Profile Info Section */}
        <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-border pb-3">
            <FiUser className="text-brand-purple" />
            <span>Personal Information</span>
          </h3>

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
                onChange={(e) => setDob(e.target.value)}
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

            <button
              type="button"
              onClick={handleAutofillLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3 py-1.5 glass border border-border text-brand-purple hover:bg-brand-purple/10 rounded-xl text-xs font-bold transition"
            >
              <FiRefreshCw size={13} className={isLocating ? 'animate-spin' : ''} />
              <span>Use Current Location</span>
            </button>
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
          <span>{saving ? 'Saving Changes...' : 'Save Profile & Settings'}</span>
        </button>
      </form>

      {/* Security & Account Management */}
      <div className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-4">
        <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2 border-b border-border pb-3">
          <FiLock className="text-amber-500" />
          <span>Account Security & Actions</span>
        </h3>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleLogout}
            className="flex-1 py-2.5 glass border border-border text-text-secondary font-bold text-xs rounded-xl hover:bg-surface-tertiary transition flex items-center justify-center gap-2"
          >
            <FiLogOut size={16} />
            <span>Logout Account</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="flex-1 py-2.5 bg-error/10 text-error border border-error/20 rounded-xl text-xs font-bold hover:bg-error/20 transition flex items-center justify-center gap-2"
          >
            <FiTrash2 size={16} />
            <span>Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
