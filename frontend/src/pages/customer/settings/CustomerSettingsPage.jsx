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
import { useLanguage } from '../../../context/LanguageContext';

const CUSTOMER_PROFESSIONS = [
  'Business Owner / Entrepreneur',
  'Software Engineer / IT Professional',
  'Retailer / Shopkeeper',
  'Doctor / Healthcare Professional',
  'Teacher / Educator / Professor',
  'Student',
  'Chartered Accountant / Financial Advisor',
  'Lawyer / Legal Consultant',
  'Real Estate Agent / Broker',
  'Architect / Interior Designer',
  'Government / Civil Services Employee',
  'Private Sector Employee',
  'Marketing / Sales Executive',
  'Photographer / Videographer',
  'Designer / Creative Artist',
  'Homemaker',
  'Freelancer / Consultant',
  'Farmer / Agriculture',
  'Technician / Electrician / Mechanic',
  'Other / Custom Profession'
];

export default function CustomerSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { bi, t } = useLanguage();
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
  const [profession, setProfession] = useState('');
  const [customProfession, setCustomProfession] = useState('');
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
      
      const userProf = user.profession || user.occupation || '';
      if (userProf) {
        if (CUSTOMER_PROFESSIONS.includes(userProf)) {
          setProfession(userProf);
          setCustomProfession('');
        } else {
          setProfession('Other / Custom Profession');
          setCustomProfession(userProf);
        }
      } else {
        setProfession('');
        setCustomProfession('');
      }

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

    const resolvedProfession = profession === 'Other / Custom Profession' ? customProfession.trim() : profession;

    try {
      const payload = {
        name,
        email,
        phone,
        gender,
        profession: resolvedProfession,
        occupation: resolvedProfession,
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
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in p-3 sm:p-6 min-h-screen pb-24 lg:pb-12 font-sans bg-[#f2ede4]">
      
      {/* ── 1. PREMIUM HERO USER PROFILE BANNER ── */}
      <div className="bg-[#241b15] text-white p-6 sm:p-8 rounded-2xl border border-[#241b15] shadow-lg relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Subtle background glow element */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-[#d99a3d]/10 blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4 sm:gap-6 z-10">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[#d99a3d] to-[#241b15] p-1 shadow-md">
              <div className="w-full h-full bg-[#1a1a1a] rounded-full flex items-center justify-center text-xl sm:text-2xl font-black text-[#d99a3d] overflow-hidden uppercase">
                {user.avatarUrl || user.profile_pic ? (
                  <img src={user.avatarUrl || user.profile_pic} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{name ? name.charAt(0) : 'C'}</span>
                )}
              </div>
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-[#241b15] rounded-full shadow-xs" title="Active" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
                {name || 'Valued Customer'}
              </h1>
              <span className="bg-[#d99a3d] text-[#1a1a1a] text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                {bi('Verified Customer', 'सत्यापित ग्राहक')}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium flex items-center gap-2 flex-wrap">
              <span>{email || 'customer@bizreels.in'}</span>
              {phone && (
                <>
                  <span className="text-[#d99a3d]">•</span>
                  <span>{phone}</span>
                </>
              )}
            </p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <FiMapPin size={12} className="text-[#d99a3d]" />
              <span>{[city, state].filter(Boolean).join(', ') || bi('Location Not Set', 'स्थान सेट नहीं')}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 z-10 self-stretch md:self-auto justify-end">
          <span className="text-[11px] font-bold text-[#d99a3d] bg-white/10 px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2">
            <FiSettings size={15} />
            <span>{bi('Settings Console', 'सेटिंग्स कंसोल')}</span>
          </span>
        </div>
      </div>

      {/* ── 2. TABBED NAVIGATION & MAIN SETTINGS CONTENT ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Modern Sidebar Navigation */}
        <div className="col-span-12 md:col-span-3 flex flex-row md:flex-col gap-2.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs transition-all duration-200 border whitespace-nowrap md:w-full cursor-pointer shadow-2xs ${
              activeTab === 'profile'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] ring-2 ring-[#d99a3d]/40 scale-[1.01]'
                : 'bg-white text-slate-700 hover:bg-white/80 border-[#e3dccb] hover:border-[#d99a3d]/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'profile' ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-slate-100 text-slate-600'}`}>
              <FiUser size={16} />
            </div>
            <div className="text-left">
              <div className="leading-tight">{bi('Profile & Address', 'प्रोफ़ाइल एवं पता')}</div>
              <div className="text-[9.5px] font-medium opacity-70 mt-0.5">{bi('Personal & location data', 'व्यक्तिगत और स्थान डेटा')}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('interests')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs transition-all duration-200 border whitespace-nowrap md:w-full cursor-pointer shadow-2xs ${
              activeTab === 'interests'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] ring-2 ring-[#d99a3d]/40 scale-[1.01]'
                : 'bg-white text-slate-700 hover:bg-white/80 border-[#e3dccb] hover:border-[#d99a3d]/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'interests' ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-slate-100 text-slate-600'}`}>
              <FiGrid size={16} />
            </div>
            <div className="text-left">
              <div className="leading-tight">{bi('Feed Interests', 'फ़ीड रुचियां')}</div>
              <div className="text-[9.5px] font-medium opacity-70 mt-0.5">{bi('Customize feed content', 'फ़ीड सामग्री कस्टमाइज़ करें')}</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-black text-xs transition-all duration-200 border whitespace-nowrap md:w-full cursor-pointer shadow-2xs ${
              activeTab === 'security'
                ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] ring-2 ring-[#d99a3d]/40 scale-[1.01]'
                : 'bg-white text-slate-700 hover:bg-white/80 border-[#e3dccb] hover:border-[#d99a3d]/50'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'security' ? 'bg-[#d99a3d] text-[#1a1a1a]' : 'bg-slate-100 text-slate-600'}`}>
              <FiLock size={16} />
            </div>
            <div className="text-left">
              <div className="leading-tight">{bi('Account Security', 'खाता सुरक्षा')}</div>
              <div className="text-[9.5px] font-medium opacity-70 mt-0.5">{bi('Password & account control', 'पासवर्ड एवं नियंत्रण')}</div>
            </div>
          </button>
        </div>

        {/* ── 3. MAIN FORM & CONTROLS CONTAINER ── */}
        <div className="col-span-12 md:col-span-9 space-y-6">
          
          {/* TAB 1: PROFILE & ADDRESS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              
              {/* Personal Details Card */}
              <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#e3dccb] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d99a3d]" />
                    <h3 className="text-sm font-extrabold text-[#1a1a1a] uppercase tracking-wider">
                      {bi('Personal Information', 'व्यक्तिगत जानकारी')}
                    </h3>
                  </div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-black rounded-xl text-xs uppercase tracking-wider shadow-xs transition cursor-pointer flex items-center gap-1.5 border border-[#1a1a1a]"
                  >
                    <FiSave size={14} />
                    <span>{bi('Update', 'अपडेट करें')}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {bi('Full Name *', 'पूरा नाम *')}
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {bi('Gender', 'लिंग')}
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition cursor-pointer"
                    >
                      <option value="male">{bi('Male', 'पुरुष')}</option>
                      <option value="female">{bi('Female', 'महिला')}</option>
                      <option value="other">{bi('Other', 'अन्य')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {bi('Profession / Occupation', 'व्यवसाय / पेशा')}
                    </label>
                    <select
                      value={profession}
                      onChange={(e) => {
                        setProfession(e.target.value);
                        if (e.target.value !== 'Other / Custom Profession') {
                          setCustomProfession('');
                        }
                      }}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition cursor-pointer"
                    >
                      <option value="">{bi('Select your profession...', 'अपना व्यवसाय चुनें...')}</option>
                      {CUSTOMER_PROFESSIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>

                    {profession === 'Other / Custom Profession' && (
                      <input
                        type="text"
                        value={customProfession}
                        onChange={(e) => setCustomProfession(e.target.value)}
                        placeholder={bi('Enter your custom profession...', 'अपना व्यवसाय दर्ज करें...')}
                        className="w-full mt-2.5 px-4 py-3 bg-white border border-[#d99a3d] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none shadow-xs"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {bi('Date of Birth (Optional)', 'जन्म तिथि (वैकल्पिक)')}
                    </label>
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
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {bi('Preferred Language', 'पसंदीदा भाषा')}
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition cursor-pointer"
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
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {bi('Mobile Number', 'मोबाइल नंबर')}
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {bi('Email Address', 'ईमेल पता')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Address & Geolocation Autofill Card */}
              <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#e3dccb] pb-4 gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d99a3d]" />
                    <h3 className="text-sm font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                      <FiMapPin className="text-[#d99a3d]" />
                      <span>{bi('Address & Location Details', 'पता एवं स्थान विवरण')}</span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAutofillLocation}
                      disabled={isLocating}
                      className="px-3 py-2 bg-[#f8f4ec] hover:bg-[#241b15] hover:text-[#d99a3d] border border-[#e3dccb] text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <FiRefreshCw size={13} className={isLocating ? 'animate-spin' : ''} />
                      <span>{bi('Autofill Current Location', 'वर्तमान स्थान प्राप्त करें')}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">{bi('State', 'राज्य')}</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder={bi('e.g. Maharashtra', 'उदाहरण: महाराष्ट्र')}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">{bi('District', 'जिला')}</label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder={bi('e.g. Mumbai Suburban', 'उदाहरण: मुंबई उपनगर')}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">{bi('City', 'शहर')}</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={bi('e.g. Mumbai', 'उदाहरण: मुंबई')}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">{bi('Full Street Address', 'पूरा सड़क पता')}</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={bi('e.g. Flat 402, Sunshine Heights, Bandra West', 'उदाहरण: फ्लैट 402, बांद्रा वेस्ट')}
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">{bi('Pincode', 'पिन कोड')}</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g. 400050"
                      className="w-full px-4 py-3 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                    />
                  </div>
                </div>
              </div>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-xl bg-[#241b15] text-[#d99a3d] border border-[#241b15] font-black text-xs uppercase tracking-widest shadow-md hover:bg-[#1a1a1a] hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiSave size={18} />
                <span>{saving ? bi('Saving Changes...', 'सहेजा जा रहा है...') : bi('Save Profile Details', 'प्रोफ़ाइल विवरण सहेजें')}</span>
              </button>
            </form>
          )}

          {/* TAB 2: FEED INTERESTS */}
          {activeTab === 'interests' && (
            <form onSubmit={handleSaveInterests} className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-xs space-y-6">
                <div className="flex items-center justify-between border-b border-[#e3dccb] pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#d99a3d]" />
                    <h3 className="text-sm font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                      <FiGrid className="text-[#d99a3d]" />
                      <span>{bi('Personalized Feed Interests', 'व्यक्तिगत फ़ीड रुचियां')}</span>
                    </h3>
                  </div>
                  <span className={`text-[10.5px] font-black px-3 py-1 rounded-full uppercase tracking-wider ${
                    selectedInterests.length >= 5
                      ? 'bg-[#d99a3d]/20 text-[#1a1a1a] border border-[#d99a3d]/40'
                      : 'bg-red-500/10 text-red-700 border border-red-200'
                  }`}>
                    {selectedInterests.length} {bi('Selected (Min 5)', 'चयनित (न्यूनतम 5)')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {bi('Select at least 5 interests. We will personalize your Reels & Marketplace feed based on these categories and subcategories.', 'कम से कम 5 रुचियों का चयन करें। हम इन श्रेणियों के आधार पर आपके फ़ीड को व्यक्तिगत बनाएंगे।')}
                </p>

                <InterestSelector selected={selectedInterests} setSelected={setSelectedInterests} />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-xl bg-[#241b15] text-[#d99a3d] border border-[#241b15] font-black text-xs uppercase tracking-widest shadow-md hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiSave size={18} />
                <span>{saving ? bi('Updating Interests...', 'अपडेट हो रहा है...') : bi('Update Feed Interests', 'फ़ीड रुचियां अपडेट करें')}</span>
              </button>
            </form>
          )}

          {/* TAB 3: ACCOUNT SECURITY */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl p-6 border border-[#e3dccb] shadow-xs space-y-6">
              <div className="flex items-center gap-2.5 border-b border-[#e3dccb] pb-4">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h3 className="text-sm font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                  <FiLock className="text-red-500" />
                  <span>{bi('Account Security & Danger Zone', 'खाता सुरक्षा एवं जोखिम क्षेत्र')}</span>
                </h3>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {bi('Manage your active login session and account ownership. Warning: Deleting your account will permanently remove all your requirement history and saved listings.', 'अपना खाता सत्र और स्वामित्व प्रबंधित करें। चेतावनी: अपना खाता हटाने से आपकी सारी गतिविधि स्थायी रूप से हट जाएगी।')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3.5 px-4 bg-[#f8f4ec] hover:bg-[#241b15] hover:text-[#d99a3d] border border-[#e3dccb] text-[#1a1a1a] font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <FiLogOut size={16} />
                  <span>{bi('Logout Account', 'खाता लॉगआउट करें')}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="py-3.5 px-4 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <FiTrash2 size={16} />
                  <span>{bi('Delete Account', 'खाता हटाएं')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
