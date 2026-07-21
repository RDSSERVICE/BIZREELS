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

const CATEGORIES_DATA = {
  'Electronics & IT': ['Mobile & Accessories', 'Laptops & Computers', 'Home Appliances', 'Cameras & Audio', 'Repairs & Services'],
  'Fashion & Apparel': ['Men Clothing', 'Women Ethnic & Western', 'Kids Wear', 'Footwear', 'Jewellery & Watches'],
  'Restaurant & Food': ['Cafes & Fast Food', 'Fine Dining', 'Bakery & Sweets', 'Catering Services', 'Cloud Kitchen'],
  'Services & Repairs': ['Home Cleaning', 'Electrician & Plumber', 'Beauty & Wellness', 'AC Repair', 'Automobile Repair'],
  'Furniture & Home Decor': ['Living Room Furniture', 'Bedroom Furniture', 'Kitchen & Dining', 'Lighting & Decor'],
  'Automobile & Parts': ['Car Accessories', 'Two-Wheeler Spares', 'Car Washing', 'Tyres & Batteries'],
  'Grocery & Daily Essentials': ['Fresh Fruits & Vegetables', 'Dairy & Bakery', 'Packaged Food', 'Personal Care'],
  'Healthcare & Beauty': ['Pharmacy & Medicines', 'Cosmetics', 'Fitness & Gym', 'Ayurveda & Herbal'],
  'Real Estate & Construction': ['Property Rentals', 'Building Supplies', 'Interior Design', 'Contractors'],
  'Education & Coaching': ['Tuition Classes', 'Computer Training', 'Language Institutes', 'Music & Arts']
};

export default function BecomeVendorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [addRoleApi] = useAddRoleMutation();

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // 1. Business Type
  const [businessType, setBusinessType] = useState('Retailer');

  // 2. Shop / Business Info
  const [shopName, setShopName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState(['Electronics & IT']);
  const [selectedSubCategories, setSelectedSubCategories] = useState([]);
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

  useEffect(() => {
    if (pincode && pincode.length === 6) {
      handlePincodeLookup(pincode);
    }
  }, [pincode]);

  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        toast.error('Select at least one business category');
        return;
      }
      setSelectedCategories(selectedCategories.filter(c => c !== cat));
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

    setLoading(true);
    try {
      const vendorProfileData = {
        businessType,
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
      const roleRes = await addRoleApi({ role: 'vendor' }).unwrap();
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
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
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

          {/* Categories (Multiple Choice) */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Category (Select all that apply) *</label>
            <div className="flex flex-wrap gap-2">
              {Object.keys(CATEGORIES_DATA).map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                        : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                    }`}
                  >
                    {isSelected && '✓ '} {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Sub Categories */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-2">Sub Category (Multiple Choice)</label>
            <div className="flex flex-wrap gap-2">
              {selectedCategories.flatMap(cat => CATEGORIES_DATA[cat] || []).map((sub) => {
                const isSelected = selectedSubCategories.includes(sub);
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleSubCategory(sub)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                      isSelected
                        ? 'bg-brand-purple/20 text-brand-purple border-brand-purple'
                        : 'bg-surface-tertiary border-border text-text-tertiary hover:text-text-primary'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {sub}
                  </button>
                );
              })}
            </div>
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
                  className="w-full pr-16 pl-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
                <button
                  type="button"
                  onClick={() => handlePincodeLookup()}
                  disabled={pincodeLoading || pincode.length !== 6}
                  className="absolute right-1 px-2.5 py-1.5 bg-brand-purple text-white rounded-lg text-[10px] font-bold hover:opacity-90 transition disabled:opacity-50"
                >
                  {pincodeLoading ? 'Fetching...' : 'Lookup'}
                </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Opening Time</label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                  <input
                    type="text"
                    value={openingTime}
                    onChange={(e) => setOpeningTime(e.target.value)}
                    placeholder="e.g. 09:00 AM"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Closing Time</label>
                <div className="relative">
                  <FiClock className="absolute left-3 top-3 text-text-tertiary w-4 h-4" />
                  <input
                    type="text"
                    value={closingTime}
                    onChange={(e) => setClosingTime(e.target.value)}
                    placeholder="e.g. 09:00 PM"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">Weekly Off</label>
                <select
                  value={weeklyOff}
                  onChange={(e) => setWeeklyOff(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
                >
                  <option value="None">None (Open All Days)</option>
                  <option value="Sunday">Sunday</option>
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
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
              I hereby declare that all business details, addresses, and contact numbers provided are true, valid, and authentic. I accept the <span className="font-bold text-brand-purple underline">BizReels Vendor Terms & Conditions</span> and Privacy Policy.
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
    </div>
  );
}
