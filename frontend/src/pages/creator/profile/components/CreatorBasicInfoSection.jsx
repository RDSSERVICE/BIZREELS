import React from 'react';
import { FiCamera } from 'react-icons/fi';

export const CREATOR_PROFESSIONS = [
  'Product Reel Creator',
  'Product Photographer / Videographer',
  'Video Editor',
  'Graphic Designer',
  'UGC Creator / Brand Reviewer',
  'Influencer / Content Creator',
  'Voice Over Artist / Podcaster',
  'AI Content Creator & Visualizer',
  'Script Writer / Copywriter',
  'Drone Videographer',
  'Livestream Host / Model',
  'Thumbnail & Creative Artist',
  'Cinematographer / Filmmaker',
  'Fashion / Lifestyle Creator',
  'Food & Travel Vlogger',
  'Other / Custom Creative Field'
];

export default function CreatorBasicInfoSection({
  name,
  setName,
  profession,
  setProfession,
  customProfession,
  setCustomProfession,
  experienceYears,
  setExperienceYears,
  travelAvailable,
  setTravelAvailable,
  bio,
  setBio,
  profilePhoto,
  handlePhotoUpload
}) {
  return (
    <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
      {/* Section Header with Onboarding Number Badge */}
      <div className="border-b border-[#e3dccb] pb-3 flex items-center gap-3">
        <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">
          1
        </span>
        <div>
          <h3
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
            className="text-sm uppercase text-[#1a1a1a]"
          >
            BASIC CREATOR PROFILE &amp; BIO
          </h3>
          <p className="text-[11px] text-slate-500">
            Your public stage identity, avatar, creator specialty, and deal pitch
          </p>
        </div>
      </div>

      {/* Profile Photo Upload Section */}
      <div className="flex flex-col items-center gap-2 pb-2">
        <div className="relative group">
          <img
            src={profilePhoto || '/logo.png'}
            alt="Profile Preview"
            className="w-24 h-24 rounded-full object-cover border-2 border-[#d99a3d] shadow-sm bg-white p-0.5"
          />
          <label className="absolute bottom-0 right-0 p-2 bg-[#241b15] text-[#d99a3d] border border-[#d99a3d] rounded-full cursor-pointer hover:bg-[#342820] transition shadow-md">
            <FiCamera className="w-4 h-4" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </label>
        </div>
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
          Creator Avatar Photo
        </span>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Stage Name */}
        <div>
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
            Display / Stage Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Rahul Media / @rahulcreates"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
          />
        </div>

        {/* Profession / Category */}
        <div>
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
            Profession / Creator Category *
          </label>
          <select
            value={profession}
            onChange={(e) => {
              setProfession(e.target.value);
              if (e.target.value !== 'Other / Custom Creative Field') {
                setCustomProfession('');
              }
            }}
            className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
          >
            {CREATOR_PROFESSIONS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {profession === 'Other / Custom Creative Field' && (
            <input
              type="text"
              value={customProfession}
              onChange={(e) => setCustomProfession(e.target.value)}
              placeholder="Enter your custom creative specialization..."
              className="w-full mt-2 bg-[#f8f4ec] border border-[#d99a3d] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none"
            />
          )}
        </div>

        {/* Years of Experience */}
        <div>
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
            Years of Experience
          </label>
          <input
            type="number"
            min="0"
            max="40"
            placeholder="2"
            value={experienceYears}
            onChange={(e) => setExperienceYears(e.target.value)}
            className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
          />
        </div>

        {/* Travel Available */}
        <div>
          <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
            Travel Availability (Outstation Shoots)
          </label>
          <select
            value={travelAvailable}
            onChange={(e) => setTravelAvailable(e.target.value)}
            className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] cursor-pointer"
          >
            <option value="Yes">Yes (Available to Travel)</option>
            <option value="No">No (Local City Only)</option>
          </select>
        </div>
      </div>

      {/* Bio Pitch */}
      <div>
        <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block mb-1">
          Brand Pitch &amp; Bio Summary
        </label>
        <textarea
          rows={3}
          placeholder="Tell brand vendors about your style, turnaround time, camera gear, and why they should hire you..."
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
        />
      </div>
    </div>
  );
}
