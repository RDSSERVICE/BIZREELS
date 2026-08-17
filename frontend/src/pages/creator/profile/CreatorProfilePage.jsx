import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FiUser, FiSave, FiFileText } from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import { api, tokenStore } from '../../../lib/api';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

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

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('English, Hindi');
  const [experienceYears, setExperienceYears] = useState('2');
  const [city, setCity] = useState('Mumbai');
  const [travelAvailable, setTravelAvailable] = useState('Yes');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (creatorProfile) {
      setName(creatorProfile.name || user.name || '');
      setBio(creatorProfile.bio || '');
      setLanguages(creatorProfile.languages || 'English, Hindi');
      setExperienceYears(creatorProfile.experienceYears || '2');
      setCity(creatorProfile.city || user.city || 'Mumbai');
      setTravelAvailable(creatorProfile.travelAvailable ? 'Yes' : 'No');
      setProfilePhoto(creatorProfile.profilePhoto || '');
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
    try {
      const payload = {
        creatorProfile: {
          ...creatorProfile,
          name,
          bio,
          languages,
          experienceYears,
          city,
          travelAvailable: travelAvailable === 'Yes',
          profilePhoto,
          updatedAt: new Date().toISOString()
        }
      };

      const res = await updateProfileApi(payload).unwrap();
      dispatch(setCredentials({ user: res.user || res.data?.user }));
      toast.success('Creator profile updated!');
    } catch (err) {
      toast.error('Failed to update creator profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiUser}
        title="Creator Profile Details"
        subtitle="Update your stage name, bio pitch, language fluencies, and travel availability"
      />

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#e3dccb] pb-2 flex-wrap">
        <Link
          to="/creator/profile"
          className="px-4 py-2 rounded-xl text-xs font-black bg-[#241b15] text-[#d99a3d] shadow-xs flex items-center gap-2"
        >
          <FiUser className="w-3.5 h-3.5" />
          <span>Basic Profile</span>
        </Link>
        <Link
          to="/creator/onboarding-details"
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-[#1a1a1a] hover:bg-[#f8f4ec] transition flex items-center gap-2"
        >
          <FiFileText className="w-3.5 h-3.5" />
          <span>Full Creator Setup Details</span>
        </Link>
      </div>

      <form onSubmit={handleSave} className="glass rounded-2xl p-6 border border-white/50 shadow-card space-y-5">
        {/* Profile Photo Upload Section */}
        <div className="flex flex-col items-center gap-3 pb-4 border-b border-border">
          <div className="relative group">
            <img
              src={profilePhoto || '/logo.png'}
              alt="Profile Preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-brand-purple shadow-md bg-white p-0.5 animate-fade-in"
            />
            <label className="absolute bottom-0 right-0 p-2 bg-brand-purple text-white rounded-full cursor-pointer hover:bg-brand-purple/90 transition shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          </div>
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Creator Avatar</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Creator / Stage Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Base City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Languages Spoken</label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Years of Experience</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Travel Available (Outstation Shoot)</label>
            <select
              value={travelAvailable}
              onChange={(e) => setTravelAvailable(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
            >
              <option value="Yes">Yes (Available to Travel)</option>
              <option value="No">No (Local City Only)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block mb-1">Bio Pitch</label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-xl gradient-brand text-white font-bold text-xs shadow-premium hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          <FiSave size={16} /> Save Creator Profile
        </button>
      </form>
    </div>
  );
}
