import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiSearch, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api, resolveMediaUrl } from '../../../lib/api';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useLanguage } from '../../../context/LanguageContext';

export default function VendorFollowersPage() {
  const { bi, t } = useLanguage();
  const navigate = useNavigate();

  // State
  const [followers, setFollowers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch followers on mount
  const fetchFollowersList = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/follow/me/followers');
      const items = res.data?.items || res.data?.data?.items || res.data || [];
      setFollowers(Array.isArray(items) ? items : []);
    } catch (err) {
      toast.error('Failed to load followers list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowersList();
  }, []);

  // Filter followers by search
  const filteredFollowers = followers.filter((f) =>
    (f.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Message follower
  const handleMessageFollower = async (follower) => {
    try {
      await api.post('/v1/chat/messages', {
        recipientId: follower.id || follower._id,
        text: 'Hello!'
      });
      toast.success('Chat initiated!');
      navigate('/vendor/chat');
    } catch (err) {
      toast.error('Failed to initiate conversation');
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 font-sans animate-fade-in pb-16 p-2 sm:p-4">
      {/* Header */}
      <AdminPageHeader
        icon={FiUsers}
        title={bi('Followers & Loyal Audience', 'फॉलोअर्स और वफादार दर्शक (Followers)')}
        subtitle={bi('Track customers who follow your business and send direct broadcast messages', 'अपने व्यवसाय का अनुसरण करने वाले ग्राहकों को ट्रैक करें')}
      />

      {/* Stats Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{bi('TOTAL FOLLOWERS', 'कुल फॉलोअर्स')}</span>
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-[#1a1a1a] mt-1">
              {followers.length}
            </h3>
            <span className="text-xs text-slate-500 font-bold mt-0.5 block">{bi('Active Customers', 'सक्रिय ग्राहक')}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#241b15] text-[#d99a3d] flex items-center justify-center shrink-0">
            <FiUsers size={22} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">{bi('AUDIENCE REACH', 'दर्शकों तक पहुंच')}</span>
            <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-2xl text-emerald-700 mt-1">
              {bi('100% Direct', '100% प्रत्यक्ष')}
            </h3>
            <span className="text-xs text-slate-500 font-bold mt-0.5 block">{bi('Free Customer Updates', 'मुफ्त ग्राहक अपडेट')}</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <FiTrendingUp size={22} />
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#e3dccb] shadow-2xs">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={bi('Search followers by name...', 'नाम से फॉलोअर्स खोजें...')}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d]"
          />
          <FiSearch className="absolute left-3.5 top-3 text-slate-400" size={15} />
        </div>
      </div>

      {/* Followers List Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-[#d99a3d] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-500">{bi('Loading audience...', 'दर्शक लोड हो रहे हैं...')}</span>
          </div>
        ) : filteredFollowers.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-500 font-medium">
            {searchTerm
              ? bi('No followers match your search.', 'आपकी खोज से कोई फॉलोवर मेल नहीं खाता।')
              : bi('You do not have any followers yet. Post engaging reels to gain an audience!', 'आपके पास अभी तक कोई फॉलोवर नहीं है। नए दर्शक पाने के लिए रील्स पोस्ट करें!')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFollowers.map((follower) => {
              const profilePic = resolveMediaUrl(follower.profile_pic || follower.avatarUrl);
              const rolesList = follower.roles || ['customer'];

              return (
                <div
                  key={follower.id || follower._id}
                  className="bg-[#f8f4ec] border border-[#e3dccb] rounded-2xl p-4 flex justify-between items-center gap-3 hover:border-[#241b15] transition shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border-2 border-[#d99a3d] flex items-center justify-center font-black text-[#1a1a1a] overflow-hidden">
                      {follower.profile_pic || follower.avatarUrl ? (
                        <img src={profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        follower.name?.charAt(0) || 'F'
                      )}
                    </div>
                    <div>
                      <h5 className="font-extrabold text-xs text-[#1a1a1a]">{follower.name || 'Customer'}</h5>
                      <span className="text-[9px] bg-[#241b15] text-[#d99a3d] px-1.5 py-0.5 rounded font-black uppercase mt-1 inline-block">
                        {rolesList.join(', ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMessageFollower(follower)}
                    className="px-3 py-1.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#3a2c22] rounded-xl transition flex items-center gap-1.5 text-xs font-black cursor-pointer border-none"
                    title="Send message"
                  >
                    <FiMessageSquare size={14} />
                    <span className="hidden sm:inline">{bi('Chat', 'चैट')}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
