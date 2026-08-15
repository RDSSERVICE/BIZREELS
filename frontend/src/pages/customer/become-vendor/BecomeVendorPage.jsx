import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiBriefcase, FiCheckCircle, FiDollarSign, FiFileText, FiMapPin,
  FiCreditCard, FiArrowRight, FiShield, FiUser, FiTruck, FiClock,
  FiUploadCloud, FiSearch, FiCheck, FiGlobe, FiPhone, FiMessageSquare,
  FiMail, FiCamera, FiImage, FiCompass
} from 'react-icons/fi';
import { useAddRoleMutation } from '../../../features/auth/authApi';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import { setCredentials, selectCurrentUser } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api } from '../../../lib/api';

const BUSINESS_TYPES = [
  { id: 'Individual Seller', label: 'Individual Seller', desc: 'Single owner selling items or products' },
  { id: 'Business/Firm', label: 'Business / Firm', desc: 'Registered company, LLC, or private firm' },
  { id: 'Service Provider', label: 'Service Provider', desc: 'Repairs, salon, cleaning, consulting, etc.' },
  { id: 'Manufacturer', label: 'Manufacturer', desc: 'Factory, production unit, craft maker' },
  { id: 'Wholesaler', label: 'Wholesaler', desc: 'Bulk quantity sales to retailers & businesses' },
  { id: 'Retailer', label: 'Retailer', desc: 'Local shop, showroom, boutique store' },
  { id: 'Distributor', label: 'Distributor', desc: 'Regional or city distribution agent' },
  { id: 'Freelancer', label: 'Freelancer', desc: 'Independent contractor or creative professional' },
];


// Time translation helpers
const format24to12 = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hour = parseInt(parts[0], 10);
  const min = parts[1];
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  hour = hour ? hour : 12;
  return `${hour.toString().padStart(2, '0')}:${min} ${ampm}`;
};

const format12to24 = (timeStr) => {
  if (!timeStr) return '09:00';
  if (!timeStr.includes('AM') && !timeStr.includes('PM')) return timeStr;
  const parts = timeStr.trim().split(/\s+/);
  if (parts.length < 2) return '09:00';
  const ampm = parts[1].toUpperCase();
  const timeSplit = parts[0].split(':');
  if (timeSplit.length < 2) return '09:00';
  let hour = parseInt(timeSplit[0], 10);
  const min = timeSplit[1];
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return `${hour.toString().padStart(2, '0')}:${min}`;
};

