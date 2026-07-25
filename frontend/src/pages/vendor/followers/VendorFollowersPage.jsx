import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiSearch, FiMessageSquare, FiTrendingUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { api, resolveMediaUrl } from '../../../lib/api';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';

export default function VendorFollowersPage() {
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
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header */}
      <AdminPageHeader
        icon={FiUsers}
        title="Followers & Audience"
        description="Monitor your followed users, target leads, and real-time audience engagement stats."
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass border border-white/50 p-5 rounded-2xl flex items-center gap-4 shadow-card">
          <div className="w-12 h-12 bg-brand-purple/10 text-brand-purple rounded-xl flex items-center justify-center">
            <FiUsers size={24} />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">Total Followers</span>
            <h3 className="text-xl font-black text-text-primary">{followers.length}</h3>
          </div>
        </div>

        <div className="glass border border-white/50 p-5 rounded-2xl flex items-center gap-4 shadow-card">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
            <FiTrendingUp size={24} />
          </div>
          <div>
            <span className="text-[10px] text-text-tertiary uppercase tracking-wider font-bold">Audience Growth</span>
            <h3 className="text-xl font-black text-emerald-600">+100%</h3>
          </div>
        </div>
      </div>

      {/* Followers Directory Card */}
      <div className="glass border border-white/50 rounded-3xl p-6 shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide">Followers Directory</h4>

          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search followers by name..."
              className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-xl text-xs text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-purple transition font-medium"
            />
            <FiSearch className="absolute left-3 top-2.5 text-text-tertiary" size={14} />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-3 border-brand-purple border-t-transparent rounded-full animate-spin" />
            <span className="text-[11px] text-text-tertiary">Loading audience...</span>
          </div>
        ) : filteredFollowers.length === 0 ? (
          <div className="text-center py-16 text-xs text-text-tertiary">
            {searchTerm ? 'No followers match your search.' : 'You do not have any followers yet. Post engaging reels to gain an audience!'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFollowers.map((follower) => {
              const profilePic = resolveMediaUrl(follower.profile_pic || follower.avatarUrl);
              const rolesList = follower.roles || ['customer'];

              return (
                <div
                  key={follower.id || follower._id}
                  className="bg-surface/50 border border-border rounded-2xl p-4 flex justify-between items-center gap-3 hover:bg-surface transition shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-tertiary overflow-hidden border border-border flex items-center justify-center font-bold text-brand-purple">
                      {follower.profile_pic || follower.avatarUrl ? (
                        <img src={profilePic} alt="" className="w-full h-full object-cover" />
                      ) : (
                        follower.name?.charAt(0) || 'F'
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-text-primary">{follower.name || 'Anonymous'}</h5>
                      <span className="text-[9px] bg-brand-purple/10 text-brand-purple px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                        {rolesList.join(', ')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleMessageFollower(follower)}
                    className="p-2.5 bg-surface border border-border hover:bg-surface-tertiary text-brand-purple rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-bold"
                    title="Send message"
                  >
                    <FiMessageSquare size={15} />
                    <span className="hidden sm:inline">Chat</span>
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
