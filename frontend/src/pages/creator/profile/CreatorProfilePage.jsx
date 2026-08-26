import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiUser, FiFileText, FiCheck } from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import { api, tokenStore } from '../../../lib/api';
import toast from 'react-hot-toast';

import CreatorBasicInfoSection, { CREATOR_PROFESSIONS } from './components/CreatorBasicInfoSection';
import CreatorSocialMediaSection from './components/CreatorSocialMediaSection';
import CreatorAddressSection from './components/CreatorAddressSection';
import CreatorLanguagesSection from './components/CreatorLanguagesSection';

export default function CreatorProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !authUser && !tokenStore.getUser(),
  });
  const [updateProfileApi] = useUpdateProfileMutation();

  const user = profileRes?.data?.user || profileRes?.user || authUser || {};
  const creatorProfile = user.creatorProfile || {};

  // Basic Info state
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('Product Reel Creator');
  const [customProfession, setCustomProfession] = useState('');
  const [bio, setBio] = useState('');
  const [experienceYears, setExperienceYears] = useState('2');
  const [travelAvailable, setTravelAvailable] = useState('Yes');
  const [profilePhoto, setProfilePhoto] = useState('');

  // Languages Spoken state
  const [languages, setLanguages] = useState('English, Hindi');

  // Address Details state
  const [address, setAddress] = useState({
    street: '',
    areaLocality: '',
    city: 'Mumbai',
    district: '',
    state: 'Maharashtra',
    pincode: '',
    country: 'India'
  });

  // Social Media state
  const [socialMedia, setSocialMedia] = useState({
    instagram: { handleOrUrl: '', totalReels: '', totalFollowers: '' },
    facebook: { handleOrUrl: '', totalReels: '', totalFollowers: '' },
    customPlatforms: []
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && Object.keys(user).length > 0) {
      // 1. Basic Info
      setName(creatorProfile.name || user.name || '');

      const currentProf =
        creatorProfile.profession ||
        creatorProfile.category ||
        user.profession ||
        user.occupation ||
        'Product Reel Creator';

      if (CREATOR_PROFESSIONS.includes(currentProf)) {
        setProfession(currentProf);
        setCustomProfession('');
      } else {
        setProfession('Other / Custom Creative Field');
        setCustomProfession(currentProf || '');
      }

      setBio(creatorProfile.bio || '');
      setExperienceYears(creatorProfile.experienceYears || '2');
      setTravelAvailable(creatorProfile.travelAvailable ? 'Yes' : 'No');
      setProfilePhoto(creatorProfile.profilePhoto || user.avatarUrl || user.profile_pic || '');

      // 2. Languages
      const rawLang = creatorProfile.languages || user.language || 'English, Hindi';
      const normalizedLangStr = Array.isArray(rawLang)
        ? rawLang.join(', ')
        : typeof rawLang === 'string'
        ? rawLang
        : 'English, Hindi';
      setLanguages(normalizedLangStr);

      // 3. Address
      const existingAddr =
        typeof creatorProfile.address === 'object' && creatorProfile.address
          ? creatorProfile.address
          : {};
      const userLoc = user.location || {};
      setAddress({
        street: existingAddr.street || userLoc.address || '',
        areaLocality: existingAddr.areaLocality || '',
        city: existingAddr.city || creatorProfile.city || user.city || userLoc.city || 'Mumbai',
        district: existingAddr.district || userLoc.district || '',
        state: existingAddr.state || creatorProfile.state || userLoc.state || 'Maharashtra',
        pincode: existingAddr.pincode || creatorProfile.pincode || userLoc.pincode || '',
        country: existingAddr.country || 'India'
      });

      // 4. Social Media
      const rawSm = creatorProfile.socialMedia;
      let insta = { handleOrUrl: '', totalReels: '', totalFollowers: '' };
      let fb = { handleOrUrl: '', totalReels: '', totalFollowers: '' };
      let custom = [];

      if (Array.isArray(rawSm)) {
        rawSm.forEach((item) => {
          const pName = (item.platform || '').toLowerCase();
          if (pName === 'instagram') {
            insta = {
              handleOrUrl: item.handleOrUrl || item.url || item.handle || '',
              totalReels: item.totalReels !== undefined ? item.totalReels : '',
              totalFollowers: item.totalFollowers || item.followers || ''
            };
          } else if (pName === 'facebook') {
            fb = {
              handleOrUrl: item.handleOrUrl || item.url || item.handle || '',
              totalReels: item.totalReels !== undefined ? item.totalReels : '',
              totalFollowers: item.totalFollowers || item.followers || ''
            };
          } else {
            custom.push({
              id: item.id || Date.now() + Math.random().toString(),
              name: item.platform || 'Custom',
              handleOrUrl: item.handleOrUrl || item.url || item.handle || '',
              totalReels: item.totalReels !== undefined ? item.totalReels : '',
              totalFollowers: item.totalFollowers || item.followers || ''
            });
          }
        });
      } else if (rawSm && typeof rawSm === 'object') {
        if (rawSm.instagram) insta = { ...insta, ...rawSm.instagram };
        if (rawSm.facebook) fb = { ...fb, ...rawSm.facebook };
        if (Array.isArray(rawSm.customPlatforms)) custom = rawSm.customPlatforms;
      } else {
        // Fallbacks from previous data models
        if (creatorProfile.portfolio?.instagramLink || creatorProfile.socialLinks?.instagram) {
          insta.handleOrUrl = creatorProfile.portfolio?.instagramLink || creatorProfile.socialLinks?.instagram || '';
        }
        if (creatorProfile.portfolio?.facebookLink || creatorProfile.socialLinks?.facebook) {
          fb.handleOrUrl = creatorProfile.portfolio?.facebookLink || creatorProfile.socialLinks?.facebook || '';
        }
      }

      setSocialMedia({
        instagram: insta,
        facebook: fb,
        customPlatforms: custom
      });
    }
  }, [creatorProfile, user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    const toastId = toast.loading('Uploading profile picture...');
    try {
      const res = await api.post('/v1/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const url = res.data?.data?.url || res.data?.url || res.data?.data;
      if (url) {
        setProfilePhoto(url);
        toast.success('Profile picture uploaded!', { id: toastId });
      } else {
        throw new Error('Image URL not found in response');
      }
    } catch (err) {
      toast.error('Failed to upload profile picture.', { id: toastId });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const resolvedProf =
      profession === 'Other / Custom Creative Field' ? customProfession.trim() : profession;

    const normalizedCity = address.city?.trim() || 'Mumbai';

    // Compile social media list
    const socialMediaList = [
      {
        platform: 'Instagram',
        handleOrUrl: socialMedia.instagram?.handleOrUrl?.trim() || '',
        totalReels:
          socialMedia.instagram?.totalReels !== '' ? Number(socialMedia.instagram.totalReels) : 0,
        totalFollowers: socialMedia.instagram?.totalFollowers?.trim() || ''
      },
      {
        platform: 'Facebook',
        handleOrUrl: socialMedia.facebook?.handleOrUrl?.trim() || '',
        totalReels:
          socialMedia.facebook?.totalReels !== '' ? Number(socialMedia.facebook.totalReels) : 0,
        totalFollowers: socialMedia.facebook?.totalFollowers?.trim() || ''
      },
      ...(socialMedia.customPlatforms || [])
        .filter((p) => p.name?.trim() || p.handleOrUrl?.trim())
        .map((p) => ({
          id: p.id,
          platform: p.name?.trim() || 'Custom',
          handleOrUrl: p.handleOrUrl?.trim() || '',
          totalReels: p.totalReels !== '' ? Number(p.totalReels) : 0,
          totalFollowers: p.totalFollowers?.trim() || ''
        }))
    ];

    try {
      const payload = {
        name,
        city: normalizedCity,
        profession: resolvedProf,
        occupation: resolvedProf,
        language: languages,
        location: {
          address: [address.street, address.areaLocality].filter(Boolean).join(', '),
          city: normalizedCity,
          district: address.district?.trim() || '',
          state: address.state?.trim() || '',
          pincode: address.pincode?.trim() || ''
        },
        creatorProfile: {
          ...creatorProfile,
          name,
          profession: resolvedProf,
          category: resolvedProf,
          bio,
          languages,
          experienceYears,
          city: normalizedCity,
          state: address.state?.trim() || '',
          pincode: address.pincode?.trim() || '',
          address: {
            street: address.street?.trim() || '',
            areaLocality: address.areaLocality?.trim() || '',
            city: normalizedCity,
            district: address.district?.trim() || '',
            state: address.state?.trim() || '',
            pincode: address.pincode?.trim() || '',
            country: address.country?.trim() || 'India'
          },
          socialMedia: socialMediaList,
          socialLinks: {
            instagram: socialMedia.instagram?.handleOrUrl?.trim() || '',
            facebook: socialMedia.facebook?.handleOrUrl?.trim() || ''
          },
          portfolio: {
            ...(creatorProfile.portfolio || {}),
            instagramLink: socialMedia.instagram?.handleOrUrl?.trim() || '',
            facebookLink: socialMedia.facebook?.handleOrUrl?.trim() || ''
          },
          travelAvailable: travelAvailable === 'Yes',
          profilePhoto,
          updatedAt: new Date().toISOString()
        }
      };

      const res = await updateProfileApi(payload).unwrap();
      dispatch(setCredentials({ user: res.user || res.data?.user }));
      toast.success('Creator profile updated successfully!');
    } catch (err) {
      console.error('Failed to update creator profile:', err);
      toast.error(err?.data?.message || 'Failed to update creator profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans p-2 sm:p-4 min-h-screen">
      {/* Header Banner in Onboarding Style */}
      <div className="bg-[#241b15] text-white p-6 rounded-md border-2 border-[#241b15] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">
            CREATOR PROFILE &amp; SOCIAL METRICS
          </span>
          <h1
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-xl sm:text-2xl uppercase tracking-wide text-white"
          >
            CREATOR PROFILE DETAILS
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Manage your stage name, social media metrics, physical studio address, and language fluencies.
          </p>
        </div>

        <div className="w-10 h-10 rounded-full bg-[#d99a3d] text-[#1a1a1a] flex items-center justify-center font-black shrink-0 border border-[#1a1a1a]">
          <FiUser size={20} />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e3dccb] pb-2 flex-wrap">
        <Link
          to="/creator/profile"
          className="px-4 py-2 rounded-md text-xs font-black bg-[#241b15] text-[#d99a3d] shadow-xs flex items-center gap-2"
        >
          <FiUser className="w-3.5 h-3.5" />
          <span>Basic &amp; Social Profile</span>
        </Link>
        <Link
          to="/creator/onboarding-details"
          className="px-4 py-2 rounded-md text-xs font-bold text-slate-600 hover:text-[#1a1a1a] hover:bg-[#f8f4ec] transition flex items-center gap-2"
        >
          <FiFileText className="w-3.5 h-3.5" />
          <span>Full Creator Setup Details</span>
        </Link>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* SECTION 1: BASIC INFORMATION & BIO */}
        <CreatorBasicInfoSection
          name={name}
          setName={setName}
          profession={profession}
          setProfession={setProfession}
          customProfession={customProfession}
          setCustomProfession={setCustomProfession}
          experienceYears={experienceYears}
          setExperienceYears={setExperienceYears}
          travelAvailable={travelAvailable}
          setTravelAvailable={setTravelAvailable}
          bio={bio}
          setBio={setBio}
          profilePhoto={profilePhoto}
          handlePhotoUpload={handlePhotoUpload}
        />

        {/* SECTION 2: SOCIAL MEDIA STATS & HANDLES */}
        <CreatorSocialMediaSection
          socialMedia={socialMedia}
          setSocialMedia={setSocialMedia}
        />

        {/* SECTION 3: STUDIO ADDRESS & PHYSICAL LOCATION */}
        <CreatorAddressSection
          address={address}
          setAddress={setAddress}
        />

        {/* SECTION 4: LANGUAGES SPOKEN */}
        <CreatorLanguagesSection
          languages={languages}
          setLanguages={setLanguages}
        />

        {/* SUBMIT BUTTON AT THE VERY END (NON-STICKY, NATURAL FLOW) */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 bg-[#241b15] text-[#d99a3d] border border-[#241b15] rounded-md text-xs font-black uppercase tracking-wider shadow-xs hover:bg-[#342820] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <FiCheck size={16} />
          <span>{saving ? 'Saving Creator Profile...' : 'Save Creator Profile'}</span>
        </button>
      </form>
    </div>
  );
}