export default function BecomeVendorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [addRoleApi] = useAddRoleMutation();

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  // 1. Business Type & Vendor Type
  const [businessType, setBusinessType] = useState('Retailer');
  const [vendorType, setVendorType] = useState('both'); // 'product', 'service', 'both'

  // 2. Shop / Business Info
  const [shopName, setShopName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const { data: categoriesDataRes } = useListCategoriesQuery();
  const categoriesList = categoriesDataRes?.items || [];

  const dynamicCategoriesData = React.useMemo(() => {
    const data = {};
    const parents = categoriesList.filter(c => {
      if (c.parent_id) return false;
      if (vendorType === 'product') {
        return c.category_type === 'product' || !c.category_type;
      }
      if (vendorType === 'service') {
        return c.category_type === 'service' || !c.category_type;
      }
      return true;
    });
    const children = categoriesList.filter(c => c.parent_id);

    parents.forEach(parent => {
      const parentName = parent.name;
      const subcategories = children
        .filter(child => child.parent_id === parent.id)
        .map(child => child.name);
      data[parentName] = subcategories;
    });

    return data;
  }, [categoriesList, vendorType]);

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);

  // States for searchable dropdowns & terms modal
  const [catSearch, setCatSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [showSubDropdown, setShowSubDropdown] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Reset category selections when vendorType changes to prevent cross-type garbage data
  useEffect(() => {
    setSelectedCategories([]);
    setSelectedSubCategories([]);
    setCatSearch('');
    setSubSearch('');
  }, [vendorType]);

  const [businessDescription, setBusinessDescription] = useState('');
  const [shopLogo, setShopLogo] = useState('');
  const [shopCoverImage, setShopCoverImage] = useState('');

  // 3. Contact Info
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState('');

  // 4. Business Address
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [googleMapLocation, setGoogleMapLocation] = useState('');

  // 5. Delivery & Service Area
  const [homeDeliveryEnabled, setHomeDeliveryEnabled] = useState(true);
  const [homeDeliveryRadius, setHomeDeliveryRadius] = useState('5 km');
  const [homeDeliveryMinOrder, setHomeDeliveryMinOrder] = useState('200');
  const [homeDeliveryCharge, setHomeDeliveryCharge] = useState('30');

  const [courierByVendor, setCourierByVendor] = useState(true);
  const [customerVisitShop, setCustomerVisitShop] = useState(true);

  const [serviceAtCustomerLocation, setServiceAtCustomerLocation] = useState(false);
  const [serviceRadius, setServiceRadius] = useState('10 km');
  const [serviceMinOrder, setServiceMinOrder] = useState('500');

  // 6. Business Timing
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [weeklyOff, setWeeklyOff] = useState('Sunday');
  const [open24x7, setOpen24x7] = useState(false);

  const toggleWeeklyOffDay = (day) => {
    let currentDays = weeklyOff === 'None' ? [] : weeklyOff.split(', ').filter(Boolean);
    if (currentDays.includes(day)) {
      currentDays = currentDays.filter(d => d !== day);
    } else {
      currentDays = [...currentDays, day];
    }
    setWeeklyOff(currentDays.length > 0 ? currentDays.join(', ') : 'None');
  };

  // 7. Terms Declaration
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Pincode auto-lookup
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
        toast.success(`Location auto-fetched: ${data.city || data.area}, ${data.state}`);
      }
    } catch (err) {
      toast.error('Could not auto-fetch pincode data. Please enter address manually.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setDetectingLocation(true);
    const toastId = toast.loading('Detecting your current location...');

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
            toast.success('Location auto-detected successfully!', { id: toastId });
          } else {
            toast.error('Unable to fetch location details.', { id: toastId });
          }
        } catch (err) {
          toast.error('Failed to resolve address from coordinates.', { id: toastId });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        let msg = 'Failed to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          msg = 'Location permission denied by user.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = 'Location information is unavailable.';
        } else if (error.code === error.TIMEOUT) {
          msg = 'Location request timed out.';
        }
        toast.error(msg, { id: toastId });
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

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
      // Auto-remove subcategories of the removed category
      const subsToRemove = dynamicCategoriesData[cat] || [];
      setSelectedSubCategories(selectedSubCategories.filter(s => !subsToRemove.includes(s)));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleSubCategory = (sub) => {
    if (selectedSubCategories.includes(sub)) {
      setSelectedSubCategories(selectedSubCategories.filter(s => s !== sub));
    } else {
      setSelectedSubCategories([...selectedSubCategories, sub]);
    }
  };

  const filteredCategories = React.useMemo(() => {
    const allCats = Object.keys(dynamicCategoriesData);
    if (!catSearch) return allCats;
    return allCats.filter(cat => cat.toLowerCase().includes(catSearch.toLowerCase()));
  }, [dynamicCategoriesData, catSearch]);

  const availableSubcategories = React.useMemo(() => {
    return selectedCategories.flatMap(cat => dynamicCategoriesData[cat] || []);
  }, [dynamicCategoriesData, selectedCategories]);

  const filteredSubcategories = React.useMemo(() => {
    if (!subSearch) return availableSubcategories;
    return availableSubcategories.filter(sub => sub.toLowerCase().includes(subSearch.toLowerCase()));
  }, [availableSubcategories, subSearch]);

  // Image upload helper
  const handleImageUpload = async (e, setImageState) => {
    const file = e.target.files[0];
    if (!file) return;

    const toastId = toast.loading('Uploading image...');
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const url = res.data?.url || res.data?.data?.url || res.url;
      if (url) {
        setImageState(url);
        toast.success('Image uploaded successfully!', { id: toastId });
      } else {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageState(reader.result);
          toast.success('Image attached', { id: toastId });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageState(reader.result);
        toast.success('Image attached', { id: toastId });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName) {
      toast.error('Shop / Business Name is required');
      return;
    }
    if (!mobileNumber) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!pincode || pincode.length !== 6) {
      toast.error('Please enter a valid 6-digit PIN code');
      return;
    }
    if (!fullAddress) {
      toast.error('Full Business Address is required');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the Vendor Declaration & Terms & Conditions');
      return;
    }

    if (selectedCategories.length === 0) {
      toast.error('Please select at least one business category');
      return;
    }

    setLoading(true);
    try {
      const vendorProfileData = {
        businessType,
        vendorType, // Save selected vendor type (product/service/both)
        shopName,
        displayName: displayName || shopName,
        categories: selectedCategories,
        subCategories: selectedSubCategories,
        businessDescription,
        shopLogo,
        shopCoverImage,
        mobileNumber,
        whatsappNumber: whatsappNumber || mobileNumber,
        email,
        website,
        address: {
          pincode,
          state: stateName,
          district: district || city,
          city,
          areaLocality,
          fullAddress,
          googleMapLocation
        },
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
        contactVerified: {
          mobile: true,
          whatsapp: false,
          email: !!email,
          website: false
        },
        createdAt: new Date().toISOString()
      };

      // 1. Update Profile in backend
      await api.patch('/v1/users/me', {
        vendorProfile: vendorProfileData,
        city: city || user?.city || 'Local'
      });

      // 2. Add 'vendor' role
      const roleRes = await addRoleApi({ role: 'vendor', profileData: vendorProfileData }).unwrap();
      const updatedUser = roleRes.user || roleRes.data?.user || roleRes;

      // 3. Switch active role to 'vendor'
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

      toast.success('🎉 Congratulations! Your Vendor Portal is launched successfully!');
      navigate('/vendor/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to register vendor profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiBriefcase}
        title="Become a Verified Vendor"
        subtitle="Launch your online business storefront, showcase products & services, post boosted reels, receive direct inquiries, and manage orders on BizReels."
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: BUSINESS TYPE */}
        <div className="glass rounded-2xl p-4 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-brand-purple text-white flex items-center justify-center font-bold text-sm shadow-md">1</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Business Type</h3>
              <p className="text-xs text-text-tertiary">Select the model that best describes your commercial operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {BUSINESS_TYPES.map((bt) => {
              const selected = businessType === bt.id;
              return (
                <div
                  key={bt.id}
                  onClick={() => setBusinessType(bt.id)}
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    selected
                      ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm'
                      : 'bg-surface border-border hover:border-brand-purple/50 text-text-secondary'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text-primary">{bt.label}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? 'border-brand-purple bg-brand-purple text-white' : 'border-border'}`}>
                      {selected && <FiCheck className="w-2.5 h-2.5" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-text-tertiary leading-tight">{bt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: SHOP / BUSINESS INFORMATION */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-5">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-brand-pink text-white flex items-center justify-center font-bold text-sm shadow-md">2</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Shop & Business Information</h3>
              <p className="text-xs text-text-tertiary">Your storefront branding, categories, and images</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Shop / Business Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Trends Boutique Store"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Display Name (Optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Trends Retail Store"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>
          </div>

          {/* Vendor Type Selection */}
          <div className="border-t border-border pt-4">
            <label className="block text-xs font-bold text-text-secondary mb-2">Vendor Type (Product / Service / Both) *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'product', label: 'Product Vendor', desc: 'Offers categories related to goods and products' },
                { id: 'service', label: 'Service Provider', desc: 'Offers categories related to local and specialized services' },
                { id: 'both', label: 'Product & Service', desc: 'Offers both product and service categories' },
              ].map((vt) => {
                const selected = vendorType === vt.id;
                return (
                  <div
                    key={vt.id}
                    onClick={() => setVendorType(vt.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      selected
                        ? 'bg-brand-purple/10 border-brand-purple text-brand-purple shadow-sm'
                        : 'bg-surface border-border hover:border-brand-purple/50 text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-text-primary">{vt.label}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? 'border-brand-purple bg-brand-purple text-white' : 'border-border'}`}>
                        {selected && <FiCheck className="w-2.5 h-2.5" />}
                      </div>
                    </div>
                    <p className="text-[10px] text-text-tertiary leading-tight">{vt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories Searchable Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-text-secondary mb-2 flex justify-between items-center">
              <span>Business Category (Select all that apply) *</span>
              {selectedCategories.length > 0 && (
                <span className="text-[10px] text-text-tertiary">Selected: {selectedCategories.length}</span>
              )}
            </label>
            
            {/* Selected category tags */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-purple/10 border border-brand-purple/20 text-brand-purple rounded-xl text-xs font-bold"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="text-brand-purple hover:text-red-500 font-bold focus:outline-none ml-1 text-sm"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Searchable input control */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="text-text-tertiary w-4 h-4" />
              </div>
              <input
                type="text"
                value={catSearch}
                onChange={(e) => {
                  setCatSearch(e.target.value);
                  setShowCatDropdown(true);
                }}
                onFocus={() => setShowCatDropdown(true)}
                placeholder="Search categories..."
                className="w-full pl-9 pr-10 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary text-xs"
              >
                ▼
              </button>
            </div>

            {/* Dropdown Options */}
            {showCatDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowCatDropdown(false)} />
                <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-surface border border-border rounded-xl shadow-premium z-40 p-2 space-y-1 animate-fade-in">
                  {filteredCategories.length === 0 ? (
                    <p className="text-xs text-text-tertiary p-3 text-center">No matching categories found</p>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <div
                          key={cat}
                          onClick={() => {
                            toggleCategory(cat);
                            setCatSearch('');
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-brand-purple/10 text-brand-purple'
                              : 'hover:bg-surface-secondary text-text-secondary'
                          }`}
                        >
                          <span>{cat}</span>
                          {isSelected && <FiCheck className="w-3.5 h-3.5 text-brand-purple" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          {/* Sub Categories Searchable Dropdown */}
          <div className="relative">
            <label className="block text-xs font-semibold text-text-secondary mb-2 flex justify-between items-center">
              <span>Sub Category (Select all that apply)</span>
              {selectedSubCategories.length > 0 && (
                <span className="text-[10px] text-text-tertiary">Selected: {selectedSubCategories.length}</span>
              )}
            </label>

            {/* Selected subcategory tags */}
            {selectedSubCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedSubCategories.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-brand-pink/10 border border-brand-pink/20 text-brand-pink rounded-xl text-xs font-semibold"
                  >
                    {sub}
                    <button
                      type="button"
                      onClick={() => toggleSubCategory(sub)}
                      className="text-brand-pink hover:text-red-500 font-bold focus:outline-none ml-1 text-sm"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Searchable input control */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <FiSearch className="text-text-tertiary w-4 h-4" />
              </div>
              <input
                type="text"
                disabled={selectedCategories.length === 0}
                value={subSearch}
                onChange={(e) => {
                  setSubSearch(e.target.value);
                  setShowSubDropdown(true);
                }}
                onFocus={() => setShowSubDropdown(true)}
                placeholder={selectedCategories.length === 0 ? "Please select a category first" : "Search subcategories..."}
                className="w-full pl-9 pr-10 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all disabled:opacity-50"
              />
              <button
                type="button"
                disabled={selectedCategories.length === 0}
                onClick={() => setShowSubDropdown(!showSubDropdown)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary text-xs disabled:opacity-50"
              >
                ▼
              </button>
            </div>

            {/* Dropdown Options */}
            {showSubDropdown && selectedCategories.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSubDropdown(false)} />
                <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-surface border border-border rounded-xl shadow-premium z-40 p-2 space-y-1 animate-fade-in">
                  {filteredSubcategories.length === 0 ? (
                    <p className="text-xs text-text-tertiary p-3 text-center">No matching subcategories found</p>
                  ) : (
                    filteredSubcategories.map((sub) => {
                      const isSelected = selectedSubCategories.includes(sub);
                      return (
                        <div
                          key={sub}
                          onClick={() => {
                            toggleSubCategory(sub);
                            setSubSearch('');
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-brand-pink/10 text-brand-pink font-semibold'
                              : 'hover:bg-surface-secondary text-text-secondary'
                          }`}
                        >
                          <span>{sub}</span>
                          {isSelected && <FiCheck className="w-3.5 h-3.5 text-brand-pink" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Business Description</label>
            <textarea
              rows={3}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Describe your products, services, specialization, and offerings..."
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>

          {/* Shop Logo & Cover Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Shop Logo</label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-2xl border border-dashed border-border bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
                  {shopLogo ? (
                    <img src={shopLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <FiCamera className="w-6 h-6 text-text-tertiary" />
                  )}
                </div>
                <label className="cursor-pointer px-3.5 py-2 glass border border-border rounded-xl text-xs font-bold text-brand-purple hover:bg-brand-purple/5 transition flex items-center gap-2">
                  <FiUploadCloud size={14} /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setShopLogo)} />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Shop Cover Image</label>
              <div className="flex items-center gap-3">
                <div className="w-24 h-16 rounded-2xl border border-dashed border-border bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
                  {shopCoverImage ? (
                    <img src={shopCoverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <FiImage className="w-6 h-6 text-text-tertiary" />
                  )}
                </div>
                <label className="cursor-pointer px-3.5 py-2 glass border border-border rounded-xl text-xs font-bold text-brand-purple hover:bg-brand-purple/5 transition flex items-center gap-2">
                  <FiUploadCloud size={14} /> Upload Cover
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setShopCoverImage)} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: CONTACT INFORMATION */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md">3</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Contact Information</h3>
              <p className="text-xs text-text-tertiary">Direct contact channels for customer leads and inquiries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Mobile Number *</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-text-secondary">WhatsApp Number</label>
                <button
                  type="button"
                  onClick={() => setWhatsappNumber(mobileNumber)}
                  className="text-[10px] text-brand-purple font-bold hover:underline"
                >
                  Same as Mobile
                </button>
              </div>
              <div className="relative">
                <FiMessageSquare className="absolute left-3 top-3 text-emerald-500 w-4 h-4" />
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. info@trendsstore.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Website (Optional)</label>
              <div className="relative">
                <FiGlobe className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://www.trendsstore.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: BUSINESS ADDRESS & PINCODE AUTO-LOOKUP */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md">4</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Business Address & Map Location</h3>
              <p className="text-xs text-text-tertiary">Type PIN code to auto-fetch State, District, & City</p>
            </div>
          </div>

          {/* Detect Current Location Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-brand-purple/5 border border-brand-purple/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-purple/10 flex items-center justify-center text-brand-purple flex-shrink-0 animate-pulse">
                <FiCompass className={`w-5 h-5 ${detectingLocation ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-text-primary">Auto-Detect Business Location</h4>
                <p className="text-[10px] text-text-tertiary">Detect coordinates and address automatically via browser GPS</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-brand-purple/90 active:scale-95 transition-all disabled:opacity-50 flex-shrink-0"
            >
              {detectingLocation ? 'Detecting...' : 'Detect Current Location'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">PIN Code *</label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="6-Digit PIN Code"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">City / Town</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Auto-fetched or enter City"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District Name"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">State</label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="State Name"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Area / Locality</label>
              <input
                type="text"
                value={areaLocality}
                onChange={(e) => setAreaLocality(e.target.value)}
                placeholder="e.g. Commercial Hub, Main Market"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Google Maps Location Link / Pin</label>
              <div className="relative">
                <FiCompass className="absolute left-3 top-3 text-brand-purple w-4 h-4" />
                <input
                  type="text"
                  value={googleMapLocation}
                  onChange={(e) => setGoogleMapLocation(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Full Address *</label>
            <textarea
              required
              rows={2}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Shop No., Floor, Building Name, Street Address, Landmark..."
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
            />
          </div>
        </div>

        {/* SECTION 5: DELIVERY & SERVICE AREA */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-5">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md">5</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Delivery & Service Area Setup</h3>
              <p className="text-xs text-text-tertiary">Configure how customer orders and service calls are fulfilled</p>
            </div>
          </div>

          {/* Home Delivery */}
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FiTruck className="w-5 h-5 text-brand-purple" />
                <div>
                  <h4 className="text-xs font-bold text-text-primary">Home Delivery</h4>
                  <p className="text-[10px] text-text-tertiary">Deliver products directly to customer doorstep</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={homeDeliveryEnabled}
                  onChange={(e) => setHomeDeliveryEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
              </label>
            </div>

            {homeDeliveryEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-border/60">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Free Delivery Radius</label>
                  <select
                    value={homeDeliveryRadius}
                    onChange={(e) => setHomeDeliveryRadius(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-primary"
                  >
                    <option value="500 mtr">500 mtr</option>
                    <option value="1 km">1 km</option>
                    <option value="2 km">2 km</option>
                    <option value="5 km">5 km</option>
                    <option value="10 km">10 km</option>
                    <option value="15 km">15 km</option>
                    <option value="20 km+">20 km+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Min Order for Free Delivery (₹)</label>
                  <input
                    type="number"
                    value={homeDeliveryMinOrder}
                    onChange={(e) => setHomeDeliveryMinOrder(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-primary"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Delivery Charge Outside Radius (₹)</label>
                  <input
                    type="number"
                    value={homeDeliveryCharge}
                    onChange={(e) => setHomeDeliveryCharge(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-primary"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Courier by Vendor */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Courier / Parcel Shipping</h4>
                <p className="text-[10px] text-text-tertiary">Ship orders nationwide via courier services</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={courierByVendor}
                  onChange={(e) => setCourierByVendor(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
              </label>
            </div>

            {/* Customer Visit Shop */}
            <div className="p-4 rounded-2xl bg-surface border border-border flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Customer Shop Visit</h4>
                <p className="text-[10px] text-text-tertiary">Allow customers to visit your offline shop directly</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerVisitShop}
                  onChange={(e) => setCustomerVisitShop(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
              </label>
            </div>
          </div>

          {/* Service at Customer Location */}
          <div className="p-4 rounded-2xl bg-surface border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-text-primary">Service at Customer Location</h4>
                <p className="text-[10px] text-text-tertiary">Provide repair, maintenance, or home visits</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceAtCustomerLocation}
                  onChange={(e) => setServiceAtCustomerLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-purple"></div>
              </label>
            </div>

            {serviceAtCustomerLocation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Service Coverage Radius</label>
                  <select
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-primary"
                  >
                    <option value="500 mtr">500 mtr</option>
                    <option value="1 km">1 km</option>
                    <option value="2 km">2 km</option>
                    <option value="5 km">5 km</option>
                    <option value="10 km">10 km</option>
                    <option value="15 km">15 km</option>
                    <option value="25 km+">25 km+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary mb-1">Min Order Request Price (₹)</label>
                  <input
                    type="number"
                    value={serviceMinOrder}
                    onChange={(e) => setServiceMinOrder(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 bg-surface-secondary border border-border rounded-xl text-xs font-semibold text-text-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: BUSINESS TIMING */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-md">6</span>
              <div>
                <h3 className="text-base font-bold text-text-primary font-display">Business Timing & Hours</h3>
                <p className="text-xs text-text-tertiary">Set operating hours and weekly off days</p>
              </div>
            </div>

            {/* 24x7 Toggle */}
            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border">
              <span className="text-xs font-bold text-text-primary">Open 24×7</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={open24x7}
                  onChange={(e) => setOpen24x7(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          {!open24x7 && (
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Opening Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                    <input
                      type="time"
                      value={format12to24(openingTime)}
                      onChange={(e) => setOpeningTime(format24to12(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">Closing Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                    <input
                      type="time"
                      value={format12to24(closingTime)}
                      onChange={(e) => setClosingTime(format24to12(e.target.value))}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-2">Weekly Off Days</label>
                <div className="flex flex-wrap gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                    const isSelected = weeklyOff !== 'None' && weeklyOff.split(', ').includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleWeeklyOffDay(day)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-red-500/10 text-red-500 border-red-500/30'
                            : 'bg-surface hover:bg-surface-tertiary text-text-secondary border-border cursor-pointer'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setWeeklyOff('None')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                      weeklyOff === 'None'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-surface hover:bg-surface-tertiary text-text-secondary border-border cursor-pointer'
                    }`}
                  >
                    Open All Days (No Off)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 7: DECLARATION & TERMS */}
        <div className="glass rounded-2xl p-6 border border-border shadow-card space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-brand-purple focus:ring-brand-purple border-border"
            />
            <span className="text-xs text-text-secondary leading-relaxed">
              I hereby declare that all business details, addresses, and contact numbers provided are true, valid, and authentic. I accept the <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} className="font-bold text-brand-purple underline cursor-pointer hover:text-brand-purple/80">BizReels Vendor Terms & Conditions</span> and Privacy Policy.
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-4 gradient-brand text-white rounded-2xl text-sm font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{loading ? 'Registering & Launching Portal...' : 'Complete Registration & Launch Vendor Portal'}</span>
          <FiArrowRight size={18} />
        </button>
      </form>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-premium animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary font-display">BizReels Vendor Terms & Conditions</h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="text-text-tertiary hover:text-text-primary text-xl font-bold transition-all focus:outline-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-text-secondary leading-relaxed">
              <p className="font-semibold text-text-primary">Welcome to the BizReels Vendor Storefront Program!</p>
              <p>By registering as a vendor on BizReels, you agree to comply with and be bound by the following terms & conditions:</p>
              
              <h4 className="font-bold text-text-primary mt-3">1. Business Legitimacy</h4>
              <p>You guarantee that all commercial details, shop name, address, categories, and documents submitted are correct, legitimate, and belong strictly to your legal entity or storefront.</p>
              
              <h4 className="font-bold text-text-primary mt-3">2. Category Alignment</h4>
              <p>You agree to tag your business storefront only under categories and subcategories in which you are licensed, qualified, and active. Misrepresentation of business type is grounds for account suspension.</p>
              
              <h4 className="font-bold text-text-primary mt-3">3. Quotations & Leads Communication</h4>
              <p>BizReels facilitates leads matching from local customers. When posting quotes or bidding on requirements, you agree to provide authentic and transparent quotes. Unprofessional, spammy, or offensive quotes will lead to penalties.</p>
              
              <h4 className="font-bold text-text-primary mt-3">4. Fees & Wallet Balance</h4>
              <p>Specific vendor tools, premium outreach credits, and lead connections are subject to credit costs/pricing. All credit transactions, deposits, and refunds are governed by the BizReels Wallet guidelines.</p>
              
              <h4 className="font-bold text-text-primary mt-3">5. Delivery & Service Standard</h4>
              <p>Home delivery, services, and offline visits configured in this portal must be fulfilled with utmost customer satisfaction and quality. BizReels does not take direct responsibility for product defects or service disputes.</p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 bg-brand-purple text-white font-bold text-xs rounded-xl hover:bg-brand-purple/90 transition-all shadow-premium"
              >
                Accept & Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
