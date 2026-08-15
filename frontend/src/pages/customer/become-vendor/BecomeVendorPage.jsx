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
  const [vendorType, setVendorType] = useState('both');

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
  const [catSearch, setCatSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');

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

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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
      toast.error('Could not auto-fetch pincode data.');
    } finally {
      setPincodeLoading(false);
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
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
            toast.success('Location auto-detected!', { id: toastId });
          } else {
            toast.error('Unable to fetch location details.', { id: toastId });
          }
        } catch (err) {
          toast.error('Failed to resolve address.', { id: toastId });
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        toast.error('Location detection failed.', { id: toastId });
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
      toast.error('Please accept the Vendor Terms & Conditions');
      return;
    }

    setLoading(true);
    try {
      const vendorProfileData = {
        businessType,
        vendorType,
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
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        verificationStatus: 'unverified',
        createdAt: new Date().toISOString()
      };

      await api.patch('/v1/users/me', {
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

      toast.success('🎉 Congratulations! Vendor Portal launched successfully!');
      navigate('/vendor/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to register vendor profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans p-2 sm:p-4 min-h-screen">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">GROW YOUR STOREFRONT</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            REGISTER AS A VENDOR
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Launch your online business storefront, showcase products &amp; services, post boosted reels, and receive direct inquiries.
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiBriefcase size={20} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BUSINESS TYPE */}
        <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">1</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">BUSINESS MODEL TYPE</h3>
              <p className="text-[11px] text-slate-500">Select the commercial model that describes your operations</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-1">
            {BUSINESS_TYPES.map((bt) => {
              const selected = businessType === bt.id;
              return (
                <div
                  key={bt.id}
                  onClick={() => setBusinessType(bt.id)}
                  className={`cursor-pointer p-3.5 rounded-md border transition-all flex flex-col justify-between ${
                    selected
                      ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                      : 'bg-[#f8f4ec] border-[#e3dccb] text-[#1a1a1a] hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-extrabold">{bt.label}</span>
                    {selected && <FiCheck className="text-[#d99a3d]" size={14} />}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{bt.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: SHOP / BUSINESS INFORMATION */}
        <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">2</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">SHOP BRANDING &amp; INFORMATION</h3>
              <p className="text-[11px] text-slate-500">Your storefront title, contact details, and business categories</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Shop / Business Name *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Kumar Electronics & Mobiles"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="10-digit primary contact number"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Pincode *</label>
              <input
                type="text"
                required
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="6-digit area pincode"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">City / Location</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Raipur, Bilaspur, Durg"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Full Business Address *</label>
            <textarea
              rows={2}
              required
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="Shop No, Building Name, Street, Landmark..."
              className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md p-3 text-xs font-medium text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
            />
          </div>
        </div>

        {/* SECTION 3: DECLARATION & TERMS */}
        <div className="bg-white rounded-md p-5 border border-[#e3dccb] shadow-xs space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#1c1a17] focus:ring-[#d99a3d] border-[#e3dccb]"
            />
            <span className="text-xs text-slate-700 leading-relaxed font-medium">
              I declare that all business details provided are authentic and accept the <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowTermsModal(true); }} className="font-extrabold text-[#d99a3d] underline cursor-pointer">BizReels Vendor Terms &amp; Conditions</span>.
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider shadow-xs hover:bg-[#342820] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <span>{loading ? 'Launching Vendor Portal...' : 'Register Storefront & Launch Vendor Portal'}</span>
          <FiArrowRight size={16} />
        </button>
      </form>
    </div>
  );
}
