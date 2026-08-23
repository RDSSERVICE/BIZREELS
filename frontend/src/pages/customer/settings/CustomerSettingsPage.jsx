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
    <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-fade-in p-3 sm:p-6 min-h-screen pb-24 lg:pb-12 font-sans bg-[#f8f9fa]">
      
      {/* ── 1. SLEEK TOP HEADER & USER BAR ── */}
      <div className="bg-[#241b15] text-white p-6 sm:p-7 rounded-2xl border border-[#241b15] shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#d99a3d] p-0.5 shadow-xs shrink-0">
            <div className="w-full h-full bg-[#1a1a1a] rounded-full flex items-center justify-center text-xl font-black text-[#d99a3d] overflow-hidden uppercase">
              {user.avatarUrl || user.profile_pic ? (
                <img src={user.avatarUrl || user.profile_pic} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{name ? name.charAt(0) : 'C'}</span>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                {name || bi('Account Settings', 'खाता सेटिंग्स')}
              </h1>
              <span className="bg-[#d99a3d] text-[#1a1a1a] text-[9.5px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                {bi('Verified Customer', 'सत्यापित ग्राहक')}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {email || 'customer@bizreels.in'} {phone ? `• ${phone}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-end border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
          <span className="text-[11px] font-bold text-[#d99a3d] bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-1.5">
            <FiSettings size={14} />
            <span>{bi('Customer Portal', 'ग्राहक पोर्टल')}</span>
          </span>
        </div>
      </div>

      {/* ── 2. HORIZONTAL TAB SWITCHER ── */}
      <div className="bg-white rounded-xl p-1.5 border border-[#e3dccb] shadow-2xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
              : 'text-slate-600 hover:text-[#1a1a1a] hover:bg-slate-50'
          }`}
        >
          <FiUser size={15} />
          <span>{bi('Personal Information', 'व्यक्तिगत जानकारी')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('address')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'address'
              ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
              : 'text-slate-600 hover:text-[#1a1a1a] hover:bg-slate-50'
          }`}
        >
          <FiMapPin size={15} />
          <span>{bi('Address & Location', 'पता एवं स्थान')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('interests')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'interests'
              ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
              : 'text-slate-600 hover:text-[#1a1a1a] hover:bg-slate-50'
          }`}
        >
          <FiGrid size={15} />
          <span>{bi('Feed Interests', 'फ़ीड रुचियां')}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex-1 min-w-[140px] px-4 py-2.5 rounded-lg text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer whitespace-nowrap ${
            activeTab === 'security'
              ? 'bg-[#241b15] text-[#d99a3d] shadow-2xs'
              : 'text-slate-600 hover:text-[#1a1a1a] hover:bg-slate-50'
          }`}
        >
          <FiLock size={15} />
          <span>{bi('Account Security', 'खाता सुरक्षा')}</span>
        </button>
      </div>

      {/* ── 3. MAIN FORM CONTENT CARDS ── */}
      <div className="space-y-6">

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e3dccb] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d99a3d]" />
                  {bi('Personal Information', 'व्यक्तिगत जानकारी')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bi('Update your contact info and personal preferences', 'अपनी संपर्क जानकारी और प्राथमिकताएं अपडेट करें')}
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-black rounded-xl text-xs uppercase tracking-wider shadow-2xs transition cursor-pointer flex items-center gap-2 border border-[#1a1a1a]"
              >
                <FiSave size={15} />
                <span>{saving ? bi('Saving...', 'सहेजा जा रहा है...') : bi('Save Profile', 'प्रोफ़ाइल सहेजें')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('Full Name *', 'पूरा नाम *')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={bi('Enter full name', 'पूरा नाम दर्ज करें')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('Gender', 'लिंग')}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition cursor-pointer"
                >
                  <option value="male">{bi('Male', 'पुरुष')}</option>
                  <option value="female">{bi('Female', 'महिला')}</option>
                  <option value="other">{bi('Other', 'अन्य')}</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition cursor-pointer"
                >
                  <option value="">{bi('Select profession...', 'व्यवसाय चुनें...')}</option>
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
                    placeholder={bi('Enter custom profession', 'व्यवसाय दर्ज करें')}
                    className="w-full mt-2.5 px-4 py-3 bg-white border border-[#d99a3d] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none shadow-xs"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('Preferred Language', 'पसंदीदा भाषा')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition cursor-pointer"
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
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('Mobile Number', 'मोबाइल नंबर')}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={bi('e.g. +91 9876543210', 'उदा. +91 9876543210')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('Email Address', 'ईमेल पता')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. example@gmail.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#241b15] text-[#d99a3d] border border-[#241b15] font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiSave size={16} />
                <span>{saving ? bi('Saving Changes...', 'सहेजा जा रहा है...') : bi('Save Profile Details', 'प्रोफ़ाइल विवरण सहेजें')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ADDRESS & LOCATION */}
        {activeTab === 'address' && (
          <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e3dccb] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                  <FiMapPin className="text-[#d99a3d]" />
                  {bi('Address & Location Details', 'पता एवं स्थान विवरण')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bi('Manage delivery locations and GPS autofill settings', 'डिलीवरी स्थान और जीपीएस ऑटोफिल सेटिंग्स प्रबंधित करें')}
                </p>
              </div>

              <button
                type="button"
                onClick={handleAutofillLocation}
                disabled={isLocating}
                className="px-4 py-2 bg-slate-100 hover:bg-[#241b15] hover:text-[#d99a3d] border border-slate-200 text-slate-800 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <FiRefreshCw size={14} className={isLocating ? 'animate-spin' : ''} />
                <span>{bi('Autofill Current Location', 'वर्तमान स्थान प्राप्त करें')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('State', 'राज्य')}
                </label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder={bi('e.g. Maharashtra', 'उदाहरण: महाराष्ट्र')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('District', 'जिला')}
                </label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder={bi('e.g. Mumbai Suburban', 'उदाहरण: मुंबई उपनगर')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('City', 'शहर')}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={bi('e.g. Mumbai', 'उदाहरण: मुंबई')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('Full Street Address', 'पूरा सड़क पता')}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={bi('e.g. Flat 402, Sunshine Heights, Bandra West', 'उदाहरण: फ्लैट 402, बांद्रा वेस्ट')}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider block mb-1.5">
                  {bi('Pincode', 'पिन कोड')}
                </label>
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="e.g. 400050"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:bg-white transition"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#241b15] text-[#d99a3d] border border-[#241b15] font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiSave size={16} />
                <span>{saving ? bi('Saving Changes...', 'सहेजा जा रहा है...') : bi('Save Address Details', 'पता विवरण सहेजें')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: FEED INTERESTS */}
        {activeTab === 'interests' && (
          <form onSubmit={handleSaveInterests} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e3dccb] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
              <div>
                <h2 className="text-base font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d99a3d]" />
                  {bi('Personalized Feed Interests', 'व्यक्तिगत फ़ीड रुचियां')}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bi('Search & select categories to customize your Reels and marketplace feed', 'अपने रील्स और मार्केटप्लेस फ़ीड को कस्टमाइज़ करने के लिए श्रेणियां खोजें और चुनें')}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[10.5px] font-black px-3 py-1.5 rounded-xl uppercase tracking-wider ${
                  selectedInterests.length >= 5
                    ? 'bg-[#d99a3d]/20 text-[#1a1a1a] border border-[#d99a3d]/40'
                    : 'bg-red-500/10 text-red-700 border border-red-200'
                }`}>
                  {selectedInterests.length} {bi('Selected (Min 5)', 'चयनित (न्यूनतम 5)')}
                </span>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-black rounded-xl text-xs uppercase tracking-wider shadow-2xs transition cursor-pointer flex items-center gap-2 border border-[#1a1a1a] disabled:opacity-50"
                >
                  <FiSave size={15} />
                  <span>{saving ? bi('Saving...', 'सहेजा जा रहा है...') : bi('Save Interests', 'रुचियां सहेजें')}</span>
                </button>
              </div>
            </div>

            {/* Enhanced Category & Subcategory Selector with Live Search Menu */}
            <InterestSelector selected={selectedInterests} setSelected={setSelectedInterests} showSearch={true} />

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-8 py-3.5 bg-[#241b15] text-[#d99a3d] border border-[#241b15] font-black text-xs uppercase tracking-widest rounded-xl shadow-md hover:bg-[#1a1a1a] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiSave size={16} />
                <span>{saving ? bi('Updating Interests...', 'अपडेट हो रहा है...') : bi('Update Feed Interests', 'फ़ीड रुचियां अपडेट करें')}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: ACCOUNT SECURITY */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e3dccb] shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-base font-extrabold text-[#1a1a1a] uppercase tracking-wider flex items-center gap-2">
                <FiLock className="text-red-500" />
                {bi('Account Security & Danger Zone', 'खाता सुरक्षा एवं जोखिम क्षेत्र')}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {bi('Manage session status and permanent account deletion options', 'सत्र स्थिति और खाता हटाने के विकल्प प्रबंधित करें')}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {bi('Warning: Deleting your account will permanently wipe out all your submitted briefs, vendor messages, and active orders. This action cannot be undone.', 'चेतावनी: अपना खाता हटाने से आपकी सारी गतिविधि स्थायी रूप से हट जाएगी। यह कार्रवाई पूर्ववत नहीं की जा सकती।')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <button
                type="button"
                onClick={handleLogout}
                className="py-3.5 px-4 bg-slate-100 hover:bg-[#241b15] hover:text-[#d99a3d] border border-slate-200 text-[#1a1a1a] font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <FiLogOut size={16} />
                <span>{bi('Logout Account', 'खाता लॉगआउट करें')}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteAccount}
                className="py-3.5 px-4 bg-red-50 hover:bg-red-600 hover:text-white border border-red-200 text-red-700 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <FiTrash2 size={16} />
                <span>{bi('Delete Account', 'खाता हटाएं')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
