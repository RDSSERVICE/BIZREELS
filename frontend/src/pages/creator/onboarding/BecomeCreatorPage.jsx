import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiVideo, FiUser, FiCamera, FiDollarSign, FiMapPin, FiGlobe,
  FiArrowRight, FiCheck, FiMail, FiPhone, FiMessageSquare, FiUploadCloud,
  FiCalendar, FiAward, FiClock,
  FiCompass, FiLayers, FiScissors
} from 'react-icons/fi';
import { FaInstagram, FaYoutube, FaFacebook } from 'react-icons/fa';
import { useAddRoleMutation, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { setCredentials, selectCurrentUser } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';
import { api, tokenStore } from '../../../lib/api';

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

export default function BecomeCreatorPage({ isEditMode = false }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [addRoleApi] = useAddRoleMutation();
  const [updateProfileApi] = useUpdateProfileMutation();

  const isExistingCreator = currentUser?.roles?.includes('creator') && !!currentUser?.creatorProfile?.displayName;
  const effectiveEditMode = isEditMode || isExistingCreator;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [loading, setLoading] = useState(false);

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
  const [otherLanguage, setOtherLanguage] = useState('');

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
  const [portfolioVideoLink, setPortfolioVideoLink] = useState('');

  // 11. Terms Declaration
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate form data when user already has creatorProfile (Edit Mode)
  useEffect(() => {
    const cp = currentUser?.creatorProfile;
    if (cp && !isHydrated) {
      if (cp.fullName || currentUser?.name) setFullName(cp.fullName || currentUser?.name);
      if (cp.displayName) setDisplayName(cp.displayName);
      if (cp.profilePhoto || currentUser?.profile_pic) setProfilePhoto(cp.profilePhoto || currentUser?.profile_pic);
      if (cp.dob) setDob(cp.dob.includes('T') ? cp.dob.split('T')[0] : cp.dob);
      if (cp.gender) setGender(cp.gender);
      if (cp.mobileNumber || currentUser?.phone) setMobileNumber(cp.mobileNumber || currentUser?.phone);
      if (cp.whatsappNumber || currentUser?.phone) setWhatsappNumber(cp.whatsappNumber || currentUser?.phone);
      if (cp.email || currentUser?.email) setEmail(cp.email || currentUser?.email);

      const addr = (typeof cp.address === 'object' && cp.address) ? cp.address : {};
      if (addr.country) setCountry(addr.country);
      if (addr.pincode || cp.pincode || currentUser?.location?.pincode) setPincode(addr.pincode || cp.pincode || currentUser?.location?.pincode || '');
      if (addr.state || cp.state || currentUser?.location?.state) setStateName(addr.state || cp.state || currentUser?.location?.state || '');
      if (addr.district || cp.district || currentUser?.location?.district) setDistrict(addr.district || cp.district || currentUser?.location?.district || '');
      if (addr.city || cp.city || currentUser?.location?.city) setCity(addr.city || cp.city || currentUser?.location?.city || '');
      if (addr.areaLocality || cp.areaLocality) setAreaLocality(addr.areaLocality || cp.areaLocality || '');
      if (addr.liveLocation !== undefined) setLiveLocation(addr.liveLocation);

      if (cp.creatorCategories && Array.isArray(cp.creatorCategories) && cp.creatorCategories.length > 0) {
        setSelectedCategories(cp.creatorCategories);
      } else if (cp.categories && Array.isArray(cp.categories) && cp.categories.length > 0) {
        setSelectedCategories(cp.categories);
      }
      if (cp.skills && Array.isArray(cp.skills) && cp.skills.length > 0) {
        setSelectedSkills(cp.skills);
      }
      if (cp.languages && Array.isArray(cp.languages) && cp.languages.length > 0) {
        setSelectedLanguages(cp.languages);
      }
      if (cp.experience) setExperience(cp.experience);

      if (cp.pricing) {
        if (cp.pricing.reelPrice !== undefined) setReelPrice(String(cp.pricing.reelPrice));
        if (cp.pricing.photoShootPrice !== undefined) setPhotoShootPrice(String(cp.pricing.photoShootPrice));
        if (cp.pricing.hourlyRate !== undefined) setHourlyRate(String(cp.pricing.hourlyRate));
        if (cp.pricing.dailyRate !== undefined) setDailyRate(String(cp.pricing.dailyRate));
        if (cp.pricing.monthlyCollaboration !== undefined) setMonthlyCollaboration(String(cp.pricing.monthlyCollaboration));
        if (cp.pricing.negotiable !== undefined) setNegotiable(cp.pricing.negotiable);
      }

      if (cp.availability) {
        if (cp.availability.availableNow !== undefined) setAvailableNow(cp.availability.availableNow);
        if (cp.availability.workTypes && Array.isArray(cp.availability.workTypes)) setWorkTypes(cp.availability.workTypes);
        if (cp.availability.travelRadius) setTravelRadius(cp.availability.travelRadius);
      }

      if (cp.portfolio) {
        if (cp.portfolio.instagramLink) setInstagramLink(cp.portfolio.instagramLink);
        if (cp.portfolio.youtubeLink) setYoutubeLink(cp.portfolio.youtubeLink);
        if (cp.portfolio.facebookLink) setFacebookLink(cp.portfolio.facebookLink);
        if (cp.portfolio.portfolioVideoLink) setPortfolioVideoLink(cp.portfolio.portfolioVideoLink);
      }

      setTermsAccepted(true);
      setIsHydrated(true);
    }
  }, [currentUser, isHydrated]);

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

    if (!fullName || !displayName) {
      toast.error('Full Name and Display Name are required');
      return;
    }
    if (!mobileNumber) {
      toast.error('Mobile Number is required');
      return;
    }
    if (!ageConfirmed) {
      toast.error('You must confirm you are 18+ years of age');
      return;
    }
    if (!termsAccepted) {
      toast.error('Please accept the Creator Terms & Policy');
      return;
    }

    setLoading(true);
    try {
      const creatorProfileData = {
        ...(currentUser?.creatorProfile || {}),
        fullName,
        displayName,
        profilePhoto,
        dob,
        ageConfirmed,
        gender,
        mobileNumber,
        whatsappNumber: whatsappNumber || mobileNumber,
        email,
        address: {
          country,
          pincode,
          state: stateName,
          district: district || city,
          city,
          areaLocality,
          liveLocation
        },
        creatorCategories: selectedCategories,
        categories: selectedCategories,
        skills: selectedSkills,
        languages: selectedLanguages.includes('Others') && otherLanguage
          ? [...selectedLanguages.filter((l) => l !== 'Others'), otherLanguage]
          : selectedLanguages,
        experience,
        pricing: {
          reelPrice: Number(reelPrice) || 0,
          photoShootPrice: Number(photoShootPrice) || 0,
          hourlyRate: Number(hourlyRate) || 0,
          dailyRate: Number(dailyRate) || 0,
          monthlyCollaboration: Number(monthlyCollaboration) || 0,
          negotiable
        },
        availability: {
          availableNow,
          workTypes,
          travelRadius
        },
        portfolio: {
          instagramLink,
          youtubeLink,
          facebookLink,
          portfolioVideoLink
        },
        termsAccepted: true,
        updatedAt: new Date().toISOString()
      };

      if (!creatorProfileData.createdAt) {
        creatorProfileData.createdAt = new Date().toISOString();
      }

      if (effectiveEditMode) {
        // In-place Update Mode: Save profile via updateProfileApi to ensure DB update & cache invalidation
        const payload = {
          profile_pic: profilePhoto || currentUser?.profile_pic || undefined,
          avatarUrl: profilePhoto || currentUser?.avatarUrl || undefined,
          creatorProfile: creatorProfileData,
          city: city || currentUser?.city || 'Local'
        };

        const res = await updateProfileApi(payload).unwrap();
        const updatedUser = res.user || res.data?.user || res.data || res;

        if (updatedUser) {
          dispatch(setCredentials({ user: updatedUser }));
          tokenStore.setUser(updatedUser);
        }

        toast.success('Creator profile updated successfully in database!');
      } else {
        // First time Onboarding flow
        await api.patch('/v1/users/me', {
          profile_pic: profilePhoto || currentUser?.profile_pic || undefined,
          avatarUrl: profilePhoto || currentUser?.avatarUrl || undefined,
          creatorProfile: creatorProfileData,
          city: city || currentUser?.city || 'Local'
        });

        const roleRes = await addRoleApi({ role: 'creator', profileData: creatorProfileData }).unwrap();
        const updatedUser = roleRes.user || roleRes.data?.user || roleRes;

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

        toast.success('🎉 Congratulations! Your Creator Studio is launched!');
        navigate('/creator/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.data?.message || 'Failed to save creator profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans p-2 sm:p-4 min-h-screen">
      {/* Header Banner */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            {effectiveEditMode ? 'CREATOR STUDIO PROFILE & SETUP' : 'START EARNING WITH VIDEO'}
          </span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white">
            {effectiveEditMode ? 'UPDATE CREATOR PROFILE' : 'JOIN AS A CREATOR'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {effectiveEditMode
              ? 'Update your services, pricing packages, portfolio reels, and work availability.'
              : 'Create product reels, shoots, and UGC videos for local business vendors and earn money on BizReels.'}
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiVideo size={20} />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: BASIC INFORMATION */}
        <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">1</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">BASIC CREATOR PROFILE</h3>
              <p className="text-[11px] text-slate-500">Your public stage name and creator identity</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Display / Stage Name *</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Rahul Media / @rahulcreates"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Date of Birth *</label>
              <input
                type="date"
                required
                value={dob}
                max={todayStr}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 2: CREATOR CATEGORIES & SKILLS */}
        <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">2</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">CATEGORIES &amp; SKILLS</h3>
              <p className="text-[11px] text-slate-500">Select your content specialization and video skills</p>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Select Creator Categories *</label>
            <div className="flex flex-wrap gap-1.5">
              {CREATOR_CATEGORIES.map((cat) => {
                const selected = selectedCategories.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleArrayItem(cat, selectedCategories, setSelectedCategories)}
                    className={`px-3 py-1.5 rounded-md text-xs font-extrabold transition cursor-pointer border ${
                      selected
                        ? 'bg-[#241b15] text-[#d99a3d] border-[#241b15] shadow-xs'
                        : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2">Skills &amp; Tools</label>
            <div className="flex flex-wrap gap-1.5">
              {SKILLS_LIST.map((skill) => {
                const selected = selectedSkills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    onClick={() => toggleArrayItem(skill, selectedSkills, setSelectedSkills)}
                    className={`px-3 py-1.5 rounded-md text-xs font-extrabold transition cursor-pointer border ${
                      selected
                        ? 'bg-[#d99a3d] text-[#1a1a1a] border-[#1c1a17] shadow-xs'
                        : 'bg-[#f8f4ec] border-[#e3dccb] text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* SECTION 3: PRICING TIERS */}
        <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
          <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
            <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">3</span>
            <div>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase text-[#1a1a1a]">COMMISSION &amp; PRICING TIERS</h3>
              <p className="text-[11px] text-slate-500">Configure rate cards for vendors hiring your content services</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Product Reel Price (₹)</label>
              <input
                type="number"
                value={reelPrice}
                onChange={(e) => setReelPrice(e.target.value)}
                placeholder="500"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Photo Shoot Rate (₹)</label>
              <input
                type="number"
                value={photoShootPrice}
                onChange={(e) => setPhotoShootPrice(e.target.value)}
                placeholder="1000"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Hourly Rate (₹)</label>
              <input
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="800"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">Monthly Collab (₹)</label>
              <input
                type="number"
                value={monthlyCollaboration}
                onChange={(e) => setMonthlyCollaboration(e.target.value)}
                placeholder="15000"
                className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: DECLARATION & TERMS */}
        <div className="bg-white rounded-md p-5 border border-[#e3dccb] shadow-xs space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#1c1a17] focus:ring-[#d99a3d] border-[#e3dccb]"
            />
            <span className="text-xs text-slate-700 leading-relaxed font-medium">
              I declare that all creator details provided are authentic and accept the <span className="font-extrabold text-[#d99a3d] underline">BizReels Creator Monetization Terms</span>.
            </span>
          </label>
        </div>

        {/* SUBMIT BUTTON */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider shadow-xs hover:bg-[#342820] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {effectiveEditMode ? (
            <>
              <FiCheck size={16} />
              <span>{loading ? 'Saving Changes...' : 'Update Creator Profile'}</span>
            </>
          ) : (
            <>
              <span>{loading ? 'Activating Creator Studio...' : 'Register Profile & Launch Creator Studio'}</span>
              <FiArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}