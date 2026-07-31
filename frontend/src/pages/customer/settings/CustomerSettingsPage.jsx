import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  FiSettings, FiUser, FiLock, FiTrash2, FiLogOut, FiMapPin, FiRefreshCw, FiSave,
  FiGrid, FiChevronRight, FiCheck, FiCpu, FiShoppingBag, FiCoffee, FiTool,
  FiSliders, FiTruck, FiShoppingCart, FiHeart, FiHome, FiBookOpen, FiBox
} from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation, useDeleteAccountMutation } from '../../../features/auth/authApi';
import { setCredentials, logout } from '../../../features/auth/authSlice';
import { api, locationApi, tokenStore } from '../../../lib/api';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

const DEFAULT_CATEGORIES = [
  {
    name: 'Electronics & IT',
    icon: '💻',
    subs: ['Laptops', 'Smartphones', 'Tablets', 'Cameras', 'Computer Accessories', 'Printers', 'Networking', 'Software']
  },
  {
    name: 'Fashion & Apparel',
    icon: '👗',
    subs: ['Men\'s Wear', 'Women\'s Wear', 'Kids\' Wear', 'Footwear', 'Jewellery', 'Watches', 'Bags & Wallets', 'Ethnic Wear']
  },
  {
    name: 'Restaurant & Food',
    icon: '🍕',
    subs: ['Fast Food', 'Fine Dining', 'Bakery & Sweets', 'Beverages', 'Catering', 'Cloud Kitchen', 'Street Food', 'Organic Food']
  },
  {
    name: 'Services & Repairs',
    icon: '🔧',
    subs: ['AC Repair', 'Plumbing', 'Electrician', 'Carpentry', 'Painting', 'Pest Control', 'Appliance Repair', 'Cleaning']
  },
  {
    name: 'Furniture & Home Decor',
    icon: '🛋️',
    subs: ['Sofas', 'Beds', 'Tables', 'Wardrobes', 'Lighting', 'Curtains', 'Wall Art', 'Kitchenware']
  },
  {
    name: 'Automobile & Parts',
    icon: '🚗',
    subs: ['Cars', 'Bikes', 'Spare Parts', 'Tyres', 'Car Accessories', 'Service Center', 'EV', 'Commercial Vehicles']
  },
  {
    name: 'Grocery & Daily Essentials',
    icon: '🛒',
    subs: ['Fruits & Vegetables', 'Dairy', 'Snacks', 'Beverages', 'Personal Care', 'Baby Care', 'Pet Supplies', 'Stationery']
  },
  {
    name: 'Healthcare & Beauty',
    icon: '💊',
    subs: ['Pharmacy', 'Skin Care', 'Hair Care', 'Fitness', 'Dental', 'Ayurveda', 'Salon & Spa', 'Eye Care']
  },
  {
    name: 'Real Estate & Construction',
    icon: '🏗️',
    subs: ['Residential', 'Commercial', 'Plots', 'Rentals', 'Building Materials', 'Interior Design', 'Architecture', 'Labour']
  },
  {
    name: 'Education & Coaching',
    icon: '📚',
    subs: ['School Tuition', 'Competitive Exams', 'Skill Development', 'Language Classes', 'Music & Art', 'IT Training', 'MBA Coaching', 'Online Courses']
  },
];

const getCategoryIcon = (categoryName, defaultIcon) => {
  const name = (categoryName || '').toLowerCase();
  const iconStr = typeof defaultIcon === 'string' ? defaultIcon : '';

  if (name.includes('electronic') || name.includes('it') || iconStr === '💻' || iconStr === '📱') {
    return FiCpu;
  }
  if (name.includes('fashion') || name.includes('apparel') || name.includes('wear') || iconStr === '👗') {
    return FiShoppingBag;
  }
  if (name.includes('restaurant') || name.includes('food') || iconStr === '🍕' || iconStr === '🍲') {
    return FiCoffee;
  }
  if (name.includes('service') || name.includes('repair') || iconStr === '🔧' || iconStr === '🛠️') {
    return FiTool;
  }
  if (name.includes('furniture') || name.includes('decor') || iconStr === '🛋️' || iconStr === '🪑') {
    return FiSliders;
  }
  if (name.includes('automobile') || name.includes('car') || name.includes('vehicle') || name.includes('bike') || iconStr === '🚗' || iconStr === '🏍️') {
    return FiTruck;
  }
  if (name.includes('grocery') || name.includes('essential') || iconStr === '🛒') {
    return FiShoppingCart;
  }
  if (name.includes('healthcare') || name.includes('beauty') || name.includes('salon') || name.includes('fitness') || name.includes('health') || iconStr === '💊' || iconStr === '💇' || iconStr === '🏋️') {
    return FiHeart;
  }
  if (name.includes('real estate') || name.includes('construction') || name.includes('property') || iconStr === '🏗️' || iconStr === '🏠' || iconStr === '🏢') {
    return FiHome;
  }
  if (name.includes('education') || name.includes('coaching') || iconStr === '📚') {
    return FiBookOpen;
  }
  
  return FiBox;
};

