import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  FiBriefcase, FiMapPin, FiGlobe, FiPhone, FiClock, FiSave, FiInstagram,
  FiFacebook, FiCamera, FiImage, FiTrash2, FiNavigation, FiCheckCircle,
  FiSearch, FiChevronDown, FiCheck, FiX
} from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { useListCategoriesQuery } from '../../../features/admin/adminApi';
import { setCredentials } from '../../../features/auth/authSlice';
import api, { tokenStore, resolveMediaUrl } from '../../../lib/api';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import {
  getStatesList,
  getDistrictsForState,
  getTehsilsForDistrict,
  getPincodesForDistrict,
  parseAddressString,
  lookupPincodeLocal
} from '../../../data/indiaLocations';

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

// Reusable Searchable Select Component for State, District, Tehsil, and Pin Code
function SearchableSelect({
  label,
  value,
  onChange,
  options = [],
  placeholder = '-- Select --',
  searchPlaceholder = 'Search...',
  disabled = false,
  customOptionLabel = '',
  customOptionValue = 'OTHER_CUSTOM',
  loading = false,
  badgeText = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = (options || []).filter(opt =>
    String(opt).toLowerCase().includes(search.toLowerCase())
  );

  const displayValue = value === customOptionValue
    ? customOptionLabel
    : (value || '');

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
          {label}
        </label>
        {loading && (
          <span className="text-[10px] text-brand-purple font-semibold animate-pulse">
            {badgeText || 'Loading...'}
          </span>
        )}
      </div>

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 bg-surface border rounded-xl text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
          disabled ? 'opacity-50 cursor-not-allowed border-border' : 'border-border hover:border-brand-purple/50 focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20'
        } ${isOpen ? 'border-brand-purple ring-2 ring-brand-purple/20' : ''}`}
      >
        <span className={`truncate mr-2 ${displayValue ? 'text-text-primary' : 'text-text-tertiary font-normal'}`}>
          {displayValue || placeholder}
        </span>
        <FiChevronDown className={`w-4 h-4 text-text-tertiary shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-brand-purple' : ''}`} />
      </button>

      {/* Dropdown Menu with Search */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-surface-secondary/95 backdrop-blur-xl border border-border/90 rounded-2xl shadow-xl overflow-hidden animate-scale-in min-w-[200px]">
          {/* Search Input Box */}
          <div className="p-2 border-b border-border/80 bg-surface/50">
            <div className="relative flex items-center">
              <FiSearch className="absolute left-3 text-text-tertiary w-3.5 h-3.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 bg-surface border border-border/80 rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple font-medium"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 text-text-tertiary hover:text-text-primary"
                >
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {customOptionLabel && (
              <button
                type="button"
                onClick={() => {
                  onChange(customOptionValue);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors ${
                  value === customOptionValue
                    ? 'bg-brand-purple/15 text-brand-purple'
                    : 'text-brand-purple hover:bg-brand-purple/10'
                }`}
              >
                <span>{customOptionLabel}</span>
                {value === customOptionValue && <FiCheck className="w-3.5 h-3.5" />}
              </button>
            )}

            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-brand-purple text-white font-bold'
                        : 'text-text-primary hover:bg-surface-tertiary'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && <FiCheck className="w-3.5 h-3.5 text-white shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-3 text-center text-xs text-text-tertiary">
                No matching results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorBusinessProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes, refetch: refetchProfile } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !authUser && !tokenStore.getUser(),
  });
  const [updateProfileApi] = useUpdateProfileMutation();

  const user = profileRes?.data?.user || profileRes?.user || authUser || {};
  const vendorProfile = user.vendorProfile || {};

  const { data: categoriesDataRes } = useListCategoriesQuery();
  const categoriesList = categoriesDataRes?.items || categoriesDataRes?.categories || (Array.isArray(categoriesDataRes) ? categoriesDataRes : []);
  const parentCategories = categoriesList.filter(c => !c.parent_id);

  // Form states
  const [shopName, setShopName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  
  // Media states
  const [profilePic, setProfilePic] = useState('');
  const [coverBanner, setCoverBanner] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [loading, setLoading] = useState(false);

  // Address Dropdown states (State, District, Tehsil, Pin Code, Area)
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [customDistrict, setCustomDistrict] = useState('');
  const [selectedTehsil, setSelectedTehsil] = useState('');
  const [customTehsil, setCustomTehsil] = useState('');
  const [selectedPincode, setSelectedPincode] = useState('');
  const [customPincode, setCustomPincode] = useState('');
  const [areaAddress, setAreaAddress] = useState('');

  // Business Timing states
  const [open24x7, setOpen24x7] = useState(false);
  const [openingTime, setOpeningTime] = useState('09:00 AM');
  const [closingTime, setClosingTime] = useState('09:00 PM');
  const [weeklyOff, setWeeklyOff] = useState('Sunday');

  // Track initial hydration to prevent re-overwriting on local state updates
  const [isHydrated, setIsHydrated] = useState(false);

  const toggleWeeklyOffDay = (day) => {
    let currentDays = weeklyOff === 'None' ? [] : weeklyOff.split(', ').filter(Boolean);
    if (currentDays.includes(day)) {
      currentDays = currentDays.filter(d => d !== day);
    } else {
      currentDays = [...currentDays, day];
    }
    setWeeklyOff(currentDays.length > 0 ? currentDays.join(', ') : 'None');
  };

  // Initial population from user & vendorProfile
  useEffect(() => {
    if ((user?._id || authUser?._id) && !isHydrated) {
      // Do not prefill shopName with user personal full name
      const cleanShopName = (vendorProfile.shopName && vendorProfile.shopName !== user.name)
        ? vendorProfile.shopName
        : '';
      setShopName(cleanShopName);
      setBusinessName(vendorProfile.businessName || '');
      setCategory(vendorProfile.category || 'Electronics');
      setDescription(vendorProfile.description || vendorProfile.businessDescription || '');
      
      setWebsite(vendorProfile.website || '');
      setWhatsapp(vendorProfile.whatsapp || user.phone || '');
      setInstagram(vendorProfile.instagram || '');
      setFacebook(vendorProfile.facebook || '');
      
      const currentPic = user.profile_pic || user.avatarUrl || vendorProfile.shopLogo || '';
      const currentCover = vendorProfile.coverBanner || vendorProfile.shopCoverImage || '';
      setProfilePic(currentPic);
      setCoverBanner(currentCover);

      const timing = vendorProfile.businessTiming || {};
      setOpen24x7(!!timing.open24x7);
      setOpeningTime(timing.openingTime || '09:00 AM');
      setClosingTime(timing.closingTime || '09:00 PM');
      setWeeklyOff(timing.weeklyOff || 'Sunday');

      if (!vendorProfile.businessTiming && vendorProfile.businessHours) {
        if (vendorProfile.businessHours.toLowerCase().includes('24/7')) {
          setOpen24x7(true);
        }
      }

      // Populate address parts from structured address or raw string
      let rawAddrStr = vendorProfile.businessAddress || '';
      if (!rawAddrStr && vendorProfile.address) {
        if (typeof vendorProfile.address === 'string') {
          rawAddrStr = vendorProfile.address;
        } else if (typeof vendorProfile.address === 'object') {
          rawAddrStr = vendorProfile.address.fullAddress || vendorProfile.address.address || '';
        }
      }
      if (!rawAddrStr && user.location?.address) {
        rawAddrStr = user.location.address;
      }

      // Check if structured object exists on vendorProfile.address
      const addrObj = (typeof vendorProfile.address === 'object' && vendorProfile.address) ? vendorProfile.address : null;
      
      const stateFromProfile = addrObj?.state || user.location?.state || vendorProfile.state || '';
      const distFromProfile = addrObj?.district || user.location?.district || vendorProfile.district || vendorProfile.city || '';
      const tehsilFromProfile = addrObj?.tehsil || vendorProfile.tehsil || '';
      const pinFromProfile = addrObj?.pincode || user.location?.pincode || vendorProfile.pincode || '';
      const areaFromProfile = addrObj?.area || addrObj?.address || vendorProfile.area || '';

      if (stateFromProfile || distFromProfile || pinFromProfile || areaFromProfile) {
        setSelectedState(stateFromProfile);
        const availDists = stateFromProfile ? getDistrictsForState(stateFromProfile) : [];
        if (distFromProfile) {
          if (availDists.includes(distFromProfile)) {
            setSelectedDistrict(distFromProfile);
          } else {
            setSelectedDistrict('OTHER_CUSTOM');
            setCustomDistrict(distFromProfile);
          }
        }
        if (tehsilFromProfile) {
          const availTehsils = (stateFromProfile && distFromProfile) ? getTehsilsForDistrict(stateFromProfile, distFromProfile) : [];
          if (availTehsils.includes(tehsilFromProfile)) {
            setSelectedTehsil(tehsilFromProfile);
          } else {
            setSelectedTehsil('OTHER_CUSTOM');
            setCustomTehsil(tehsilFromProfile);
          }
        }
        if (pinFromProfile) {
          const availPins = (stateFromProfile && distFromProfile) ? getPincodesForDistrict(stateFromProfile, distFromProfile) : [];
          if (availPins.includes(pinFromProfile)) {
            setSelectedPincode(pinFromProfile);
          } else {
            setSelectedPincode('OTHER_CUSTOM');
            setCustomPincode(pinFromProfile);
          }
        }
        setAreaAddress(areaFromProfile || rawAddrStr);
      } else if (rawAddrStr) {
        const parsed = parseAddressString(rawAddrStr);
        setSelectedState(parsed.state);
        setSelectedDistrict(parsed.district);
        setSelectedTehsil(parsed.tehsil);
        setSelectedPincode(parsed.pincode);
        setAreaAddress(parsed.area);
      } else {
        // Default to Madhya Pradesh -> Indore if empty
        setSelectedState('Madhya Pradesh');
        setSelectedDistrict('Indore');
      }

      setIsHydrated(true);
    }
  }, [user, authUser, vendorProfile, isHydrated]);

  // Dynamic dropdown options based on selections
  const statesList = getStatesList();
  const availableDistricts = selectedState ? getDistrictsForState(selectedState) : [];
  const activeDistrictForLists = selectedDistrict === 'OTHER_CUSTOM' ? customDistrict : selectedDistrict;
  const availableTehsils = (selectedState && activeDistrictForLists) ? getTehsilsForDistrict(selectedState, activeDistrictForLists) : [];
  const availablePincodes = (selectedState && activeDistrictForLists) ? getPincodesForDistrict(selectedState, activeDistrictForLists) : [];

  // Handle State Change
  const handleStateChange = (newState) => {
    setSelectedState(newState);
    const newDistricts = getDistrictsForState(newState);
    const defaultDist = newDistricts.length > 0 ? newDistricts[0] : '';
    setSelectedDistrict(defaultDist);
    setCustomDistrict('');
    
    const newTehsils = defaultDist ? getTehsilsForDistrict(newState, defaultDist) : [];
    setSelectedTehsil(newTehsils.length > 0 ? newTehsils[0] : '');
    setCustomTehsil('');

    const newPincodes = defaultDist ? getPincodesForDistrict(newState, defaultDist) : [];
    setSelectedPincode(newPincodes.length > 0 ? newPincodes[0] : '');
    setCustomPincode('');
  };

  // Handle District Change
  const handleDistrictChange = (newDistrict) => {
    setSelectedDistrict(newDistrict);
    if (newDistrict !== 'OTHER_CUSTOM') {
      setCustomDistrict('');
      const newTehsils = getTehsilsForDistrict(selectedState, newDistrict);
      setSelectedTehsil(newTehsils.length > 0 ? newTehsils[0] : '');
      setCustomTehsil('');

      const newPincodes = getPincodesForDistrict(selectedState, newDistrict);
      setSelectedPincode(newPincodes.length > 0 ? newPincodes[0] : '');
      setCustomPincode('');
    }
  };

  // Compute final District, Tehsil and Pincode values
  const activeDistrict = selectedDistrict === 'OTHER_CUSTOM' ? customDistrict.trim() : selectedDistrict;
  const activeTehsil = selectedTehsil === 'OTHER_CUSTOM' ? customTehsil.trim() : selectedTehsil;
  const activePincode = selectedPincode === 'OTHER_CUSTOM' ? customPincode.trim() : selectedPincode;
  const [lookingUpPincode, setLookingUpPincode] = useState(false);

  // Auto-populate State, District, Tehsil, and Area when a 6-digit Pincode is chosen / entered
  const handlePincodeAutoLookup = async (pin) => {
    if (!pin || typeof pin !== 'string') return;
    const cleanPin = pin.trim();
    if (cleanPin.length !== 6 || !/^\d{6}$/.test(cleanPin)) return;

    setLookingUpPincode(true);
    const toastId = toast.loading(`Looking up details for PIN ${cleanPin}...`);

    let detectedState = '';
    let detectedDistrict = '';
    let detectedTehsil = '';
    let detectedArea = '';

    try {
      // 1. Check local fast in-memory dataset first (0ms)
      const localMatch = lookupPincodeLocal(cleanPin);
      if (localMatch) {
        detectedState = localMatch.state;
        detectedDistrict = localMatch.district;
        if (localMatch.tehsils && localMatch.tehsils.length > 0) {
          detectedTehsil = localMatch.tehsils[0];
        }
      }

      // 2. Google Maps Geocoding API if key configured
      const googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (googleApiKey && googleApiKey !== 'your_google_maps_api_key_here') {
        try {
          const gRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${cleanPin},India&key=${googleApiKey}`);
          const gData = await gRes.json();
          if (gData.results && gData.results.length > 0) {
            const resultItem = gData.results[0];
            const comps = resultItem.address_components || [];
            comps.forEach(c => {
              if (c.types.includes('administrative_area_level_1')) {
                detectedState = c.long_name;
              }
              if (c.types.includes('administrative_area_level_2') || c.types.includes('locality')) {
                detectedDistrict = c.long_name;
              }
              if (c.types.includes('sublocality') || c.types.includes('sublocality_level_1') || c.types.includes('administrative_area_level_3')) {
                detectedTehsil = c.long_name;
              }
              if (c.types.includes('neighborhood') || c.types.includes('sublocality_level_2') || c.types.includes('route')) {
                if (!detectedArea) detectedArea = c.long_name;
              }
            });
            if (!detectedArea && resultItem.formatted_address) {
              const formattedParts = resultItem.formatted_address.split(',');
              if (formattedParts.length > 0) detectedArea = formattedParts[0].trim();
            }
          }
        } catch (gErr) {
          console.warn('Google Maps Geocoding fallback:', gErr);
        }
      }

      // 3. Backend postal API lookup
      try {
        const res = await api.post('/v1/location/pincode-lookup', { pincode: cleanPin });
        if (res.data) {
          if (res.data.state) detectedState = res.data.state;
          if (res.data.district || res.data.city) detectedDistrict = res.data.district || res.data.city;
          if (res.data.tehsil || res.data.area) detectedTehsil = res.data.tehsil || res.data.area;
          if (res.data.area) detectedArea = res.data.area;
        }
      } catch (apiErr) {
        console.warn('Backend postal lookup fallback:', apiErr);
      }

      // Match and update State in list
      if (detectedState) {
        const allStates = getStatesList();
        const matchedState = allStates.find(s => s.toLowerCase() === detectedState.toLowerCase()) || detectedState;
        setSelectedState(matchedState);

        // Match District in state or auto-fill customDistrict
        const allDistricts = getDistrictsForState(matchedState);
        let matchedDistrict = allDistricts.find(d => d.toLowerCase() === detectedDistrict.toLowerCase());
        if (!matchedDistrict && detectedDistrict) {
          matchedDistrict = allDistricts.find(d => detectedDistrict.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(detectedDistrict.toLowerCase()));
        }

        if (matchedDistrict) {
          setSelectedDistrict(matchedDistrict);
          setCustomDistrict('');
        } else if (detectedDistrict) {
          setSelectedDistrict('OTHER_CUSTOM');
          setCustomDistrict(detectedDistrict);
        }

        // Match Tehsil in district or auto-fill customTehsil
        const effectiveDist = matchedDistrict || detectedDistrict;
        const allTehsils = getTehsilsForDistrict(matchedState, effectiveDist);
        if (detectedTehsil && allTehsils.includes(detectedTehsil)) {
          setSelectedTehsil(detectedTehsil);
          setCustomTehsil('');
        } else if (detectedTehsil) {
          setSelectedTehsil('OTHER_CUSTOM');
          setCustomTehsil(detectedTehsil);
        } else if (allTehsils.length > 0) {
          setSelectedTehsil(allTehsils[0]);
          setCustomTehsil('');
        }
      } else if (detectedDistrict) {
        setSelectedDistrict('OTHER_CUSTOM');
        setCustomDistrict(detectedDistrict);
      }

      // Auto-fill Area / Street address if detected
      if (detectedArea) {
        setAreaAddress(detectedArea);
      }

      const finalDistName = detectedDistrict || activeDistrict;
      const finalStateName = detectedState || selectedState;
      if (finalDistName || finalStateName) {
        toast.success(`Location updated for PIN ${cleanPin}: ${finalDistName || ''}, ${finalStateName || ''}`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      toast.dismiss(toastId);
    } finally {
      setLookingUpPincode(false);
    }
  };

  // Build formatted full physical address string
  const compileFullAddress = () => {
    const parts = [];
    if (areaAddress.trim()) parts.push(areaAddress.trim());
    if (activeTehsil) parts.push(`Tehsil: ${activeTehsil}`);
    if (activeDistrict) parts.push(activeDistrict);
    if (selectedState) parts.push(selectedState);
    if (activePincode) parts.push(activePincode);
    return parts.join(', ');
  };

  // Universal File Upload Handler with Instant Local Preview
  const handleFileUpload = async (e, setUrl, setUploading, label) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Instant optimistic local preview on screen
    const localPreviewUrl = URL.createObjectURL(file);
    setUrl(localPreviewUrl);

    setUploading(true);
    const toastId = toast.loading(`Uploading ${label}...`);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const serverUrl = res.data?.url || res.data?.data?.url || res.url;
      if (serverUrl) {
        setUrl(serverUrl);
        toast.success(`${label} uploaded!`, { id: toastId });
      } else {
        toast.success(`${label} ready!`, { id: toastId });
      }
    } catch (err) {
      console.error(`Upload error for ${label}:`, err);
      // Fallback: convert to base64 Data URL so it is never lost
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUrl(reader.result);
        }
        toast.success(`${label} attached!`, { id: toastId });
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hoursStr = open24x7
        ? 'Open 24/7'
        : `${openingTime} - ${closingTime} (Off: ${weeklyOff})`;

      const finalAddress = compileFullAddress();

      const addressStructured = {
        state: selectedState,
        district: activeDistrict,
        city: activeDistrict,
        tehsil: activeTehsil,
        pincode: activePincode,
        area: areaAddress.trim(),
        fullAddress: finalAddress,
        address: areaAddress.trim() || finalAddress,
      };

      const payload = {
        profile_pic: profilePic || undefined,
        avatarUrl: profilePic || undefined,
        location: {
          type: 'Point',
          coordinates: user.location?.coordinates || [75.8577, 22.7196],
          state: selectedState,
          district: activeDistrict,
          city: activeDistrict,
          pincode: activePincode,
          address: finalAddress
        },
        vendorProfile: {
          ...vendorProfile,
          shopName,
          businessName,
          category,
          description,
          businessHours: hoursStr,
          businessTiming: {
            openingTime: open24x7 ? '00:00 AM' : openingTime,
            closingTime: open24x7 ? '11:59 PM' : closingTime,
            weeklyOff: open24x7 ? 'None' : weeklyOff,
            open24x7
          },
          state: selectedState,
          district: activeDistrict,
          city: activeDistrict,
          tehsil: activeTehsil,
          pincode: activePincode,
          area: areaAddress.trim(),
          address: addressStructured,
          businessAddress: finalAddress,
          website,
          whatsapp,
          instagram,
          facebook,
          coverBanner: coverBanner || '',
          shopLogo: profilePic || vendorProfile.shopLogo || '',
          shopCoverImage: coverBanner || vendorProfile.shopCoverImage || '',
          updatedAt: new Date().toISOString()
        }
      };

      const res = await updateProfileApi(payload).unwrap();
      const updatedUser = res.user || res.data?.user || res;

      if (updatedUser) {
        dispatch(setCredentials({ user: updatedUser }));
      }
      
      try {
        refetchProfile();
      } catch {}

      toast.success('Business Profile updated successfully!');
    } catch (err) {
      console.error('Update profile error:', err);
      toast.error(err?.data?.message || 'Failed to update business profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiBriefcase}
        title="Business Profile & Branding"
        subtitle="Manage shop identity, logo, searchable address dropdowns, business timing, and social links"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Image & Cover Banner Upload Section */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card space-y-6">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2.5 border-b border-border pb-3">
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple">
              <FiCamera className="w-4 h-4" />
            </div>
            <span>Profile Photo & Cover Banner</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor Profile Image */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Shop Logo / Profile Picture *
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full border-2 border-brand-purple/50 overflow-hidden bg-surface-tertiary shrink-0 relative shadow-sm">
                  {profilePic ? (
                    <img
                      src={resolveMediaUrl(profilePic)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/logo.png';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-tertiary text-2xl font-bold bg-brand-purple/10 text-brand-purple">
                      {shopName ? shopName.charAt(0).toUpperCase() : 'V'}
                    </div>
                  )}
                  {uploadingPic && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-[1px]">
                      Uploading...
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-purple/10 text-brand-purple text-xs font-bold rounded-xl hover:bg-brand-purple/20 transition cursor-pointer active:scale-95">
                      <FiCamera size={14} />
                      <span>{profilePic ? 'Change Photo' : 'Upload Logo / Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, setProfilePic, setUploadingPic, 'Profile Picture')}
                      />
                    </label>
                    {profilePic && (
                      <button
                        type="button"
                        onClick={() => setProfilePic('')}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition"
                        title="Remove photo"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-text-tertiary">Recommended: Square JPG or PNG (Max 5MB)</p>
                </div>
              </div>
            </div>

            {/* Cover Banner (Optional) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                  Cover Banner <span className="text-emerald-500 font-semibold">(Optional)</span>
                </label>
                {coverBanner && (
                  <button
                    type="button"
                    onClick={() => setCoverBanner('')}
                    className="text-[10px] font-bold text-rose-500 hover:underline"
                  >
                    Remove Banner
                  </button>
                )}
              </div>
              <div className="relative rounded-2xl overflow-hidden border border-border h-24 bg-surface-tertiary shadow-inner">
                {coverBanner ? (
                  <img
                    src={resolveMediaUrl(coverBanner)}
                    alt="Cover Banner"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-cover-gradient flex items-center justify-center text-xs text-text-tertiary font-medium">
                    No cover banner set (Displays gradient)
                  </div>
                )}
                {uploadingBanner && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-[1px]">
                    Uploading Banner...
                  </div>
                )}
              </div>

              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-text-primary text-xs font-bold rounded-xl hover:bg-surface-tertiary transition cursor-pointer active:scale-95">
                  <FiImage size={14} />
                  <span>{coverBanner ? 'Change Cover Banner' : 'Upload Cover Banner'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, setCoverBanner, setUploadingBanner, 'Cover Banner')}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Shop Details */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2.5 border-b border-border pb-3">
            <div className="p-2 rounded-xl bg-brand-purple/10 text-brand-purple">
              <FiBriefcase className="w-4 h-4" />
            </div>
            <span>Basic Shop Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Shop / Display Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Metro Electronics & Accessories"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Business Registered Name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Metro Enterprises Pvt Ltd"
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Business Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all cursor-pointer"
              >
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Timing Section */}
            <div className="sm:col-span-2 border-t border-border pt-4 mt-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Business Timing & Hours</h4>
                  <p className="text-[10px] text-text-tertiary mt-0.5">Select opening/closing times and weekly off days</p>
                </div>
                
                {/* 24x7 Toggle */}
                <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border">
                  <span className="text-[10px] font-bold text-text-primary uppercase">Open 24×7</span>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Opening Time</label>
                    <div className="relative">
                      <FiClock className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                      <input
                        type="time"
                        value={format12to24(openingTime)}
                        onChange={(e) => setOpeningTime(format24to12(e.target.value))}
                        className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Closing Time</label>
                    <div className="relative">
                      <FiClock className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                      <input
                        type="time"
                        value={format12to24(closingTime)}
                        onChange={(e) => setClosingTime(format24to12(e.target.value))}
                        className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-2">Weekly Off Days</label>
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
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Shop Description & Tagline</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your shop offerings, specialty products, brands sold..."
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Business Physical Address (Searchable Dropdowns for State, District, Tehsil, Pin Code + Text for Area) */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card space-y-5">
          <div className="border-b border-border pb-3 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-brand-orange/10 text-brand-orange">
                <FiMapPin className="w-4 h-4" />
              </div>
              <span>Business Physical Address</span>
            </h3>
            <span className="text-[11px] text-brand-purple font-semibold bg-brand-purple/10 px-2.5 py-1 rounded-full flex items-center gap-1">
              <FiNavigation className="w-3 h-3" />
              <span>Searchable Dropdowns with Instant Pincode Auto-Fill</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Searchable State Dropdown */}
            <div>
              <SearchableSelect
                label="State *"
                value={selectedState}
                onChange={handleStateChange}
                options={statesList}
                placeholder="-- Select State --"
                searchPlaceholder="Type to search state..."
              />
            </div>

            {/* 2. Searchable District Dropdown */}
            <div>
              <SearchableSelect
                label="District *"
                value={selectedDistrict}
                onChange={handleDistrictChange}
                options={availableDistricts}
                disabled={!selectedState}
                placeholder="-- Select District --"
                searchPlaceholder="Type to search district..."
                customOptionLabel="+ Other / Custom District"
                customOptionValue="OTHER_CUSTOM"
              />

              {selectedDistrict === 'OTHER_CUSTOM' && (
                <input
                  type="text"
                  value={customDistrict}
                  onChange={(e) => setCustomDistrict(e.target.value)}
                  placeholder="Enter District Name"
                  className="mt-2 w-full px-4 py-2 bg-surface border border-brand-purple/50 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all"
                />
              )}
            </div>

            {/* 3. Searchable Tehsil Dropdown */}
            <div>
              <SearchableSelect
                label="Tehsil / Taluka"
                value={selectedTehsil}
                onChange={setSelectedTehsil}
                options={availableTehsils}
                disabled={!selectedDistrict}
                placeholder="-- Select Tehsil --"
                searchPlaceholder="Type to search tehsil..."
                customOptionLabel="+ Other / Custom Tehsil"
                customOptionValue="OTHER_CUSTOM"
              />

              {selectedTehsil === 'OTHER_CUSTOM' && (
                <input
                  type="text"
                  value={customTehsil}
                  onChange={(e) => setCustomTehsil(e.target.value)}
                  placeholder="Enter Tehsil Name"
                  className="mt-2 w-full px-4 py-2 bg-surface border border-brand-purple/50 rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all"
                />
              )}
            </div>

            {/* 4. Searchable Pin Code Dropdown / Selector */}
            <div>
              <SearchableSelect
                label="Pin Code"
                value={selectedPincode}
                onChange={(val) => {
                  setSelectedPincode(val);
                  if (val && val !== 'OTHER_CUSTOM') {
                    handlePincodeAutoLookup(val);
                  }
                }}
                options={availablePincodes}
                disabled={!selectedDistrict}
                placeholder="-- Select Pin Code --"
                searchPlaceholder="Type to search pin..."
                customOptionLabel="+ Enter 6-digit Pin Code"
                customOptionValue="OTHER_CUSTOM"
                loading={lookingUpPincode}
                badgeText="Auto-detecting..."
              />

              {selectedPincode === 'OTHER_CUSTOM' && (
                <div className="mt-2 relative">
                  <input
                    type="text"
                    maxLength={6}
                    value={customPincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setCustomPincode(val);
                      if (val.length === 6) {
                        handlePincodeAutoLookup(val);
                      }
                    }}
                    placeholder="Enter 6-digit Pin Code"
                    className="w-full px-4 py-2 bg-surface border border-brand-purple/50 rounded-xl text-xs text-text-primary font-bold focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-text-tertiary">
                    {customPincode.length}/6
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 5. Area / Street / Detailed Address Textarea (Auto-filled from Geocoding/Pincode + Editable) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">
                Area / Street / Building Address (Text Input) *
              </label>
              <span className="text-[10px] text-text-tertiary font-medium">Auto-filled from Pin Code / Editable</span>
            </div>
            <textarea
              rows={2}
              required
              value={areaAddress}
              onChange={(e) => setAreaAddress(e.target.value)}
              placeholder="e.g. Shop No. 12, Ground Floor, MG Road, Near City Mall, Main Market"
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
            />
          </div>

          {/* Live Full Address Preview Pill */}
          <div className="bg-surface-secondary p-3.5 rounded-xl border border-border/80 flex items-start gap-2.5 text-xs text-text-secondary">
            <FiCheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-text-primary text-[11px] block uppercase tracking-wider">
                Full Physical Address Preview:
              </span>
              <p className="text-xs text-text-primary font-medium">
                {compileFullAddress() || 'Please select State, District, and enter Area details above'}
              </p>
            </div>
          </div>
        </div>

        {/* Online & Social Links */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-white/50 shadow-card space-y-5">
          <h3 className="text-sm font-bold text-text-primary font-display flex items-center gap-2.5 border-b border-border pb-3">
            <div className="p-2 rounded-xl bg-brand-pink/10 text-brand-pink">
              <FiGlobe className="w-4 h-4" />
            </div>
            <span>Online Presence & Social Links</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">WhatsApp Number</label>
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Website URL</label>
              <div className="relative">
                <FiGlobe className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://myshop.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Instagram Handle</label>
              <div className="relative">
                <FiInstagram className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@shopname"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1.5">Facebook Page</label>
              <div className="relative">
                <FiFacebook className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="facebook.com/shopname"
                  className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary font-medium focus:outline-none focus:border-brand-purple focus:ring-2 focus:ring-brand-purple/20 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-60"
          >
            <FiSave className="w-4 h-4" />
            <span>{loading ? 'Saving Profile...' : 'Save Business Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
