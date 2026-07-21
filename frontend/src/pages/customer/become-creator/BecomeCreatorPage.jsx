import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiVideo, FiUser, FiCamera, FiDollarSign, FiMapPin, FiGlobe,
  FiArrowRight, FiCheck, FiMail, FiPhone, FiMessageSquare, FiUploadCloud,
  FiCalendar, FiAward, FiClock, FiInstagram, FiYoutube, FiFacebook,
  FiCompass, FiLayers, FiScissors
} from 'react-icons/fi';
import { useAddRoleMutation } from '../../../features/auth/authApi';
import { setCredentials, selectCurrentUser } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { api } from '../../../lib/api';

const CREATOR_CATEGORIES = [
  'Product Reel Creator', 'Product Photographer', 'Video Editor',
  'Graphic Designer', 'UGC Creator', 'Influencer', 'Voice Over Artist',
  'AI Content Creator', 'Script Writer', 'Copywriter', 'Thumbnail Designer',
  'Animation Creator', 'Drone Videographer', 'Livestream Host'
];

const SKILLS_LIST = [
  'Video Shooting', 'Video Editing', 'Photo Editing', 'AI Video',
  'AI Image', 'Canva', 'CapCut', 'Premiere Pro', 'After Effects',
  'Photoshop', 'Mobile Editing'
];

const LANGUAGES_LIST = [
  'Hindi', 'English', 'Chhattisgarhi', 'Marathi', 'Tamil',
  'Telugu', 'Punjabi', 'Others'
];

const EXPERIENCE_LEVELS = [
  'Fresher', '0–1 Year', '1–3 Years', '3–5 Years', '5+ Years'
];

const WORK_TYPES = [
  'Available Now', 'Part-Time', 'Full-Time', 'Weekends Only', 'Online Only', 'On-Site Available'
];

