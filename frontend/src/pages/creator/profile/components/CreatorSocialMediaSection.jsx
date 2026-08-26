import React from 'react';
import { FaInstagram, FaFacebook, FaGlobe, FaPlus, FaTrash } from 'react-icons/fa';
import { FiFilm, FiUsers, FiLink } from 'react-icons/fi';

export default function CreatorSocialMediaSection({
  socialMedia,
  setSocialMedia
}) {
  const { instagram, facebook, customPlatforms = [] } = socialMedia;

  const updateInstagram = (field, value) => {
    setSocialMedia((prev) => ({
      ...prev,
      instagram: { ...prev.instagram, [field]: value }
    }));
  };

  const updateFacebook = (field, value) => {
    setSocialMedia((prev) => ({
      ...prev,
      facebook: { ...prev.facebook, [field]: value }
    }));
  };

  const addCustomPlatform = () => {
    setSocialMedia((prev) => ({
      ...prev,
      customPlatforms: [
        ...(prev.customPlatforms || []),
        { id: Date.now().toString(), name: '', handleOrUrl: '', totalReels: '', totalFollowers: '' }
      ]
    }));
  };

  const updateCustomPlatform = (id, field, value) => {
    setSocialMedia((prev) => ({
      ...prev,
      customPlatforms: (prev.customPlatforms || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeCustomPlatform = (id) => {
    setSocialMedia((prev) => ({
      ...prev,
      customPlatforms: (prev.customPlatforms || []).filter((item) => item.id !== id)
    }));
  };

  return (
    <div className="bg-white rounded-md p-5 sm:p-6 border border-[#e3dccb] shadow-xs space-y-4">
      {/* Section Header with Onboarding Number Badge */}
      <div className="border-b border-[#e3dccb] pb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded bg-[#241b15] text-[#d99a3d] flex items-center justify-center font-black text-xs">
            2
          </span>
          <div>
            <h3
              style={{ fontFamily: "'Archivo Black', sans-serif" }}
              className="text-sm uppercase text-[#1a1a1a]"
            >
              SOCIAL MEDIA STATS &amp; HANDLES
            </h3>
            <p className="text-[11px] text-slate-500">
              Link your Instagram, Facebook, and custom channels with uploaded reels and follower counts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={addCustomPlatform}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#f8f4ec] border border-[#e3dccb] text-[#1a1a1a] hover:bg-[#e3dccb] text-xs font-extrabold transition cursor-pointer"
        >
          <FaPlus className="w-3 h-3 text-[#d99a3d]" />
          <span>+ Add Custom Platform</span>
        </button>
      </div>

      {/* Social Media Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[620px]">
          <thead>
            <tr className="border-b border-[#e3dccb] text-[10px] font-extrabold text-slate-500 uppercase tracking-widest bg-[#f8f4ec]">
              <th className="py-2.5 px-3 rounded-l-md w-1/4">Platform Name</th>
              <th className="py-2.5 px-3 w-1/3">
                <span className="flex items-center gap-1">
                  <FiLink className="w-3 h-3 text-[#d99a3d]" /> ID Link / Username
                </span>
              </th>
              <th className="py-2.5 px-3 w-1/5">
                <span className="flex items-center gap-1">
                  <FiFilm className="w-3 h-3 text-amber-600" /> Total Reels
                </span>
              </th>
              <th className="py-2.5 px-3 w-1/5">
                <span className="flex items-center gap-1">
                  <FiUsers className="w-3 h-3 text-emerald-600" /> Total Followers
                </span>
              </th>
              <th className="py-2.5 px-2 text-center rounded-r-md w-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e3dccb]/70 text-xs">
            {/* Instagram Row */}
            <tr className="hover:bg-[#f8f4ec]/50 transition">
              <td className="py-3 px-3">
                <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <FaInstagram className="w-3.5 h-3.5" />
                  </div>
                  <span>Instagram</span>
                </div>
              </td>
              <td className="py-3 px-3">
                <input
                  type="text"
                  placeholder="@yourusername or https://instagram.com/..."
                  value={instagram?.handleOrUrl || ''}
                  onChange={(e) => updateInstagram('handleOrUrl', e.target.value)}
                  className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </td>
              <td className="py-3 px-3">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 85"
                  value={instagram?.totalReels ?? ''}
                  onChange={(e) => updateInstagram('totalReels', e.target.value)}
                  className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </td>
              <td className="py-3 px-3">
                <input
                  type="text"
                  placeholder="e.g. 25.4K"
                  value={instagram?.totalFollowers || ''}
                  onChange={(e) => updateInstagram('totalFollowers', e.target.value)}
                  className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </td>
              <td className="py-3 px-2 text-center text-slate-400 text-[11px] font-bold">
                Default
              </td>
            </tr>

            {/* Facebook Row */}
            <tr className="hover:bg-[#f8f4ec]/50 transition">
              <td className="py-3 px-3">
                <div className="flex items-center gap-2 font-bold text-[#1a1a1a]">
                  <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <FaFacebook className="w-3.5 h-3.5" />
                  </div>
                  <span>Facebook</span>
                </div>
              </td>
              <td className="py-3 px-3">
                <input
                  type="text"
                  placeholder="Page URL or profile link"
                  value={facebook?.handleOrUrl || ''}
                  onChange={(e) => updateFacebook('handleOrUrl', e.target.value)}
                  className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </td>
              <td className="py-3 px-3">
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 40"
                  value={facebook?.totalReels ?? ''}
                  onChange={(e) => updateFacebook('totalReels', e.target.value)}
                  className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </td>
              <td className="py-3 px-3">
                <input
                  type="text"
                  placeholder="e.g. 12K"
                  value={facebook?.totalFollowers || ''}
                  onChange={(e) => updateFacebook('totalFollowers', e.target.value)}
                  className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                />
              </td>
              <td className="py-3 px-2 text-center text-slate-400 text-[11px] font-bold">
                Default
              </td>
            </tr>

            {/* Custom Platforms Rows */}
            {customPlatforms.map((platform) => (
              <tr key={platform.id} className="hover:bg-[#f8f4ec]/50 transition bg-[#f8f4ec]/20">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                      <FaGlobe className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Platform name (e.g. YouTube / TikTok)"
                      value={platform.name}
                      onChange={(e) => updateCustomPlatform(platform.id, 'name', e.target.value)}
                      className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-2.5 py-1.5 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                    />
                  </div>
                </td>
                <td className="py-3 px-3">
                  <input
                    type="text"
                    placeholder="Profile URL or ID handle"
                    value={platform.handleOrUrl}
                    onChange={(e) => updateCustomPlatform(platform.id, 'handleOrUrl', e.target.value)}
                    className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                </td>
                <td className="py-3 px-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 50"
                    value={platform.totalReels ?? ''}
                    onChange={(e) => updateCustomPlatform(platform.id, 'totalReels', e.target.value)}
                    className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                </td>
                <td className="py-3 px-3">
                  <input
                    type="text"
                    placeholder="e.g. 50K"
                    value={platform.totalFollowers}
                    onChange={(e) => updateCustomPlatform(platform.id, 'totalFollowers', e.target.value)}
                    className="w-full bg-[#f8f4ec] border border-[#e3dccb] rounded-md px-3 py-2 text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
                  />
                </td>
                <td className="py-3 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeCustomPlatform(platform.id)}
                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition cursor-pointer"
                    title="Remove Platform"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {customPlatforms.length === 0 && (
        <div className="flex items-center justify-between p-3 rounded-md bg-[#f8f4ec] border border-dashed border-[#e3dccb] text-[11px] text-slate-600">
          <span>Showcase YouTube, Snapchat, or other video portfolios by clicking &quot;+ Add Custom Platform&quot;.</span>
          <button
            type="button"
            onClick={addCustomPlatform}
            className="text-[#d99a3d] font-black hover:underline cursor-pointer"
          >
            + Add Platform
          </button>
        </div>
      )}
    </div>
  );
}
