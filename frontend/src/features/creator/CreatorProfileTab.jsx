import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useUpdateProfileMutation } from '../auth/authApi';
import { updateUser } from '../auth/authSlice';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { toast } from 'react-hot-toast';

const CreatorProfileTab = ({ user }) => {
  const dispatch = useDispatch();
  const [updateProfileApi, { isLoading: isUpdating }] = useUpdateProfileMutation();

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [bio, setBio] = useState(user?.creatorProfile?.bio || 'Professional content creator specializing in vertical short reels video campaigns.');
  const [languages, setLanguages] = useState((user?.creatorProfile?.languages || ['English', 'Hindi']).join(', '));
  const [experience, setExperience] = useState(user?.creatorProfile?.experience || '3+ years content creation');
  const [city, setCity] = useState(user?.creatorProfile?.city || 'Delhi');
  const [travelAvailable, setTravelAvailable] = useState(user?.creatorProfile?.travelAvailable ? 'Yes' : 'No');

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        avatarUrl,
        creatorProfile: {
          bio,
          languages: languages.split(',').map(l => l.trim()),
          experience,
          city,
          travelAvailable: travelAvailable === 'Yes',
        }
      };
      const res = await updateProfileApi(payload).unwrap();
      dispatch(updateUser(res.data.user));
      toast.success('Influencer Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update creator profile settings.');
    }
  };

  return (
    <form onSubmit={handleSaveProfile} className="glass p-6 rounded-2xl border border-white/50 shadow-glass flex flex-col gap-6 animate-fade-in">
      <div>
        <h3 className="text-sm font-bold text-brand-navy uppercase tracking-wider">Influencer Profile Settings</h3>
        <p className="text-xs text-slate-500 mt-1">Configure profile details visible in the local Brand Creator Marketplace catalog.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Full Display Name *"
          placeholder="e.g. Aditi Sharma"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Profile Photo URL"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Bio Proposal / Pitch *</label>
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Describe your style, video pacing, and sponsor niches..."
          className="w-full p-3.5 bg-slate-50/50 border border-slate-200 focus:border-brand-purple rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-purple/20 transition-all resize-none"
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Input
          label="Languages Spoken (comma separated)"
          placeholder="English, Hindi, Punjabi"
          value={languages}
          onChange={(e) => setLanguages(e.target.value)}
        />
        <Input
          label="Experience Duration"
          placeholder="e.g. 2+ years UGC content"
          value={experience}
          onChange={(e) => setExperience(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <Input
          label="Current Base City"
          placeholder="e.g. New Delhi"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-brand-navy uppercase tracking-wide">Travel Available (for shoots) *</label>
          <select
            value={travelAvailable}
            onChange={(e) => setTravelAvailable(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl bg-slate-50/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple transition-all h-[42px]"
          >
            <option value="Yes">Yes, available for domestic shoots</option>
            <option value="No">No, local storefront shoots only</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end mt-4 border-t border-slate-100 pt-4">
        <Button
          type="submit"
          disabled={isUpdating}
          variant="primary"
          className="text-xs py-2.5 px-6 rounded-xl cursor-pointer"
        >
          {isUpdating ? 'Saving...' : 'Save Influencer Profile'}
        </Button>
      </div>
    </form>
  );
};

export default CreatorProfileTab;