export default function BecomeCreatorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [addRoleApi] = useAddRoleMutation();

  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // 1. Basic Information
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [displayName, setDisplayName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(currentUser?.profile_pic || '');
  const [dob, setDob] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [gender, setGender] = useState('Male');

  // 2. Contact Details
  const [mobileNumber, setMobileNumber] = useState(currentUser?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');

  // 3. Location
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [liveLocation, setLiveLocation] = useState(false);

  // 4. Creator Category
  const [selectedCategories, setSelectedCategories] = useState(['Product Reel Creator', 'UGC Creator']);

  // 5. Skills
  const [selectedSkills, setSelectedSkills] = useState(['Video Shooting', 'Mobile Editing', 'CapCut']);

  // 6. Languages
  const [selectedLanguages, setSelectedLanguages] = useState(['Hindi', 'English']);

  // 7. Experience
  const [experience, setExperience] = useState('1–3 Years');

  // 8. Pricing
  const [reelPrice, setReelPrice] = useState('500');
  const [photoShootPrice, setPhotoShootPrice] = useState('1000');
  const [hourlyRate, setHourlyRate] = useState('800');
  const [dailyRate, setDailyRate] = useState('4000');
  const [monthlyCollaboration, setMonthlyCollaboration] = useState('15000');
  const [negotiable, setNegotiable] = useState(true);

  // 9. Availability
  const [availableNow, setAvailableNow] = useState(true);
  const [workTypes, setWorkTypes] = useState(['Part-Time', 'On-Site Available']);
  const [travelRadius, setTravelRadius] = useState('25 KM');

  // 10. Portfolio
  const [instagramLink, setInstagramLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [facebookLink, setFacebookLink] = useState('');
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [portfolioVideoLink, setPortfolioVideoLink] = useState('');

  // 11. Terms Declaration
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
      toast.error('Could not auto-fetch pincode data');
    } finally {
      setPincodeLoading(false);
    }
  };

  useEffect(() => {
    if (pincode && pincode.length === 6) {
      handlePincodeLookup(pincode);
    }
  }, [pincode]);

  const toggleArrayItem = (item, array, setArray) => {
    if (array.includes(item)) {
      if (array.length === 1) {
        toast.error('Select at least one option');
        return;
      }
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  // Image Upload helper
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
        toast.success('Image uploaded!', { id: toastId });
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
    if (!fullName || !displayName) {
      toast.error('Full Name & Display Name are required');
      return;
    }
    if (!mobileNumber) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!pincode || pincode.length !== 6) {
      toast.error('Valid 6-digit PIN code required');
      return;
    }
    if (!ageConfirmed) {
      toast.error('Must be 18 years or older to register as a Creator');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept Creator Terms & Declaration');
      return;
    }

    setLoading(true);
    try {
      const creatorProfileData = {
        name: fullName,
        displayName: displayName || fullName,
        profilePhoto,
        dob,
        ageConfirmed: true,
        gender,
        mobileNumber,
        whatsappNumber: whatsappNumber || mobileNumber,
        email,
        location: {
          country,
          state: stateName,
          district: district || city,
          city,
          areaLocality,
          pincode,
          liveLocation
        },
        categories: selectedCategories,
        skills: selectedSkills,
        languages: selectedLanguages,
        experience,
        pricing: {
          reelPrice: Number(reelPrice) || 0,
          photoShootPrice: Number(photoShootPrice) || 0,
          hourlyRate: Number(hourlyRate) || 0,
          dailyRate: Number(dailyRate) || 0,
          monthlyCollaboration: Number(monthlyCollaboration) || 0,
          negotiable
        },
        availabilityStatus: availableNow ? 'Available Now' : 'Busy',
        workTypes,
        travelRadius,
        portfolio: {
          instagramLink,
          youtubeLink,
          facebookLink,
          portfolioImages,
          portfolioVideoLink
        },
        verificationStatus: 'unverified',
        contactVerified: {
          mobile: true,
          whatsapp: false,
          email: !!email
        },
        createdAt: new Date().toISOString()
      };

      // 1. Update Profile in backend
      await api.patch('/v1/users/me', {
        creatorProfile: creatorProfileData,
        city: city || currentUser?.city || 'Local'
      });

      // 2. Add 'creator' role
      const roleRes = await addRoleApi({ role: 'creator' }).unwrap();
      const updatedUser = roleRes.user || roleRes.data?.user || roleRes;

      // 3. Switch active role to 'creator'
      try {
        await api.post('/v1/users/me/switch-role', { role: 'creator' });
      } catch (e) {}

      dispatch(setCredentials({
        user: {
          ...updatedUser,
          current_role: 'creator',
          activeRole: 'creator',
          creatorProfile: creatorProfileData
        }
      }));

      toast.success('🎉 Congratulations! Creator Studio is launched successfully!');
      navigate('/creator/dashboard', { replace: true });
    } catch (err) {
      toast.error('Failed to register creator profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiVideo}
        title="Become a Verified Creator / Influencer"
        subtitle="Monetize your creative talents! Post promotional reels, take brand photo shoots, offer video editing, UGC, or AI content services to local vendors on BizReels."
      />

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* SECTION 1: BASIC INFORMATION */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-brand-purple text-white flex items-center justify-center font-bold text-sm shadow-md">1</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Basic Information</h3>
              <p className="text-xs text-text-tertiary">Personal branding, profile photo, and 18+ age verification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Display / Stage Name *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Media / @rahulcreates"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Gender (Optional)</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          {/* Profile Photo Upload & 18+ Confirmation */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full border border-dashed border-border bg-surface flex items-center justify-center overflow-hidden flex-shrink-0">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FiCamera className="w-6 h-6 text-text-tertiary" />
                )}
              </div>
              <label className="cursor-pointer px-3.5 py-2 glass border border-border rounded-xl text-xs font-bold text-brand-purple hover:bg-brand-purple/5 transition flex items-center gap-2">
                <FiUploadCloud size={14} /> Upload Profile Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setProfilePhoto)} />
              </label>
            </div>

            <label className="flex items-center gap-2 cursor-pointer bg-surface px-3 py-2 rounded-xl border border-border">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-brand-purple focus:ring-brand-purple border-border"
              />
              <span className="text-xs font-semibold text-text-primary">I confirm I am 18+ years of age *</span>
            </label>
          </div>
        </div>

        {/* SECTION 2: CONTACT DETAILS */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-brand-pink text-white flex items-center justify-center font-bold text-sm shadow-md">2</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Contact Details</h3>
              <p className="text-xs text-text-tertiary">Direct contact channels for vendor campaign offers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  placeholder="e.g. creator@bizreels.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: LOCATION & ADDRESS */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-sm shadow-md">3</span>
              <div>
                <h3 className="text-base font-bold text-text-primary font-display">Location & Address</h3>
                <p className="text-xs text-text-tertiary">Type PIN code to auto-fetch State, District, & City</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border">
              <span className="text-xs font-bold text-text-primary">Live Location</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={liveLocation}
                  onChange={(e) => setLiveLocation(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
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
              <label className="block text-xs font-semibold text-text-secondary mb-1">City / Base Town</label>
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
                placeholder="Area locality"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: CREATOR CATEGORY */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-md">4</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Creator Category</h3>
              <p className="text-xs text-text-tertiary">Select all creator roles that apply to your expertise</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {CREATOR_CATEGORIES.map((cat) => {
              const selected = selectedCategories.includes(cat);
              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => toggleArrayItem(cat, selectedCategories, setSelectedCategories)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    selected
                      ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                      : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                  }`}
                >
                  {selected ? '✓ ' : '+ '} {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: SKILLS */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md">5</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Skills & Software Tools</h3>
              <p className="text-xs text-text-tertiary">Technical skills and editing software masteries</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {SKILLS_LIST.map((skill) => {
              const selected = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleArrayItem(skill, selectedSkills, setSelectedSkills)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    selected
                      ? 'bg-brand-pink text-white border-brand-pink shadow-sm'
                      : 'bg-surface border-border text-text-secondary hover:border-brand-pink/40'
                  }`}
                >
                  {selected ? '✓ ' : '+ '} {skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 6: LANGUAGES */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm shadow-md">6</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Languages Spoken</h3>
              <p className="text-xs text-text-tertiary">Select all languages you create content in</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {LANGUAGES_LIST.map((lang) => {
              const selected = selectedLanguages.includes(lang);
              return (
                <button
                  type="button"
                  key={lang}
                  onClick={() => toggleArrayItem(lang, selectedLanguages, setSelectedLanguages)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    selected
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                      : 'bg-surface border-border text-text-secondary hover:border-emerald-500/40'
                  }`}
                >
                  {selected ? '✓ ' : '+ '} {lang}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 7: EXPERIENCE */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md">7</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Experience Level</h3>
              <p className="text-xs text-text-tertiary">Total years of content creation or media experience</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {EXPERIENCE_LEVELS.map((exp) => {
              const selected = experience === exp;
              return (
                <div
                  key={exp}
                  onClick={() => setExperience(exp)}
                  className={`cursor-pointer p-3 rounded-2xl border text-center font-bold text-xs transition-all ${
                    selected
                      ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                      : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                  }`}
                >
                  {exp}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 8: PRICING & COMMERCIAL PACKAGES */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-5">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md">8</span>
              <div>
                <h3 className="text-base font-bold text-text-primary font-display">Pricing & Commercials (INR ₹)</h3>
                <p className="text-xs text-text-tertiary">Set starting rates for vendor bookings</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border">
              <span className="text-xs font-bold text-text-primary">Rates Negotiable</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={negotiable}
                  onChange={(e) => setNegotiable(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">Reel Price (₹)</label>
              <input
                type="number"
                value={reelPrice}
                onChange={(e) => setReelPrice(e.target.value)}
                placeholder="500"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">Photo Shoot Price (₹)</label>
              <input
                type="number"
                value={photoShootPrice}
                onChange={(e) => setPhotoShootPrice(e.target.value)}
                placeholder="1000"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">Hourly Rate (₹/hr)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="800"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">Daily Rate (₹/day)</label>
              <input
                type="number"
                value={dailyRate}
                onChange={(e) => setDailyRate(e.target.value)}
                placeholder="4000"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">Monthly Collab (₹)</label>
              <input
                type="number"
                value={monthlyCollaboration}
                onChange={(e) => setMonthlyCollaboration(e.target.value)}
                placeholder="15000"
                className="w-full px-3 py-2 bg-surface border border-border rounded-xl text-xs font-bold text-text-primary"
              />
            </div>
          </div>
        </div>

        {/* SECTION 9: AVAILABILITY & WORK MODEL */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md">9</span>
              <div>
                <h3 className="text-base font-bold text-text-primary font-display">Availability & Travel Setup</h3>
                <p className="text-xs text-text-tertiary">Work models and outstation travel coverage</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-surface px-3 py-1.5 rounded-xl border border-border">
              <span className="text-xs font-bold text-text-primary">Available Now</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={availableNow}
                  onChange={(e) => setAvailableNow(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-surface-tertiary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <label className="block text-xs font-semibold text-text-secondary">Work Type / Availability Model</label>
            <div className="flex flex-wrap gap-2">
              {WORK_TYPES.map((wt) => {
                const selected = workTypes.includes(wt);
                return (
                  <button
                    type="button"
                    key={wt}
                    onClick={() => toggleArrayItem(wt, workTypes, setWorkTypes)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      selected
                        ? 'bg-brand-purple text-white border-brand-purple shadow-sm'
                        : 'bg-surface border-border text-text-secondary hover:border-brand-purple/40'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '} {wt}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Travel Coverage Radius</label>
            <select
              value={travelRadius}
              onChange={(e) => setTravelRadius(e.target.value)}
              className="w-full sm:w-1/2 px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
            >
              <option value="5 KM">Local City (5 KM)</option>
              <option value="10 KM">10 KM Radius</option>
              <option value="25 KM">25 KM Radius</option>
              <option value="50 KM">50 KM Radius</option>
              <option value="100 KM+">100 KM+ (Statewide / Travel)</option>
            </select>
          </div>
        </div>

        {/* SECTION 10: PORTFOLIO & SOCIAL LINKS */}
        <div className="glass rounded-2xl p-6 sm:p-8 border border-border shadow-card space-y-4">
          <div className="border-b border-border pb-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-sm shadow-md">10</span>
            <div>
              <h3 className="text-base font-bold text-text-primary font-display">Portfolio & Social Handles</h3>
              <p className="text-xs text-text-tertiary">Showcase your past work and social profiles</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Instagram Profile Link</label>
              <div className="relative">
                <FiInstagram className="absolute left-3 top-3 text-pink-500 w-4 h-4" />
                <input
                  type="url"
                  value={instagramLink}
                  onChange={(e) => setInstagramLink(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">YouTube Channel Link</label>
              <div className="relative">
                <FiYoutube className="absolute left-3 top-3 text-red-500 w-4 h-4" />
                <input
                  type="url"
                  value={youtubeLink}
                  onChange={(e) => setYoutubeLink(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Facebook / Other Link</label>
              <div className="relative">
                <FiFacebook className="absolute left-3 top-3 text-blue-600 w-4 h-4" />
                <input
                  type="url"
                  value={facebookLink}
                  onChange={(e) => setFacebookLink(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Sample Portfolio Video URL / Reel Link</label>
            <input
              type="url"
              value={portfolioVideoLink}
              onChange={(e) => setPortfolioVideoLink(e.target.value)}
              placeholder="e.g. Drive link or Reel link showcasing your work"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs font-semibold text-text-primary"
            />
          </div>
        </div>

        {/* SECTION 11: DECLARATION & CREATOR TERMS */}
        <div className="glass rounded-2xl p-6 border border-border shadow-card space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-brand-purple focus:ring-brand-purple border-border"
            />
            <span className="text-xs text-text-secondary leading-relaxed">
              I hereby declare that all creator details, portfolio links, and contact channels provided are authentic. I accept the <span className="font-bold text-brand-purple underline">BizReels Creator Terms & Monetization Policy</span>.
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-4 gradient-brand text-white rounded-2xl text-sm font-bold shadow-premium hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span>{loading ? 'Activating Creator Profile...' : 'Complete Registration & Launch Creator Studio'}</span>
          <FiArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
