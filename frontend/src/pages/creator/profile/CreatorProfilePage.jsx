import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FiUser, FiMapPin, FiGlobe, FiBriefcase, FiSave } from 'react-icons/fi';
import { useGetMeQuery, useUpdateProfileMutation } from '../../../features/auth/authApi';
import { setCredentials } from '../../../features/auth/authSlice';
import toast from 'react-hot-toast';

export default function CreatorProfilePage() {
  const dispatch = useDispatch();
  const { user: authUser } = useSelector((state) => state.auth);
  const { data: profileRes } = useGetMeQuery();
  const [updateProfileApi] = useUpdateProfileMutation();

  const user = profileRes?.data?.user || profileRes?.user || authUser || {};
  const creatorProfile = user.creatorProfile || {};

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [languages, setLanguages] = useState('English, Hindi');
  const [experienceYears, setExperienceYears] = useState('2');
  const [city, setCity] = useState('Mumbai');
  const [travelAvailable, setTravelAvailable] = useState('Yes');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (creatorProfile) {
      setName(creatorProfile.name || user.name || '');
      setBio(creatorProfile.bio || '');
      setLanguages(creatorProfile.languages || 'English, Hindi');
      setExperienceYears(creatorProfile.experienceYears || '2');
      setCity(creatorProfile.city || user.city || 'Mumbai');
      setTravelAvailable(creatorProfile.travelAvailable ? 'Yes' : 'No');
    }
  }, [creatorProfile, user]);

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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-xl flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FiUser className="text-purple-400" />
            <span>Creator Profile Details</span>
          </h2>
          <p className="text-xs text-slate-400">Update your stage name, bio pitch, language fluencies, and travel availability</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Creator / Stage Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Base City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Languages Spoken</label>
            <input
              type="text"
              value={languages}
              onChange={(e) => setLanguages(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Years of Experience</label>
            <input
              type="number"
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Travel Available (Outstation Shoot)</label>
            <select
              value={travelAvailable}
              onChange={(e) => setTravelAvailable(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="Yes">Yes (Available to Travel)</option>
              <option value="No">No (Local City Only)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Bio Pitch</label>
          <textarea
            rows={4}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg transition flex items-center justify-center gap-2"
        >
          <FiSave size={16} />
          <span>Save Creator Profile</span>
        </button>
      </form>
    </div>
  );
}
