import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiBriefcase, FiCheckCircle, FiDollarSign, FiFileText, FiMapPin,
  FiCreditCard, FiArrowRight, FiShield, FiUser, FiTruck, FiClock,
  FiUploadCloud, FiSearch, FiCheck, FiGlobe, FiPhone, FiMessageSquare,
  FiMail, FiCamera, FiImage, FiCompass, FiX, FiLayers, FiTag, FiNavigation
} from 'react-icons/fi';
import { useAddRoleMutation, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import { setCredentials, selectCurrentUser } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { api, tokenStore, resolveMediaUrl } from '../../../lib/api';

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

export default function BecomeVendorPage({ isEditMode = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [addRoleApi] = useAddRoleMutation();
  const [updateProfileApi] = useUpdateProfileMutation();

  const isExistingVendor = user?.roles?.includes('vendor') && !!user?.vendorProfile?.shopName;
  const effectiveEditMode = isEditMode || isExistingVendor;

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
  const categoriesList = categoriesDataRes?.items || categoriesDataRes?.categories || (Array.isArray(categoriesDataRes) ? categoriesDataRes : []);

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
        .filter(child => child.parent_id === parent.id || child.parent_id === parent._id)
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
    if (isHydrated) {
      setSelectedCategories([]);
      setSelectedSubCategories([]);
      setCatSearch('');
      setSubSearch('');
    }
  }, [vendorType]);

  const [businessDescription, setBusinessDescription] = useState('');
  const [shopLogo, setShopLogo] = useState(user?.profile_pic || user?.avatarUrl || '');
  const [shopCoverImage, setShopCoverImage] = useState('');

  // 3. Contact Info
  const [mobileNumber, setMobileNumber] = useState(user?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [website, setWebsite] = useState('');

  // 4. Business Address
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('Madhya Pradesh');
  const [district, setDistrict] = useState('Indore');
  const [city, setCity] = useState('Indore');
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
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate form data when user already has vendorProfile (Edit Mode)
  useEffect(() => {
    const vp = user?.vendorProfile;
    if (vp && !isHydrated) {
      if (vp.businessType) setBusinessType(vp.businessType);
      if (vp.vendorType) setVendorType(vp.vendorType);
      if (vp.shopName) setShopName(vp.shopName);
      if (vp.displayName || vp.shopName) setDisplayName(vp.displayName || vp.shopName);
      if (vp.categories && Array.isArray(vp.categories) && vp.categories.length > 0) {
        setSelectedCategories(vp.categories);
      } else if (vp.category) {
        setSelectedCategories([vp.category]);
      }
      if (vp.subCategories && Array.isArray(vp.subCategories)) {
        setSelectedSubCategories(vp.subCategories);
      }
      if (vp.businessDescription || vp.description) {
        setBusinessDescription(vp.businessDescription || vp.description);
      }
      if (vp.shopLogo || user?.profile_pic || user?.avatarUrl) {
        setShopLogo(vp.shopLogo || user?.profile_pic || user?.avatarUrl);
      }
      if (vp.shopCoverImage || vp.coverBanner) {
        setShopCoverImage(vp.shopCoverImage || vp.coverBanner);
      }
      if (vp.mobileNumber || user?.phone) {
        setMobileNumber(vp.mobileNumber || user?.phone);
      }
      if (vp.whatsappNumber || vp.whatsapp || user?.phone) {
        setWhatsappNumber(vp.whatsappNumber || vp.whatsapp || user?.phone);
      }
      if (vp.email || user?.email) {
        setEmail(vp.email || user?.email);
      }
      if (vp.website) {
        setWebsite(vp.website);
      }

      const addr = (typeof vp.address === 'object' && vp.address) ? vp.address : {};
      if (addr.pincode || vp.pincode || user?.location?.pincode) {
        setPincode(addr.pincode || vp.pincode || user?.location?.pincode || '');
      }
      if (addr.state || vp.state || user?.location?.state) {
        setStateName(addr.state || vp.state || user?.location?.state || 'Madhya Pradesh');
      }
      if (addr.district || vp.district || user?.location?.district) {
        setDistrict(addr.district || vp.district || user?.location?.district || 'Indore');
      }
      if (addr.city || vp.city || user?.location?.city) {
        setCity(addr.city || vp.city || user?.location?.city || 'Indore');
      }
      if (addr.areaLocality || addr.area || vp.area) {
        setAreaLocality(addr.areaLocality || addr.area || vp.area || '');
      }
      if (addr.fullAddress || addr.address || vp.businessAddress || user?.location?.address) {
        setFullAddress(addr.fullAddress || addr.address || vp.businessAddress || user?.location?.address || '');
      }
      if (addr.googleMapLocation) {
        setGoogleMapLocation(addr.googleMapLocation);
      }

      if (vp.deliveryService) {
        const ds = vp.deliveryService;
        if (ds.homeDelivery) {
          setHomeDeliveryEnabled(ds.homeDelivery.enabled ?? true);
          if (ds.homeDelivery.freeRadius) setHomeDeliveryRadius(ds.homeDelivery.freeRadius);
          if (ds.homeDelivery.minOrderPrice !== undefined) setHomeDeliveryMinOrder(String(ds.homeDelivery.minOrderPrice));
          if (ds.homeDelivery.deliveryCharge !== undefined) setHomeDeliveryCharge(String(ds.homeDelivery.deliveryCharge));
        }
        if (ds.courierByVendor !== undefined) setCourierByVendor(ds.courierByVendor);
        if (ds.customerVisitShop !== undefined) setCustomerVisitShop(ds.customerVisitShop);
        if (ds.serviceAtCustomerLocation) {
          setServiceAtCustomerLocation(ds.serviceAtCustomerLocation.enabled ?? false);
          if (ds.serviceAtCustomerLocation.serviceRadius) setServiceRadius(ds.serviceAtCustomerLocation.serviceRadius);
          if (ds.serviceAtCustomerLocation.minOrderPrice !== undefined) setServiceMinOrder(String(ds.serviceAtCustomerLocation.minOrderPrice));
        }
      }

      if (vp.businessTiming) {
        const bt = vp.businessTiming;
        if (bt.openingTime) setOpeningTime(bt.openingTime);
        if (bt.closingTime) setClosingTime(bt.closingTime);
        if (bt.weeklyOff) setWeeklyOff(bt.weeklyOff);
        if (bt.open24x7 !== undefined) setOpen24x7(bt.open24x7);
      }

      setTermsAccepted(true);
      setIsHydrated(true);
    }
  }, [user, isHydrated]);

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
  const handleImageUpload = async (e, setImageState, label) => {
    const file = e.target.files[0];
    if (!file) return;

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
        const reader = new FileReader();
        reader.onloadend = () => {
          setImageState(reader.result);
          toast.success(`${label || 'Image'} attached`, { id: toastId });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageState(reader.result);
        toast.success(`${label || 'Image'} attached`, { id: toastId });
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
        ...(user?.vendorProfile || {}),
        businessType,
        vendorType, // Save selected vendor type (product/service/both)
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
        updatedAt: new Date().toISOString()
      };

      if (!vendorProfileData.createdAt) {
        vendorProfileData.createdAt = new Date().toISOString();
      }

      if (effectiveEditMode) {
        // In-place Update Mode: Save profile via updateProfileApi to ensure DB update & cache invalidation
        const payload = {
          profile_pic: shopLogo || user?.profile_pic || undefined,
          avatarUrl: shopLogo || user?.avatarUrl || undefined,
          vendorProfile: vendorProfileData,
          city: city || user?.city || 'Local',
          location: {
            type: 'Point',
            coordinates: user?.location?.coordinates || [75.8577, 22.7196],
            state: stateName,
            district: district || city,
            city,
            pincode,
            address: fullAddress.trim()
          }
        };

        const res = await updateProfileApi(payload).unwrap();
        const updatedUser = res.user || res.data?.user || res.data || res;

        if (updatedUser) {
          dispatch(setCredentials({ user: updatedUser }));
          tokenStore.setUser(updatedUser);
        }

        toast.success('Business details updated successfully in database!');
      } else {
        // First time Onboarding flow
        await api.patch('/v1/users/me', {
          profile_pic: shopLogo || user?.profile_pic || undefined,
          avatarUrl: shopLogo || user?.avatarUrl || undefined,
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
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.data?.message || 'Failed to save vendor profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans p-2 sm:p-4 min-h-screen pb-16">
      {/* Header Banner - Matching Customer Layout & Home Style */}
      <div className="bg-[#241b15] text-white p-6 rounded-2xl border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            {effectiveEditMode ? 'VENDOR BUSINESS PROFILE & SETUP' : 'GROW YOUR LOCAL STOREFRONT & REELS'}
          </span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            {effectiveEditMode ? 'UPDATE BUSINESS DETAILS' : 'REGISTER AS A BIZREELS VENDOR'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            {effectiveEditMode
              ? 'Update your shop identity, categories, delivery settings, address, and timings anytime.'
              : 'Launch your online business storefront, showcase products & services, post boosted reels, receive direct inquiries, and manage orders on BizReels.'}
          </p>
        </div>

        <div className="w-12 h-12 rounded-2xl bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a] shadow-md">
          <FiBriefcase size={22} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BUSINESS TYPE */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">1</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                Business Type &amp; Model
              </h3>
              <p className="text-[11px] text-slate-500">Select the model that best describes your commercial operations</p>
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

        {/* SECTION 2: SHOP / BUSINESS INFORMATION */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">2</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                Shop &amp; Business Information
              </h3>
              <p className="text-[11px] text-slate-500">Your storefront branding, categories, and images</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                Shop / Business Name *
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Trends Boutique Store"
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Trends Retail Store"
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>
          </div>

          {/* Vendor Type Selection */}
          <div className="border-t border-[#e3dccb] pt-4">
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2">
              Vendor Type (Product / Service / Both) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'product', label: 'Product Vendor', desc: 'Offers categories related to physical goods and products' },
                { id: 'service', label: 'Service Provider', desc: 'Offers categories related to local and specialized services' },
                { id: 'both', label: 'Product & Service', desc: 'Offers both product and service categories' },
              ].map((vt) => {
                const selected = vendorType === vt.id;
                return (
                  <div
                    key={vt.id}
                    onClick={() => setVendorType(vt.id)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      selected
                        ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                        : 'bg-[#f8f4ec] border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold">{vt.label}</span>
                      {selected && <FiCheck className="text-[#d99a3d]" size={15} />}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-tight">{vt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Categories Searchable Dropdown */}
          <div className="relative">
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2 flex justify-between items-center">
              <span>Business Category (Select all that apply) *</span>
              {selectedCategories.length > 0 && (
                <span className="text-[10px] text-[#d99a3d] font-bold">Selected: {selectedCategories.length}</span>
              )}
            </label>
            
            {/* Selected category tags */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {selectedCategories.map((cat) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#241b15] text-[#d99a3d] border border-[#241b15] rounded-xl text-xs font-bold shadow-xs"
                  >
                    <FiLayers size={12} className="text-[#d99a3d]" />
                    {cat}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="text-[#d99a3d] hover:text-rose-400 font-bold focus:outline-none ml-1 text-sm cursor-pointer"
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
                <FiSearch className="text-slate-400 w-4 h-4" />
              </div>
              <input
                type="text"
                value={catSearch}
                onChange={(e) => {
                  setCatSearch(e.target.value);
                  setShowCatDropdown(true);
                }}
                onFocus={() => setShowCatDropdown(true)}
                placeholder="Search categories (e.g. Electronics, Clothing, Salon)..."
                className="w-full pl-9 pr-10 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowCatDropdown(!showCatDropdown)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-[#1a1a1a] text-xs cursor-pointer"
              >
                ▼
              </button>
            </div>

            {/* Dropdown Options */}
            {showCatDropdown && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowCatDropdown(false)} />
                <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-[#e3dccb] rounded-xl shadow-xl z-40 p-2 space-y-1 animate-fade-in">
                  {filteredCategories.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 text-center">No matching categories found</p>
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
                              ? 'bg-[#241b15] text-[#d99a3d]'
                              : 'hover:bg-[#f8f4ec] text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <FiLayers size={13} className={isSelected ? 'text-[#d99a3d]' : 'text-slate-400'} />
                            {cat}
                          </span>
                          {isSelected && <FiCheck className="w-3.5 h-3.5 text-[#d99a3d]" />}
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
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2 flex justify-between items-center">
              <span>Sub Category / Specialty (Select all that apply)</span>
              {selectedSubCategories.length > 0 && (
                <span className="text-[10px] text-[#d99a3d] font-bold">Selected: {selectedSubCategories.length}</span>
              )}
            </label>

            {/* Selected subcategory tags */}
            {selectedSubCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2.5">
                {selectedSubCategories.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d99a3d] text-[#1a1a1a] border border-[#d99a3d] rounded-xl text-xs font-bold shadow-xs"
                  >
                    <FiTag size={12} />
                    {sub}
                    <button
                      type="button"
                      onClick={() => toggleSubCategory(sub)}
                      className="text-[#1a1a1a] hover:text-rose-600 font-bold focus:outline-none ml-1 text-sm cursor-pointer"
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
                <FiSearch className="text-slate-400 w-4 h-4" />
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
                placeholder={selectedCategories.length === 0 ? "Please select a category above first" : "Search subcategories..."}
                className="w-full pl-9 pr-10 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                disabled={selectedCategories.length === 0}
                onClick={() => setShowSubDropdown(!showSubDropdown)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-[#1a1a1a] text-xs disabled:opacity-50 cursor-pointer"
              >
                ▼
              </button>
            </div>

            {/* Dropdown Options */}
            {showSubDropdown && selectedCategories.length > 0 && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowSubDropdown(false)} />
                <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-[#e3dccb] rounded-xl shadow-xl z-40 p-2 space-y-1 animate-fade-in">
                  {filteredSubcategories.length === 0 ? (
                    <p className="text-xs text-slate-400 p-3 text-center">No matching subcategories found</p>
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
                          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-[#d99a3d] text-[#1a1a1a]'
                              : 'hover:bg-[#f8f4ec] text-slate-700'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <FiTag size={12} className={isSelected ? 'text-[#1a1a1a]' : 'text-slate-400'} />
                            {sub}
                          </span>
                          {isSelected && <FiCheck className="w-3.5 h-3.5 text-[#1a1a1a]" />}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
              Business Description &amp; Specialty
            </label>
            <textarea
              rows={3}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Describe your products, services, specialization, warranty, fast delivery, and offerings..."
              className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-medium text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all resize-none"
            />
          </div>

          {/* Shop Logo & Cover Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb]">
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2">
                Shop Logo / Profile Photo
              </label>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl border-2 border-[#e3dccb] bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                  {shopLogo ? (
                    <img src={resolveMediaUrl ? resolveMediaUrl(shopLogo) : shopLogo} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <FiCamera className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <label className="cursor-pointer px-3.5 py-2 bg-[#241b15] text-[#d99a3d] rounded-xl text-xs font-bold hover:bg-[#342820] transition flex items-center gap-2 shadow-xs">
                  <FiUploadCloud size={14} /> Upload Logo
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setShopLogo, 'Shop Logo')} />
                </label>
              </div>
            </div>

            <div className="bg-[#f8f4ec] p-4 rounded-xl border border-[#e3dccb]">
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2">
                Shop Cover Banner
              </label>
              <div className="flex items-center gap-3">
                <div className="w-24 h-16 rounded-xl border-2 border-[#e3dccb] bg-white flex items-center justify-center overflow-hidden flex-shrink-0 shadow-xs">
                  {shopCoverImage ? (
                    <img src={resolveMediaUrl ? resolveMediaUrl(shopCoverImage) : shopCoverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <FiImage className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <label className="cursor-pointer px-3.5 py-2 bg-white border border-[#e3dccb] text-[#1a1a1a] rounded-xl text-xs font-bold hover:bg-slate-50 transition flex items-center gap-2 shadow-xs">
                  <FiUploadCloud size={14} /> Upload Banner
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setShopCoverImage, 'Cover Banner')} />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: CONTACT INFORMATION */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">3</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                Contact Channels &amp; Inquiries
              </h3>
              <p className="text-[11px] text-slate-500">Direct contact channels for customer leads and inquiries</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                Primary Calling Mobile Number *
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="tel"
                  required
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
                  WhatsApp Number
                </label>
                <button
                  type="button"
                  onClick={() => setWhatsappNumber(mobileNumber)}
                  className="text-[10px] text-[#d99a3d] font-bold hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Same as Mobile
                </button>
              </div>
              <div className="relative">
                <FiMessageSquare className="absolute left-3.5 top-3 text-emerald-600 w-4 h-4" />
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                Business Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. info@trendsstore.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                Website / Online Catalog (Optional)
              </label>
              <div className="relative">
                <FiGlobe className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://www.trendsstore.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: BUSINESS ADDRESS & PINCODE AUTO-LOOKUP */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">4</span>
              <div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                  Physical Store Address &amp; GPS
                </h3>
                <p className="text-[11px] text-slate-500">Pinpoint your shop so nearby customers can navigate to you</p>
              </div>
            </div>

            {/* GPS Auto-Detect Button */}
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingLocation}
              className="px-3.5 py-1.5 bg-[#241b15] text-[#d99a3d] text-xs font-bold rounded-xl hover:bg-[#342820] transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <FiNavigation className={detectingLocation ? 'animate-spin' : ''} size={13} />
              <span>{detectingLocation ? 'Detecting GPS...' : 'Auto-Detect Location (GPS)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                PIN Code * {pincodeLoading && <span className="text-[#d99a3d] font-bold animate-pulse text-[10px]">(fetching...)</span>}
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-Digit PIN Code"
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                City / Town *
              </label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Auto-fetched or enter City"
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                District
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District Name"
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                placeholder="State Name"
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                Area / Locality / Market Name
              </label>
              <input
                type="text"
                value={areaLocality}
                onChange={(e) => setAreaLocality(e.target.value)}
                placeholder="e.g. Commercial Hub, Main Market"
                className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
                Google Maps Location Link / Pin
              </label>
              <div className="relative">
                <FiCompass className="absolute left-3.5 top-3 text-[#d99a3d] w-4 h-4" />
                <input
                  type="text"
                  value={googleMapLocation}
                  onChange={(e) => setGoogleMapLocation(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-semibold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">
              Full Physical Address *
            </label>
            <textarea
              required
              rows={2}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Shop No., Floor, Building Name, Street Address, Landmark..."
              className="w-full px-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-medium text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] transition-all resize-none"
            />
          </div>
        </div>

        {/* SECTION 5: DELIVERY & SERVICE AREA */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">5</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                Delivery Modes &amp; Service Radius
              </h3>
              <p className="text-[11px] text-slate-500">Configure how customer orders and service calls are fulfilled</p>
            </div>
          </div>

          {/* Home Delivery */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f4ec] border border-[#e3dccb] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FiTruck className="w-5 h-5 text-[#d99a3d]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#1a1a1a] uppercase">Local Home Delivery</h4>
                  <p className="text-[10px] text-slate-500">Deliver products directly to customer doorstep</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={homeDeliveryEnabled}
                  onChange={(e) => setHomeDeliveryEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#241b15]"></div>
              </label>
            </div>

            {homeDeliveryEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#e3dccb]">
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-1">Free Delivery Radius</label>
                  <select
                    value={homeDeliveryRadius}
                    onChange={(e) => setHomeDeliveryRadius(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a]"
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
                  <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-1">Min Order for Free Delivery (₹)</label>
                  <input
                    type="number"
                    value={homeDeliveryMinOrder}
                    onChange={(e) => setHomeDeliveryMinOrder(e.target.value)}
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a]"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-1">Delivery Charge Outside Radius (₹)</label>
                  <input
                    type="number"
                    value={homeDeliveryCharge}
                    onChange={(e) => setHomeDeliveryCharge(e.target.value)}
                    placeholder="e.g. 40"
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Courier by Vendor */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-[#1a1a1a] uppercase">Courier / Parcel Shipping</h4>
                <p className="text-[10px] text-slate-500">Ship orders nationwide via courier</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={courierByVendor}
                  onChange={(e) => setCourierByVendor(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#241b15]"></div>
              </label>
            </div>

            {/* Customer Visit Shop */}
            <div className="p-4 rounded-xl bg-[#f8f4ec] border border-[#e3dccb] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-[#1a1a1a] uppercase">In-Store Walk-In Visit</h4>
                <p className="text-[10px] text-slate-500">Allow customers to visit offline shop</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerVisitShop}
                  onChange={(e) => setCustomerVisitShop(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#241b15]"></div>
              </label>
            </div>
          </div>

          {/* Service at Customer Location */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8f4ec] border border-[#e3dccb] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FiCompass className="w-5 h-5 text-[#d99a3d]" />
                <div>
                  <h4 className="text-xs font-extrabold text-[#1a1a1a] uppercase">Doorstep / On-Site Service</h4>
                  <p className="text-[10px] text-slate-500">Provide repair, maintenance, or home visits</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceAtCustomerLocation}
                  onChange={(e) => setServiceAtCustomerLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#241b15]"></div>
              </label>
            </div>

            {serviceAtCustomerLocation && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#e3dccb]">
                <div>
                  <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-1">Service Coverage Radius</label>
                  <select
                    value={serviceRadius}
                    onChange={(e) => setServiceRadius(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a]"
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
                  <label className="block text-[9px] font-extrabold text-slate-600 uppercase mb-1">Min Order Request Price (₹)</label>
                  <input
                    type="number"
                    value={serviceMinOrder}
                    onChange={(e) => setServiceMinOrder(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 bg-white border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 6: BUSINESS TIMING */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-5">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">6</span>
              <div>
                <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">
                  Business Timing &amp; Working Hours
                </h3>
                <p className="text-[11px] text-slate-500">Set operating hours and weekly off days</p>
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
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">Opening Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="time"
                      value={format12to24(openingTime)}
                      onChange={(e) => setOpeningTime(format24to12(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-1">Closing Time</label>
                  <div className="relative">
                    <FiClock className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                    <input
                      type="time"
                      value={format12to24(closingTime)}
                      onChange={(e) => setClosingTime(format24to12(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2">Weekly Off Days</label>
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
                    Open All Days (No Off)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 7: DECLARATION & TERMS */}
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-[#e3dccb] shadow-xs space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-[#241b15] focus:ring-[#d99a3d] border-[#e3dccb]"
            />
            <span className="text-xs text-slate-700 leading-relaxed font-medium">
              I hereby declare that all business details, addresses, and contact numbers provided are true, valid, and authentic. I accept the <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} className="font-extrabold text-[#d99a3d] underline cursor-pointer inline bg-transparent border-none p-0">BizReels Vendor Terms &amp; Conditions</button> and Privacy Policy.
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-4 bg-[#241b15] text-[#d99a3d] border-2 border-[#241b15] rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider shadow-premium hover:bg-[#342820] transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          {effectiveEditMode ? (
            <>
              <FiCheckCircle size={18} />
              <span>{loading ? 'Saving Changes...' : 'Update Profile Details'}</span>
            </>
          ) : (
            <>
              <span>{loading ? 'Registering & Launching Portal...' : 'Complete Registration & Launch Vendor Portal'}</span>
              <FiArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-[#e3dccb] rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#e3dccb] flex items-center justify-between">
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-base uppercase text-[#1a1a1a]">
                BizReels Vendor Terms &amp; Conditions
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-all focus:outline-none cursor-pointer"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
              <p className="font-bold text-[#1a1a1a]">Welcome to the BizReels Vendor Storefront Program!</p>
              <p>By registering as a vendor on BizReels, you agree to comply with and be bound by the following terms &amp; conditions:</p>
              
              <h4 className="font-bold text-[#1a1a1a] mt-3">1. Business Legitimacy</h4>
              <p>You guarantee that all commercial details, shop name, address, categories, and documents submitted are correct, legitimate, and belong strictly to your legal entity or storefront.</p>
              
              <h4 className="font-bold text-[#1a1a1a] mt-3">2. Category Alignment</h4>
              <p>You agree to tag your business storefront only under categories and subcategories in which you are licensed, qualified, and active. Misrepresentation of business type is grounds for account suspension.</p>
              
              <h4 className="font-bold text-[#1a1a1a] mt-3">3. Quotations &amp; Leads Communication</h4>
              <p>BizReels facilitates leads matching from local customers. When posting quotes or bidding on requirements, you agree to provide authentic and transparent quotes. Unprofessional, spammy, or offensive quotes will lead to penalties.</p>
              
              <h4 className="font-bold text-[#1a1a1a] mt-3">4. Fees &amp; Wallet Balance</h4>
              <p>Specific vendor tools, premium outreach credits, and lead connections are subject to credit costs/pricing. All credit transactions, deposits, and refunds are governed by the BizReels Wallet guidelines.</p>
              
              <h4 className="font-bold text-[#1a1a1a] mt-3">5. Delivery &amp; Service Standard</h4>
              <p>Home delivery, services, and offline visits configured in this portal must be fulfilled with utmost customer satisfaction and quality. BizReels does not take direct responsibility for product defects or service disputes.</p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#e3dccb] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-5 py-2.5 bg-[#241b15] text-[#d99a3d] font-bold text-xs rounded-xl hover:bg-[#342820] transition-all shadow-xs cursor-pointer"
              >
                Accept &amp; Agree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
