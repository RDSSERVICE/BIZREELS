import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiBriefcase, FiCheckCircle, FiDollarSign, FiFileText, FiMapPin,
  FiCreditCard, FiArrowRight, FiShield, FiUser, FiTruck, FiClock,
  FiUploadCloud, FiSearch, FiCheck, FiGlobe, FiPhone, FiMessageSquare,
  FiMail, FiCamera, FiImage, FiCompass, FiX, FiLayers, FiPackage,
  FiInfo, FiTag, FiNavigation, FiRefreshCw, FiAlertCircle
} from 'react-icons/fi';
import { useAddRoleMutation } from '../../../features/auth/authApi';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import { setCredentials, selectCurrentUser } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { api, resolveMediaUrl } from '../../../lib/api';

const BUSINESS_TYPES = [
  { id: 'Retailer', label: 'Retailer / Shop', desc: 'Local shop, showroom, boutique store' },
  { id: 'Service Provider', label: 'Service Provider', desc: 'Repairs, salon, cleaning, consulting, etc.' },
  { id: 'Individual Seller', label: 'Individual Seller', desc: 'Single owner selling items or products' },
  { id: 'Business/Firm', label: 'Business / Firm', desc: 'Registered company, LLC, or private firm' },
  { id: 'Wholesaler', label: 'Wholesaler', desc: 'Bulk quantity sales to retailers & businesses' },
  { id: 'Manufacturer', label: 'Manufacturer', desc: 'Factory, production unit, craft maker' },
  { id: 'Distributor', label: 'Distributor', desc: 'Regional or city distribution agent' },
  { id: 'Freelancer', label: 'Freelancer', desc: 'Independent contractor or creative professional' },
];