export default function CustomerSettingsPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !authUser && !tokenStore.getAccess(),
  });
  const [updateProfileApi] = useUpdateProfileMutation();
  const [deleteAccountApi] = useDeleteAccountMutation();

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

  // Interests state
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);

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

  // Load categories from database on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await api.get('/v1/categories?tree=true');
        const items = res.data?.items || [];
        if (items.length > 0) {
          const formatted = items
            .filter(c => !c.parent_id && c.is_active !== false)
            .map(c => ({
              name: c.name,
              icon: c.icon_url || '📦',
              dbId: c._id,
              subs: (c.children || []).map(sub => sub.name),
            }));
          if (formatted.length >= 5) {
            setCategories(formatted);
          }
        }
      } catch (err) {
        // Fall back to DEFAULT_CATEGORIES
      }
    };
    loadCategories();
  }, []);

  const isSelected = (category, subcategory) => {
    return selectedInterests.some(
      s => s.category === category && s.subcategory === (subcategory || null)
    );
  };

  const toggleSelection = (category, subcategory = null) => {
    const exists = isSelected(category, subcategory);
    if (exists) {
      setSelectedInterests(prev =>
        prev.filter(s => !(s.category === category && s.subcategory === (subcategory || null)))
      );
    } else {
      setSelectedInterests(prev => [...prev, { category, subcategory: subcategory || null }]);
    }
  };

  const toggleCategory = (categoryName) => {
    if (expandedCategory === categoryName) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryName);
      if (!selectedInterests.some(s => s.category === categoryName && !s.subcategory)) {
        toggleSelection(categoryName);
      }
    }
  };

  const categorySelectedCount = (categoryName) => {
    return selectedInterests.filter(s => s.category === categoryName).length;
  };

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
    if (selectedInterests.length < 5) {
      toast.error('Please select at least 5 interests to personalize your feed');
      return;
    }
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

      // Save interests
      await api.patch('/v1/users/me/interests', { interests: selectedInterests });

      dispatch(setCredentials({ user: res.user || res.data?.user }));
      toast.success('Settings, profile, and interests updated successfully!');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.data?.message || 'Failed to update profile settings';
      toast.error(msg);
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, idx) => {
              const isExpanded = expandedCategory === cat.name;
              const count = categorySelectedCount(cat.name);
              const isCatSelected = selectedInterests.some(s => s.category === cat.name);
              const IconComponent = getCategoryIcon(cat.name, cat.icon);

              return (
                <div
                  key={cat.name}
                  className={`rounded-2xl border overflow-hidden transition-all duration-300 cursor-pointer group ${
                    isCatSelected
                      ? 'border-brand-purple/50 bg-brand-purple/5 shadow-premium'
                      : 'border-white/10 hover:border-brand-purple/30 bg-white/5 shadow-card'
                  }`}
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(cat.name)}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isCatSelected 
                          ? 'gradient-brand text-white shadow-premium' 
                          : 'bg-white/5 text-text-secondary border border-white/10 group-hover:bg-brand-purple/10 group-hover:text-brand-purple group-hover:border-brand-purple/20'
                      }`}>
                        <IconComponent size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-text-primary group-hover:text-brand-purple transition-colors">
                          {cat.name}
                        </h4>
                        {count > 0 && (
                          <span className="text-[8px] font-bold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded-full">
                            {count} selected
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCatSelected && (
                        <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center shadow-sm">
                          <FiCheck className="text-white" size={10} />
                        </div>
                      )}
                      <FiChevronRight
                        className={`text-text-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}
                        size={12}
                      />
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && cat.subs && cat.subs.length > 0 && (
                    <div className="px-4 pb-4 pt-0 flex flex-wrap gap-1.5">
                      {cat.subs.map((sub) => {
                        const subSelected = isSelected(cat.name, sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSelection(cat.name, sub);
                            }}
                            className={`px-2.5 py-1 rounded-full text-[9px] font-bold transition-all duration-200 border ${
                              subSelected
                                ? 'bg-brand-purple text-white border-brand-purple shadow-sm scale-105'
                                : 'bg-surface-secondary text-text-secondary border-border hover:border-brand-purple/40 hover:text-brand-purple'
                            }`}
                          >
                            {subSelected && <FiCheck className="inline mr-1" size={8} />}
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