export default function BecomeVendorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [addRoleApi] = useAddRoleMutation();

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // 1. Business Model & Vendor Type
  const [businessType, setBusinessType] = useState('Retailer');
  const [vendorType, setVendorType] = useState('both'); // 'both' | 'product' | 'service'

  // 2. Shop Branding & Information
  const [shopName, setShopName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [businessDescription, setBusinessDescription] = useState('');
  const [shopLogo, setShopLogo] = useState(user?.profile_pic || user?.avatarUrl || '');
  const [shopCoverImage, setShopCoverImage] = useState('');

  // 3. Category & Subcategory Selection (Fetched Dynamically from Backend)
  const {
    data: categoriesDataRes,
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories
  } = useListCategoriesQuery();

  const categoriesList = categoriesDataRes?.items || categoriesDataRes?.categories || (Array.isArray(categoriesDataRes) ? categoriesDataRes : []);

  const dynamicCategoriesData = useMemo(() => {
    if (!categoriesList || categoriesList.length === 0) {
      return {};
    }
    const data = {};
    const parents = categoriesList.filter(c => {
      if (c.parent_id) return false;
      if (vendorType === 'product') return c.category_type === 'product' || !c.category_type;
      if (vendorType === 'service') return c.category_type === 'service' || !c.category_type;
      return true;
    });
    const children = categoriesList.filter(c => c.parent_id);

    parents.forEach(parent => {
      const parentName = parent.name;
      const subcategories = children
        .filter(child => child.parent_id === parent.id || child.parent_id === parent._id)
        .map(child => child.name);
      data[parentName] = subcategories;
    });

    return data;
  }, [categoriesList, vendorType]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
  const [catSearch, setCatSearch] = useState('');

  // Auto-select first category when dynamic categories load from database
  useEffect(() => {
    const keys = Object.keys(dynamicCategoriesData);
    if (keys.length > 0) {
      setSelectedCategories(prev => {
        const valid = prev.filter(c => keys.includes(c));
        if (valid.length > 0) return valid;
        return [keys[0]];
      });
      const firstCategorySubs = dynamicCategoriesData[keys[0]] || [];
      if (firstCategorySubs.length > 0 && selectedSubCategories.length === 0) {
        setSelectedSubCategories([firstCategorySubs[0]]);
      }
    }
  }, [dynamicCategoriesData]);

  // 4. Contact & Social Channels
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState('');

  // 5. Business Address
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('Madhya Pradesh');
  const [district, setDistrict] = useState('Indore');
  const [city, setCity] = useState('Indore');
  const [areaLocality, setAreaLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [googleMapLocation, setGoogleMapLocation] = useState('');

  // 6. Delivery & Service Area
  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(true);
  const [homeDeliveryRadius, setHomeDeliveryRadius] = useState('5 km');
  const [homeDeliveryMinOrder, setHomeDeliveryMinOrder] = useState('200');
  const [homeDeliveryCharge, setHomeDeliveryCharge] = useState('30');
  const [courierByVendor, setCourierByVendor] = useState(true);
  const [customerVisitShop, setCustomerVisitShop] = useState(true);
  const [serviceAtCustomerLocation, setServiceAtCustomerLocation] = useState(false);
  const [serviceRadius, setServiceRadius] = useState('10 km');
  const [serviceMinOrder, setServiceMinOrder] = useState('500');

  // 7. Business Timing
  const [open24x7, setOpen24x7] = useState(false);
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [weeklyOff, setWeeklyOff] = useState('Sunday');

  // 8. Declaration & Terms Modal
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Auto Pincode Lookup
  const handlePincodeLookup = async (codeToSearch) => {
    const targetCode = codeToSearch || pincode;
    if (!targetCode || targetCode.length !== 6) return;
    setPincodeLoading(true);
    try {
      const res = await api.post('/v1/location/pincode-lookup', { pincode: targetCode });
      const data = res.data || res;
      if (data) {
        if (data.city) setCity(data.city);
        if (data.state) setStateName(data.state);
        if (data.district || data.city) setDistrict(data.district || data.city);
        if (data.area && !areaLocality) setAreaLocality(data.area);
        toast.success(`Location auto-fetched: ${data.city || data.area || ''}, ${data.state || ''}`);
      }
    } catch (err) {
      // Ignore if offline
    } finally {
      setPincodeLoading(false);
    }
  };

  // Detect GPS Location
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    const toastId = toast.loading('Detecting your GPS location...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await api.post('/v1/location/reverse-geocode', {
            lat: latitude,
            lng: longitude
          });
          const data = res.data || res;
          
          if (data) {
            if (data.pincode) setPincode(data.pincode);
            if (data.city) setCity(data.city);
            if (data.state) setStateName(data.state);
            if (data.district || data.city) setDistrict(data.district || data.city);
            if (data.area) setAreaLocality(data.area);
            if (data.fullAddress) setFullAddress(data.fullAddress);
            setGoogleMapLocation(`https://www.google.com/maps?q=${latitude},${longitude}`);
            toast.success('GPS Location auto-detected!', { id: toastId });
          } else {
            toast.success('GPS coordinates saved!', { id: toastId });
          }
        } catch (err) {
          setGoogleMapLocation(`https://www.google.com/maps?q=${latitude},${longitude}`);
          toast.success('Coordinates captured successfully', { id: toastId });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        toast.error('Could not detect location. Please type manually.', { id: toastId });
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (pincode && pincode.length === 6) {
      handlePincodeLookup(pincode);
    }
  }, [pincode]);

  // Universal Image Upload Helper
  const handleImageUpload = async (e, setImageState, label) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImageState(previewUrl);

    const toastId = toast.loading(`Uploading ${label || 'image'}...`);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.url || res.data?.data?.url || res.url;
      if (url) {
        setImageState(url);
        toast.success(`${label || 'Image'} uploaded successfully!`, { id: toastId });
      } else {
        toast.success(`${label || 'Image'} ready!`, { id: toastId });
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setImageState(reader.result);
        }
        toast.success(`${label || 'Image'} attached!`, { id: toastId });
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        toast.error('Please keep at least one category selected');
        return;
      }
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
      const subsToRemove = dynamicCategoriesData[cat] || [];
      setSelectedSubCategories(selectedSubCategories.filter(s => !subsToRemove.includes(s)));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
      const newSubs = dynamicCategoriesData[cat] || [];
      if (newSubs.length > 0) {
        setSelectedSubCategories(prev => [...prev, newSubs[0]]);
      }
    }
  };

  const toggleSubCategory = (sub) => {
    if (selectedSubCategories.includes(sub)) {
      setSelectedSubCategories(selectedSubCategories.filter(s => s !== sub));
    } else {
      setSelectedSubCategories([...selectedSubCategories, sub]);
    }
  };

  const filteredCategories = useMemo(() => {
    const allCats = Object.keys(dynamicCategoriesData);
    if (!catSearch) return allCats;
    return allCats.filter(cat => cat.toLowerCase().includes(catSearch.toLowerCase()));
  }, [dynamicCategoriesData, catSearch]);

  const availableSubcategories = useMemo(() => {
    return selectedCategories.flatMap(cat => dynamicCategoriesData[cat] || []);
  }, [dynamicCategoriesData, selectedCategories]);

  const toggleWeeklyOffDay = (day) => {
    let currentDays = weeklyOff === 'None' ? [] : weeklyOff.split(', ').filter(Boolean);
    if (currentDays.includes(day)) {
      currentDays = currentDays.filter(d => d !== day);
    } else {
      currentDays = [...currentDays, day];
    }
    setWeeklyOff(currentDays.length > 0 ? currentDays.join(', ') : 'None');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error('Shop / Business Name is required');
      return;
    }
    if (!mobileNumber.trim()) {
      toast.error('Primary Mobile Number is required');
      return;
    }
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    if (!fullAddress.trim()) {
      toast.error('Full Business Address is required');
      return;
    }
    if (selectedCategories.length === 0) {
      toast.error('Please select at least one Business Category');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the Vendor Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      const vendorProfileData = {
        businessType,
        vendorType,
        shopName: shopName.trim(),
        displayName: displayName.trim() || shopName.trim(),
        categories: selectedCategories,
        category: selectedCategories[0] || 'General',
        subCategories: selectedSubCategories,
        businessDescription: businessDescription.trim(),
        description: businessDescription.trim(),
        shopLogo: shopLogo || '',
        shopCoverImage: shopCoverImage || '',
        coverBanner: shopCoverImage || '',
        mobileNumber: mobileNumber.trim(),
        whatsappNumber: whatsappNumber.trim() || mobileNumber.trim(),
        whatsapp: whatsappNumber.trim() || mobileNumber.trim(),
        email: email.trim(),
        website: website.trim(),
        address: {
          pincode,
          state: stateName,
          district: district || city,
          city,
          areaLocality: areaLocality.trim(),
          fullAddress: fullAddress.trim(),
          address: fullAddress.trim(),
          googleMapLocation
        },
        businessAddress: fullAddress.trim(),
        deliveryService: {
          homeDelivery: {
            enabled: homeDeliveryEnabled,
            freeRadius: homeDeliveryRadius,
            minOrderPrice: Number(homeDeliveryMinOrder) || 0,
            deliveryCharge: Number(homeDeliveryCharge) || 0
          },
          courierByVendor,
          customerVisitShop,
          serviceAtCustomerLocation: {
            enabled: serviceAtCustomerLocation,
            serviceRadius,
            minOrderPrice: Number(serviceMinOrder) || 0
          }
        },
        businessHours: open24x7
          ? 'Open 24/7'
          : `${openingTime} - ${closingTime} (Off: ${weeklyOff})`,
        businessTiming: {
          openingTime: open24x7 ? '00:00 AM' : openingTime,
          closingTime: open24x7 ? '11:59 PM' : closingTime,
          weeklyOff: open24x7 ? 'None' : weeklyOff,
          open24x7
        },
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        verificationStatus: 'unverified',
        createdAt: new Date().toISOString()
      };

      await api.patch('/v1/users/me', {
        profile_pic: shopLogo || user?.profile_pic || undefined,
        avatarUrl: shopLogo || user?.avatarUrl || undefined,
        vendorProfile: vendorProfileData,
        city: city || user?.city || 'Local'
      });

      const roleRes = await addRoleApi({ role: 'vendor', profileData: vendorProfileData }).unwrap();
      const updatedUser = roleRes.user || roleRes.data?.user || roleRes;

      try {
        await api.post('/v1/users/me/switch-role', { role: 'vendor' });
      } catch (e) {}

      dispatch(setCredentials({
        user: {
          ...updatedUser,
          current_role: 'vendor',
          activeRole: 'vendor',
          vendorProfile: vendorProfileData
        }
      }));

      toast.success('🎉 Congratulations! Vendor Storefront registered successfully!');
      navigate('/vendor/dashboard', { replace: true });
    } catch (err) {
      console.error('Vendor registration failed:', err);
      toast.error(err?.data?.message || 'Failed to register vendor profile. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans p-2 sm:p-4 min-h-screen pb-16">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-2xl border-2 border-[#241b15] shadow-premium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            GROW YOUR LOCAL STOREFRONT &amp; REELS
          </span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            REGISTER AS A BIZREELS VENDOR
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Showcase products &amp; services to verified local customers, publish promotional reels, receive inquiries, and grow your local market presence.
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a] shadow-md">
          <FiBriefcase size={22} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BUSINESS MODEL & CATALOG TYPE */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">1</span>
              <div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                  BUSINESS MODEL &amp; CATALOG TYPE
                </h3>
                <p className="text-[11px] text-slate-500">Select what you sell and your commercial operation format</p>
              </div>
            </div>

            {/* Catalog Type Pills */}
            <div className="flex bg-[#f8f4ec] p-1 rounded-xl border border-[#e3dccb] gap-1">
              {[
                { id: 'both', label: 'Products & Services' },
                { id: 'product', label: 'Products Only' },
                { id: 'service', label: 'Services Only' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setVendorType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    vendorType === t.id
                      ? 'bg-[#241b15] text-[#d99a3d] shadow-xs'
                      : 'text-slate-600 hover:text-[#1a1a1a]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {BUSINESS_TYPES.map((bt) => {
              const selected = businessType === bt.id;
              return (
                <div
                  key={bt.id}
                  onClick={() => setBusinessType(bt.id)}
                  className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    selected
                      ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs scale-[1.01]'
                      : 'bg-[#f8f4ec] border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-extrabold">{bt.label}</span>
                    {selected && <FiCheck className="text-[#d99a3d]" size={15} />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{bt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: SHOP IDENTITY & BRANDING */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">2</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                STORE IDENTITY, LOGO &amp; BANNER
              </h3>
              <p className="text-[11px] text-slate-500">Add shop title, logo photo, cover banner and description</p>
            </div>
          </div>

          {/* Photo & Banner Upload Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb]">
            {/* Shop Logo */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white border-2 border-[#e3dccb] overflow-hidden flex items-center justify-center relative shrink-0 shadow-xs">
                {shopLogo ? (
                  <img src={resolveMediaUrl(shopLogo)} alt="Shop Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FiCamera size={22} />
                    <span className="text-[9px] font-bold mt-1">NO LOGO</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                  Shop Logo / Profile Photo
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#241b15] text-[#d99a3d] text-xs font-bold rounded-lg hover:bg-[#342820] transition cursor-pointer">
                    <FiCamera size={13} />
                    <span>{shopLogo ? 'Change Photo' : 'Upload Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setShopLogo, 'Shop Logo')}
                    />
                  </label>
                  {shopLogo && (
                    <button
                      type="button"
                      onClick={() => setShopLogo('')}
                      className="text-xs font-bold text-rose-500 hover:underline px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Square PNG or JPG image (Max 5MB)</p>
              </div>
            </div>

            {/* Shop Cover Banner */}
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-2xl bg-white border-2 border-[#e3dccb] overflow-hidden flex items-center justify-center relative shrink-0 shadow-xs">
                {shopCoverImage ? (
                  <img src={resolveMediaUrl(shopCoverImage)} alt="Cover Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <FiImage size={22} />
                    <span className="text-[9px] font-bold mt-1">NO BANNER</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 flex-1">
                <label className="text-[10px] font-extrabold text-slate-700 uppercase tracking-wider block">
                  Cover Banner <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e3dccb] text-[#1a1a1a] text-xs font-bold rounded-lg hover:bg-slate-50 transition cursor-pointer">
                    <FiImage size={13} />
                    <span>{shopCoverImage ? 'Change Banner' : 'Upload Banner'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(e, setShopCoverImage, 'Cover Banner')}
                    />
                  </label>
                  {shopCoverImage && (
                    <button
                      type="button"
                      onClick={() => setShopCoverImage('')}
                      className="text-xs font-bold text-rose-500 hover:underline px-2 py-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-slate-500">Storefront header background banner</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Shop / Business Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Kumar Electronics & Mobiles"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Display Name / Brand Title
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Kumar Electronics Raipur"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
              Shop Description &amp; Specialty Offerings
            </label>
            <textarea
              rows={3}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Tell buyers about your shop, top selling brands, best warranty, fast delivery, doorstep repairs..."
              className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-3.5 text-xs font-medium text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all resize-none"
            />
          </div>
        </div>

        {/* SECTION 3: CATEGORIES & SUBCATEGORIES SELECTION */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">3</span>
              <div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                  BUSINESS CATEGORIES &amp; SERVICES
                </h3>
                <p className="text-[11px] text-slate-500">Pick all product categories and sub-services you provide</p>
              </div>
            </div>

            {/* Category Search Input */}
            {!categoriesLoading && !categoriesError && filteredCategories.length > 0 && (
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  placeholder="Search category..."
                  className="pl-8 pr-3 py-1.5 text-xs font-semibold bg-[#f8f4ec] border border-[#e3dccb] rounded-lg focus:outline-none focus:border-[#d99a3d]"
                />
              </div>
            )}
          </div>

          {/* SKELETON SHIMMER LOADER */}
          {categoriesLoading ? (
            <div className="space-y-4 py-2">
              <div className="space-y-2.5">
                <div className="h-3 w-44 bg-slate-200 animate-pulse rounded"></div>
                <div className="flex flex-wrap gap-2.5">
                  {[130, 160, 120, 150, 140, 170, 110, 145].map((w, i) => (
                    <div
                      key={i}
                      style={{ width: `${w}px` }}
                      className="h-10 rounded-xl bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse border border-slate-200 flex items-center px-3.5 gap-2"
                    >
                      <div className="w-3.5 h-3.5 rounded bg-slate-300"></div>
                      <div className="h-2.5 bg-slate-300 rounded flex-1"></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 pt-3 border-t border-[#e3dccb]/60">
                <div className="h-3 w-36 bg-slate-200 animate-pulse rounded"></div>
                <div className="flex flex-wrap gap-2">
                  {[90, 110, 125, 95, 105, 115, 85].map((w, i) => (
                    <div
                      key={i}
                      style={{ width: `${w}px` }}
                      className="h-8 rounded-lg bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-pulse border border-slate-200"
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          ) : categoriesError ? (
            /* ERROR STATE WITH RETRY */
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-rose-700 font-bold">
                <FiAlertCircle size={16} />
                <span>Could not load categories from database.</span>
              </div>
              <button
                type="button"
                onClick={() => refetchCategories()}
                className="px-3.5 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <FiRefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            /* EMPTY STATE */
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium">
              No categories found for this vendor type. Please select another business model or contact support.
            </div>
          ) : (
            /* DYNAMIC CATEGORIES GRID */
            <>
              <div className="space-y-3">
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block">
                  Primary Business Categories (Click to select multiple):
                </label>
                <div className="flex flex-wrap gap-2">
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                          isSelected
                            ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                            : 'bg-[#f8f4ec] text-[#1a1a1a] border-[#e3dccb] hover:bg-slate-100'
                        }`}
                      >
                        <FiLayers size={13} className={isSelected ? 'text-[#d99a3d]' : 'text-slate-500'} />
                        <span>{cat}</span>
                        {isSelected && <FiCheck className="text-[#d99a3d]" size={14} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategories Selector */}
              {availableSubcategories.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-[#e3dccb]">
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block">
                    Target Subcategories / Offerings:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSubcategories.map((sub) => {
                      const isSelected = selectedSubCategories.includes(sub);
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => toggleSubCategory(sub)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#d99a3d] font-bold shadow-xs'
                              : 'bg-white text-slate-700 border-[#e3dccb] hover:bg-slate-50'
                          }`}
                        >
                          <FiTag size={11} />
                          <span>{sub}</span>
                          {isSelected && <FiCheck size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* SECTION 4: CONTACT DETAILS & CHANNELS */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">4</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                CONTACT CHANNELS &amp; SOCIAL PRESENCE
              </h3>
              <p className="text-[11px] text-slate-500">Provide direct communication links for customers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Primary Calling Mobile Number *
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="10-digit primary phone"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                WhatsApp Chat Number
              </label>
              <div className="relative">
                <FiMessageSquare className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="WhatsApp number for inquiries"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Business Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@yourbusiness.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Website / Online Catalog Link
              </label>
              <div className="relative">
                <FiGlobe className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourstore.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: PHYSICAL STORE ADDRESS & GPS */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">5</span>
              <div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                  PHYSICAL STORE ADDRESS &amp; LOCATION
                </h3>
                <p className="text-[11px] text-slate-500">Pinpoint your shop so nearby customers can navigate to you</p>
              </div>
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="px-3.5 py-1.5 bg-[#241b15] text-[#d99a3d] text-xs font-bold rounded-xl hover:bg-[#342820] transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FiNavigation className={detectingLocation ? 'animate-spin' : ''} size={13} />
              <span>{detectingLocation ? 'Detecting GPS...' : 'Auto-Detect Location (GPS)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Pincode * {pincodeLoading && <span className="text-[#d99a3d] font-bold animate-pulse">(fetching...)</span>}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit PIN"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                City / Location *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Indore, Raipur, Durg"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Indore"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="e.g. Madhya Pradesh"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Area / Locality / Market Name
              </label>
              <input
                type="text"
                value={areaLocality}
                onChange={(e) => setAreaLocality(e.target.value)}
                placeholder="e.g. Near City Mall, Main Market, MG Road"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                Google Maps Link / Coordinates
              </label>
              <input
                type="text"
                value={googleMapLocation}
                onChange={(e) => setGoogleMapLocation(e.target.value)}
                placeholder="https://maps.google.com/..."
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl px-4 py-2.5 text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
              Full Physical Business Address *
            </label>
            <textarea
              rows={2}
              required
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Shop No., Floor, Building Name, Street / Landmark, Pin Code..."
              className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-3.5 text-xs font-medium text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all resize-none"
            />
          </div>
        </div>

        {/* SECTION 6: DELIVERY & SERVICE RADIUS */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">6</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                DELIVERY MODES &amp; SERVICE RADIUS
              </h3>
              <p className="text-[11px] text-slate-500">Configure how buyers receive your goods and services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Home Delivery Card */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiTruck className="text-[#d99a3d] w-5 h-5" />
                  <span className="text-xs font-extrabold text-[#1a1a1a] uppercase">Local Home Delivery</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={homeDeliveryEnabled}
                    onChange={(e) => setHomeDeliveryEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#241b15]"></div>
                </label>
              </div>

              {homeDeliveryEnabled && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#e3dccb]">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Max Radius</label>
                    <input
                      type="text"
                      value={homeDeliveryRadius}
                      onChange={(e) => setHomeDeliveryRadius(e.target.value)}
                      placeholder="e.g. 5 km"
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      value={homeDeliveryMinOrder}
                      onChange={(e) => setHomeDeliveryMinOrder(e.target.value)}
                      placeholder="200"
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Delivery Fee (₹)</label>
                    <input
                      type="number"
                      value={homeDeliveryCharge}
                      onChange={(e) => setHomeDeliveryCharge(e.target.value)}
                      placeholder="30"
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1a1a1a]"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* On-Site / Doorstep Service Card */}
            <div className="bg-[#f8f4ec] p-4 sm:p-5 rounded-2xl border border-[#e3dccb] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FiCompass className="text-[#d99a3d] w-5 h-5" />
                  <span className="text-xs font-extrabold text-[#1a1a1a] uppercase">Doorstep / On-Site Service</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceAtCustomerLocation}
                    onChange={(e) => setServiceAtCustomerLocation(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#241b15]"></div>
                </label>
              </div>

              {serviceAtCustomerLocation && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e3dccb]">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Service Radius</label>
                    <input
                      type="text"
                      value={serviceRadius}
                      onChange={(e) => setServiceRadius(e.target.value)}
                      placeholder="e.g. 15 km"
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1a1a1a]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Min Booking (₹)</label>
                    <input
                      type="number"
                      value={serviceMinOrder}
                      onChange={(e) => setServiceMinOrder(e.target.value)}
                      placeholder="500"
                      className="w-full bg-white border border-[#e3dccb] rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#1a1a1a]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={customerVisitShop}
                onChange={(e) => setCustomerVisitShop(e.target.checked)}
                className="w-4 h-4 rounded text-[#241b15] focus:ring-[#d99a3d]"
              />
              <span>In-Store Walk-in / Customer Visit Allowed</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={courierByVendor}
                onChange={(e) => setCourierByVendor(e.target.checked)}
                className="w-4 h-4 rounded text-[#241b15] focus:ring-[#d99a3d]"
              />
              <span>All-India Courier / Parcel Shipping Available</span>
            </label>
          </div>
        </div>

        {/* SECTION 7: BUSINESS TIMING & WORKING HOURS */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">7</span>
              <div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                  BUSINESS TIMING &amp; WEEKLY OFF
                </h3>
                <p className="text-[11px] text-slate-500">Show buyers your open business hours and off days</p>
              </div>
            </div>

            {/* 24x7 Toggle */}
            <div className="flex items-center gap-2 bg-[#f8f4ec] px-3 py-1.5 rounded-xl border border-[#e3dccb]">
              <span className="text-[11px] font-bold text-[#1a1a1a] uppercase">Open 24×7</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={open24x7}
                  onChange={(e) => setOpen24x7(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#241b15]"></div>
              </label>
            </div>
          </div>

          {!open24x7 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                  Opening Time
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    placeholder="09:00 AM"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-1">
                  Closing Time
                </label>
                <div className="relative">
                  <FiClock className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    placeholder="09:00 PM"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Weekly Off Selector */}
          <div>
            <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-widest block mb-2">
              Weekly Off Day(s):
            </label>
            <div className="flex flex-wrap gap-2">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                const isSelected = weeklyOff !== 'None' && weeklyOff.split(', ').includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWeeklyOffDay(day)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:bg-slate-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setWeeklyOff('None')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  weeklyOff === 'None'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-[#f8f4ec] text-slate-700 border-[#e3dccb] hover:bg-slate-100'
                }`}
              >
                Open 7 Days (No Weekly Off)
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 8: DECLARATION & TERMS */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#241b15] focus:ring-[#d99a3d] border-[#e3dccb]"
            />
            <span className="text-xs text-slate-700 leading-relaxed font-medium">
              I declare that all business information, prices, and address provided above are genuine and accurate. I agree to adhere to the{' '}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }}
                className="font-extrabold text-[#d99a3d] underline cursor-pointer inline bg-transparent border-none p-0"
              >
                BizReels Vendor Terms of Service &amp; Community Policy
              </button>.
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-4 bg-[#241b15] text-[#d99a3d] border-2 border-[#241b15] rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-premium hover:bg-[#342820] transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          <span>{loading ? 'Launching Vendor Portal...' : 'Register Storefront & Launch Vendor Portal'}</span>
          <FiArrowRight size={18} />
        </button>
      </form>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto border border-[#e3dccb] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-base uppercase text-[#1a1a1a]">
                BIZREELS VENDOR TERMS &amp; POLICY
              </h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <p>
                <strong>1. Accurate Product &amp; Price Listings:</strong> Vendors must ensure that prices, warranties, and stock availability displayed on reels and product cards are authentic.
              </p>
              <p>
                <strong>2. Prompt Inquiry Response:</strong> Direct chat messages and customer requirements should be answered in a timely and professional manner.
              </p>
              <p>
                <strong>3. Delivery &amp; Quality Commitment:</strong> If home delivery or doorstep services are promised, the vendor is responsible for on-time fulfillment according to agreed rates.
              </p>
              <p>
                <strong>4. Community Safety:</strong> Posting prohibited goods, counterfeit products, or deceptive marketing reels is strictly prohibited and leads to immediate store deactivation.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#e3dccb]">
              <button
                onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }}
                className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] font-bold text-xs rounded-xl hover:bg-[#342820] transition"
              >
                Accept &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
