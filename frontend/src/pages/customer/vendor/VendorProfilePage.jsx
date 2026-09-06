import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiMapPin, FiGlobe, FiPhone, FiClock, FiHeart, FiMessageCircle,
  FiBookmark, FiShare2, FiStar, FiInfo, FiCheck, FiUserPlus,
  FiSend, FiPackage, FiTool, FiAlertTriangle, FiInstagram, FiFacebook,
  FiGrid, FiTrash2, FiTag, FiX
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api, resolveMediaUrl } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import SEO from '../../../components/common/SEO';
import { selectCurrentUser } from '../../../features/auth/authSlice';

export default function VendorProfilePage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const currentUser = useSelector(selectCurrentUser);

  // Profile data & loading
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tab & Action States
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'reels' | 'products' | 'services' | 'reviews' | 'about'
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Modals & Forms
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [submittingMessage, setSubmittingMessage] = useState(false);

  const [selectedPost, setSelectedPost] = useState(null);
  const [postCommentText, setPostCommentText] = useState('');
  const [postComments, setPostComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── Fetch Profile & Feed Data ──────────────────────────────
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // 1. Fetch main profile aggregator
      const res = await api.get(`/v1/vendors/${vendorId}/profile`);
      const profileData = res.data?.data || {};
      setProfile(profileData);
      setIsFollowing(!!profileData.viewer_following);
      setFollowersCount(profileData.stats?.followers || 0);

      // 2. Fetch posts (reels/images)
      const postsRes = await api.get(`/v1/reels?creatorId=${vendorId}`);
      const postsList = postsRes.data?.data?.reels || postsRes.data?.reels || postsRes.data?.data || postsRes.data || [];
      setPosts(Array.isArray(postsList) ? postsList : []);

      // 3. Fetch listings (products/services)
      const listingsRes = await api.get(`/v1/vendors/${vendorId}/listings`);
      const listingsList = listingsRes.data?.items || listingsRes.data?.data?.items || listingsRes.data || [];
      setListings(Array.isArray(listingsList) ? listingsList : []);

      // 4. Fetch reviews
      const reviewsRes = await api.get(`/v1/reviews/user/${vendorId}`);
      const reviewsList = reviewsRes.data?.data?.reviews || reviewsRes.data?.reviews || reviewsRes.data?.data || [];
      setReviews(Array.isArray(reviewsList) ? reviewsList : []);

    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load vendor profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();

    // ── Socket.IO Real-Time Counters Sync ────────────────────
    const socket = getSocket();
    if (socket) {
      // Join vendor profile room
      socket.emit('join_conversation', vendorId);

      const handleStatsUpdate = (data) => {
        if (data.vendorId === vendorId) {
          if (data.followersCount !== undefined) {
            setFollowersCount(data.followersCount);
          }
          // Update profile local stats mapping
          setProfile(prev => {
            if (!prev) return null;
            return {
              ...prev,
              stats: {
                ...prev.stats,
                followers: data.followersCount !== undefined ? data.followersCount : prev.stats.followers,
                likes: data.likesCount !== undefined ? data.likesCount : prev.stats.likes,
                views: data.viewsCount !== undefined ? data.viewsCount : prev.stats.views,
              }
            };
          });
        }
      };

      const handleFollowingUpdate = (data) => {
        if (data.vendorId === vendorId) {
          setIsFollowing(data.following);
        }
      };

      const handlePresenceChange = (data) => {
        if (data.userId === vendorId) {
          setProfile(prev => prev ? { ...prev, online_status: data.status } : prev);
        }
      };

      socket.on('vendor_stats_update', handleStatsUpdate);
      socket.on('following_update', handleFollowingUpdate);
      socket.on('user_presence_change', handlePresenceChange);

      return () => {
        socket.emit('leave_conversation', vendorId);
        socket.off('vendor_stats_update', handleStatsUpdate);
        socket.off('following_update', handleFollowingUpdate);
        socket.off('user_presence_change', handlePresenceChange);
      };
    }
  }, [vendorId]);

  // ── Follow / Unfollow Handling ─────────────────────────────
  const handleFollowToggle = async () => {
    if (!vendorId || typeof vendorId !== 'string') {
      toast.error('Vendor details are currently unavailable');
      return;
    }
    // Optimistic Update
    const originalFollowing = isFollowing;
    const originalCount = followersCount;
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => isFollowing ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (originalFollowing) {
        await api.delete(`/v1/follow/${vendorId}`);
        toast.success(`Unfollowed ${profile?.business_name || 'vendor'}`);
      } else {
        await api.post(`/v1/follow/${vendorId}`);
        toast.success(`Following ${profile?.business_name || 'vendor'}`);
      }
    } catch (err) {
      setIsFollowing(originalFollowing);
      setFollowersCount(originalCount);
      const status = err.response?.status;
      const errorMsg = err.response?.data?.message || err.response?.data?.error;
      if (status === 404) {
        toast.error('Vendor profile is no longer available');
      } else {
        toast.error(errorMsg || 'Failed to update follow status');
      }
    }
  };

  // ── Send Message handling ──────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    setSubmittingMessage(true);
    try {
      await api.post('/v1/chat/messages', {
        recipientId: vendorId,
        text: messageText.trim()
      });
      toast.success('Message delivered successfully!');
      setIsMessageModalOpen(false);
      setMessageText('');
      const name = encodeURIComponent(profile?.business_name || profile?.shop_name || profile?.name || 'Vendor');
      const avatar = encodeURIComponent(profile?.profile_pic || profile?.avatar || profile?.logo || '');
      navigate(`/customer/chat?vendorId=${vendorId}&name=${name}&avatar=${avatar}`);
    } catch (err) {
      toast.error('Failed to deliver message');
    } finally {
      setSubmittingMessage(false);
    }
  };

  // ── Share Profile Handling ─────────────────────────────────
  const handleShareProfile = async () => {
    const url = window.location.href;
    const name = profile?.business_name || profile?.shop_name || profile?.name || 'Vendor Profile';
    const shareData = {
      title: name,
      text: `Check out ${name} on BizReels!`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('🔗 Profile link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy profile link');
    }
  };

  // ── Report Profile Handling ────────────────────────────────
  const handleReportProfile = () => {
    toast.success('Report submitted. Our moderation team will audit this profile shortly.');
  };

  // ── Post Details Modal (Comments & Likes) ──────────────────
  const handleOpenPostDetails = async (post) => {
    setSelectedPost(post);
    setPostComments([]);
    setLoadingComments(true);
    try {
      const res = await api.get(`/v1/reels/${post._id}/comments`);
      const list = res.data?.data?.comments || res.data?.comments || res.data?.data || res.data?.items || [];
      setPostComments(Array.isArray(list) ? list : []);
    } catch (e) {
      setPostComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostLike = async (postId) => {
    try {
      const res = await api.post(`/v1/reels/${postId}/like`);
      const data = res.data?.data || res.data || {};
      const nextLiked = data.hasLiked !== undefined ? data.hasLiked : !selectedPost?.hasLiked;

      // Update selectedPost
      setSelectedPost(prev => {
        if (!prev || prev._id !== postId) return prev;
        const wasLiked = !!prev.hasLiked;
        const delta = nextLiked ? (wasLiked ? 0 : 1) : (wasLiked ? -1 : 0);
        return {
          ...prev,
          hasLiked: nextLiked,
          likesCount: Math.max(0, (prev.likesCount || 0) + delta),
        };
      });

      // Update in posts list
      setPosts(prev => prev.map(p => {
        if (p._id === postId) {
          const wasLiked = !!p.hasLiked;
          const delta = nextLiked ? (wasLiked ? 0 : 1) : (wasLiked ? -1 : 0);
          return {
            ...p,
            hasLiked: nextLiked,
            likesCount: Math.max(0, (p.likesCount || 0) + delta),
          };
        }
        return p;
      }));

      // Update overall profile stats likes count
      setProfile(prev => {
        if (!prev) return prev;
        const delta = nextLiked ? 1 : -1;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            likes: Math.max(0, (prev.stats?.likes || 0) + delta)
          }
        };
      });

      toast.success(nextLiked ? 'Liked reel!' : 'Unliked reel');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update like status');
    }
  };

  const handlePostCommentSubmit = async (e) => {
    e.preventDefault();
    if (!postCommentText.trim() || !selectedPost) return;

    const content = postCommentText.trim();
    setPostCommentText('');
    try {
      const res = await api.post(`/v1/reels/${selectedPost._id}/comments`, { content, text: content });
      const commentObj = res.data?.data?.comment || res.data?.comment || {
        _id: `temp_${Date.now()}`,
        content,
        userId: {
          _id: currentUser?._id,
          name: currentUser?.name || 'You',
          avatarUrl: currentUser?.avatarUrl || currentUser?.profile_pic,
          activeRole: currentUser?.activeRole,
        },
        createdAt: new Date().toISOString(),
      };
      setPostComments(prev => [commentObj, ...prev]);
      setSelectedPost(prev => prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev);
      setPosts(prev => prev.map(p => p._id === selectedPost._id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      toast.success('Comment posted!');
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to submit comment');
    }
  };

  const handleDeletePostComment = async (commentId) => {
    try {
      await api.delete(`/v1/reels/comments/${commentId}`);
      setPostComments(prev => prev.filter(c => (c._id || c.id) !== commentId));
      setSelectedPost(prev => prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) } : prev);
      setPosts(prev => prev.map(p => p._id === selectedPost?._id ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 1) - 1) } : p));
      toast.success('Comment deleted');
    } catch (err) {
      toast.error('Failed to delete comment');
    }
  };

  // ── Review Submission ──────────────────────────────────────
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setSubmittingReview(true);
    try {
      await api.post('/v1/reviews', {
        targetUserId: vendorId,
        rating: reviewRating,
        comment: reviewComment.trim()
      });
      toast.success('⭐ Review submitted successfully!');
      setReviewComment('');
      // Refetch reviews & profile stats
      fetchProfileData();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const vendorName = profile?.shop_name || profile?.business_name || profile?.name || 'Vendor Profile';
  const vendorAvatarUrl = profile?.avatar || profile?.logo || profile?.profile_pic
    ? resolveMediaUrl(profile.avatar || profile.logo || profile.profile_pic)
    : 'https://bizreels.in/logo.png';
  const canonicalUrl = `https://bizreels.in/customer/vendor/${vendorId}`;

  const vendorStructuredData = React.useMemo(() => {
    if (!profile) return [];

    const isServiceBiz = (profile.business_category || '').toLowerCase().includes('service');
    const localBizSchema = {
      '@context': 'https://schema.org',
      '@type': isServiceBiz ? 'ProfessionalService' : 'LocalBusiness',
      'name': vendorName,
      'image': vendorAvatarUrl,
      'description': profile.bio || profile.description || `${vendorName} on BizReels marketplace.`,
      'url': canonicalUrl,
      'telephone': profile.phone || profile.whatsapp || undefined,
      ...(profile.location?.address || profile.city ? {
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': profile.location?.address || undefined,
          'addressLocality': profile.city || profile.location?.city || undefined,
          'addressRegion': profile.location?.state || undefined,
          'postalCode': profile.location?.pincode || undefined,
          'addressCountry': 'IN',
        }
      } : {}),
      ...(profile.rating_avg && profile.rating_avg > 0 ? {
        'aggregateRating': {
          '@type': 'AggregateRating',
          'ratingValue': profile.rating_avg,
          'reviewCount': profile.rating_count || 1,
        }
      } : {}),
    };

    const breadcrumbs = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://bizreels.in/' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Vendors', 'item': 'https://bizreels.in/customer/search' },
        { '@type': 'ListItem', 'position': 3, 'name': vendorName, 'item': canonicalUrl },
      ]
    };

    return [localBizSchema, breadcrumbs];
  }, [profile, vendorName, vendorAvatarUrl, canonicalUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-[#d99a3d] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-text-tertiary">Loading vendor profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 bg-white border border-[#e3dccb] rounded-2xl max-w-lg mx-auto shadow-xs">
        <FiAlertTriangle className="mx-auto text-[#d99a3d] w-12 h-12 mb-4" />
        <h3 className="font-bold text-base text-[#1a1a1a]">Vendor Profile Not Found</h3>
        <p className="text-xs text-text-tertiary mt-2">This business profile may have been closed or is temporarily unavailable.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-5 py-2.5 bg-[#1c1a17] text-[#d99a3d] font-extrabold text-xs rounded-xl shadow-2xs hover:bg-[#2b2520] transition">
          Go Back
        </button>
      </div>
    );
  }

  // Filter listings
  const products = listings.filter(l => l.type === 'product');
  const services = listings.filter(l => l.type === 'service');
  const videosList = posts.filter(p => p.mediaType === 'video' || p.videoUrl?.endsWith('.mp4'));

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in relative pb-10">
      <SEO
        title={`${vendorName} — Local Business`}
        description={profile.bio || profile.description || `Discover ${vendorName} on BizReels marketplace.`}
        canonical={canonicalUrl}
        ogImage={vendorAvatarUrl}
        ogType="profile"
        structuredData={vendorStructuredData}
      />
      
      {/* ── PROFILE HEADER (COVER BANNER & OVERLAPPING AVATAR) ── */}
      <div className="bg-white rounded-3xl border border-[#e3dccb] overflow-hidden shadow-xs relative">
        {/* Cover Banner */}
        <div className="h-44 sm:h-56 w-full relative overflow-hidden">
          {profile.cover_banner ? (
            <img src={resolveMediaUrl(profile.cover_banner)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full relative overflow-hidden bg-[#1c1a17]">
              {/* Warm Editorial Bento-Brutalism background (harmonized with BizReels brand) */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#d99a3d]/25 via-[#2b221a]/85 to-[#161311]" />
              {/* Subtle geometric dot matrix */}
              <div
                className="absolute inset-0 opacity-[0.08]"
                style={{
                  backgroundImage: 'radial-gradient(#d99a3d 1.2px, transparent 1.2px)',
                  backgroundSize: '24px 24px',
                }}
              />
              {/* Ambient amber glow */}
              <div className="absolute -right-10 -bottom-10 w-56 h-56 rounded-full bg-[#d99a3d]/15 blur-3xl pointer-events-none" />
              {/* Subtle branded watermark */}
              <div className="absolute left-8 top-1/2 -translate-y-1/2 select-none pointer-events-none opacity-[0.08]">
                <span className="font-heading font-black text-6xl sm:text-8xl tracking-tight text-[#d99a3d] uppercase">
                  BIZREELS
                </span>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
          
          {/* Online/Offline Status Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/65 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-lg">
            {profile.online_status === 'online' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
                <span className="text-emerald-300">Online</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-slate-300">Offline</span>
              </>
            )}
          </div>
        </div>

        {/* Profile Top Row: Overlapping Avatar on Left + Action Buttons on Right */}
        <div className="px-6 sm:px-8 relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 sm:-mt-18">
          {/* Avatar Picture */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 bg-white ring-4 ring-[#d99a3d]/35 shadow-xl relative z-10 flex-shrink-0 mx-auto sm:mx-0">
            <div className="w-full h-full bg-white rounded-full overflow-hidden border-2 border-white">
              {profile.profile_pic ? (
                <img src={resolveMediaUrl(profile.profile_pic)} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#f4ede3] flex items-center justify-center text-4xl font-black text-[#1c1a17] font-heading">
                  {profile.business_name?.charAt(0) || profile.name?.charAt(0) || 'V'}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons (cleanly positioned on the white background) */}
          <div className="flex items-center gap-2.5 justify-center sm:justify-end pb-1 flex-wrap">
            <button
              onClick={handleFollowToggle}
              className={`px-5 py-2.5 rounded-full font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer ${
                isFollowing
                  ? 'bg-white border border-[#e3dccb] text-slate-700 hover:bg-[#f5efe4]'
                  : 'bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a]'
              }`}
            >
              {isFollowing ? <><FiCheck size={14} /> Following</> : <><FiUserPlus size={14} /> Follow</>}
            </button>

            <button
              onClick={() => setIsMessageModalOpen(true)}
              className="px-5 py-2.5 bg-white border border-[#e3dccb] hover:bg-[#f5efe4] text-[#1a1a1a] font-extrabold text-xs rounded-full transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <FiMessageCircle size={14} /> Message
            </button>

            <button
              onClick={handleShareProfile}
              className="p-2.5 bg-white border border-[#e3dccb] hover:bg-[#f5efe4] text-slate-700 rounded-full transition cursor-pointer"
              title="Share Profile"
            >
              <FiShare2 size={16} />
            </button>

            <button
              onClick={handleReportProfile}
              className="p-2.5 bg-white border border-[#e3dccb] hover:bg-[#f5efe4] text-red-500 rounded-full transition cursor-pointer"
              title="Report Profile"
            >
              <FiAlertTriangle size={16} />
            </button>
          </div>
        </div>

        {/* Profile Details Container (100% on clean white card background — zero banner overlap!) */}
        <div className="px-6 sm:px-8 pt-3 pb-5 space-y-2.5 text-center sm:text-left">
          {/* Business Name + Verified Badge + Category Pill Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-[#1a1a1a] font-display tracking-tight">
              {profile.business_name}
            </h1>
            <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
              {profile.verified_badge && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#d99a3d]/15 text-[#b0741c] border border-[#d99a3d]/30 text-[10px] font-black rounded-full uppercase">
                  <FiCheck className="stroke-[3]" /> Verified
                </span>
              )}
              {profile.category && (
                <span className="inline-flex items-center px-3 py-0.5 bg-[#f5efe4] text-[#8c5e1e] border border-[#e3dccb] text-[11px] font-extrabold rounded-full uppercase tracking-wider">
                  {profile.category} {profile.subcategory && `• ${profile.subcategory}`}
                </span>
              )}
            </div>
          </div>

          {/* Description Quote */}
          {profile.description && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-medium">
              "{profile.description}"
            </p>
          )}
          
          {/* Metadata: Location & Joined Date */}
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs font-semibold text-slate-500 pt-0.5">
            <span className="flex items-center gap-1.5">
              <FiMapPin className="text-[#d99a3d] w-3.5 h-3.5" />
              <span>{profile.city || 'India'}{profile.state ? `, ${profile.state}` : ''}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <FiClock className="text-slate-400 w-3.5 h-3.5" />
              <span>Joined {new Date(profile.joined_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
            </span>
          </div>
        </div>

        {/* Quick Statistics Summary Bar */}
        <div className="border-t border-[#e3dccb] bg-[#fdfcf9] px-6 sm:px-8 py-3.5">
          <div className="flex items-center gap-6 sm:gap-10 overflow-x-auto w-full py-1 justify-center sm:justify-start">
            <div className="text-center sm:text-left">
              <span className="block font-black text-base text-[#1a1a1a]">{profile.stats?.posts || 0}</span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Posts</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-black text-base text-[#1a1a1a]">{followersCount}</span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Followers</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-black text-base text-[#1a1a1a]">{profile.stats?.following || 0}</span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Following</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-black text-base text-[#1a1a1a]">{profile.stats?.likes || 0}</span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Likes</span>
            </div>
            <div className="text-center sm:text-left">
              <span className="block font-black text-base text-[#1a1a1a]">
                <span className="flex items-center justify-center sm:justify-start gap-1 text-amber-500 font-black">
                  <FiStar className="fill-amber-500" size={14} /> {profile.rating_avg?.toFixed(1) || '0.0'}
                </span>
              </span>
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">({profile.rating_count} reviews)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── NAVIGATION TAB BAR (INSTAGRAM STYLE) ── */}
      <div className="flex justify-center border border-[#e3dccb] bg-white rounded-2xl p-1 shadow-2xs">
        {[
          { key: 'posts', label: 'Posts', icon: FiGrid },
          { key: 'reels', label: 'Reels', icon: FiMessageCircle },
          { key: 'products', label: `Products (${products.length})`, icon: FiPackage },
          { key: 'services', label: `Services (${services.length})`, icon: FiTool },
          { key: 'reviews', label: 'Reviews', icon: FiStar },
          { key: 'about', label: 'About Us', icon: FiInfo },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl font-extrabold text-[10px] sm:text-xs transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-[#1c1a17] text-[#d99a3d] shadow-2xs'
                : 'text-slate-600 hover:text-[#1a1a1a]'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT CONTAINERS ── */}
      <div className="bg-white rounded-3xl border border-[#e3dccb] p-6 shadow-xs min-h-[300px]">

        {/* 1. POSTS GRID TAB */}
        {activeTab === 'posts' && (
          posts.length === 0 ? (
            <div className="text-center py-20 text-xs text-text-tertiary">No posts published yet.</div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {posts.map((post) => {
                const isVideo = post.mediaType === 'video' || post.videoUrl?.endsWith('.mp4');
                const rawUrl = Array.isArray(post.mediaUrls) && post.mediaUrls[0] ? post.mediaUrls[0] : (post.thumbnailUrl || post.videoUrl || '');
                const mediaUrl = resolveMediaUrl(rawUrl);

                return (
                  <div
                    key={post._id}
                    onClick={() => handleOpenPostDetails(post)}
                    className="aspect-square bg-surface-tertiary border border-border rounded-xl overflow-hidden relative group cursor-pointer"
                  >
                    {isVideo ? (
                      <video src={mediaUrl} className="w-full h-full object-cover" muted />
                    ) : (
                      <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    
                    {/* Hover Stats Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center gap-4 text-white font-bold text-xs sm:text-sm">
                      <span className="flex items-center gap-1"><FiHeart size={16} className="fill-white" /> {post.likesCount || 0}</span>
                      <span className="flex items-center gap-1"><FiMessageCircle size={16} /> {post.commentsCount || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* 2. REELS TAB */}
        {activeTab === 'reels' && (
          videosList.length === 0 ? (
            <div className="text-center py-20 text-xs text-text-tertiary">No video reels published yet.</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {videosList.map((post) => {
                const mediaUrl = resolveMediaUrl(post.thumbnailUrl || post.videoUrl || '');

                return (
                  <div
                    key={post._id}
                    onClick={() => handleOpenPostDetails(post)}
                    className="aspect-[9/16] bg-surface-tertiary border border-border rounded-2xl overflow-hidden relative group cursor-pointer shadow-card"
                  >
                    <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3.5 space-y-1">
                      <p className="text-[10px] text-white font-bold line-clamp-2 leading-relaxed">{post.caption}</p>
                      <div className="flex items-center justify-between text-white/90 text-[10px] font-extrabold">
                        <span className="flex items-center gap-0.5"><FiHeart size={12} className="fill-white" /> {post.likesCount || 0}</span>
                        <span className="flex items-center gap-0.5"><FiMessageCircle size={12} /> {post.commentsCount || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* 3. PRODUCTS CATALOGUE TAB */}
        {activeTab === 'products' && (
          products.length === 0 ? (
            <div className="text-center py-20 text-xs text-text-tertiary">No products listed in catalogue.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {products.map((p) => {
                const img = resolveMediaUrl(p.images?.[0] || 'https://via.placeholder.com/300');
                return (
                  <div key={p._id} className="glass rounded-2xl border border-white/40 p-4 flex gap-4 items-center shadow-card hover:shadow-card-hover transition">
                    <img src={img} alt={p.title} className="w-20 h-20 rounded-xl object-cover border border-border flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-text-primary truncate">{p.title}</h4>
                      <p className="text-[10px] text-text-tertiary mt-0.5 uppercase font-bold">{p.category}</p>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-xs font-black text-emerald-600">₹{(p.sellingPrice || p.price || 0).toLocaleString()}</span>
                        {p.actualPrice > p.price && (
                          <span className="text-[10px] text-text-tertiary line-through">₹{p.actualPrice}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => toast.success('Added to favorites!')}
                      className="p-2.5 bg-white border border-[#e3dccb] hover:bg-[#f5efe4] text-[#d99a3d] rounded-xl transition cursor-pointer"
                    >
                      <FiBookmark size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* 4. SERVICES CATALOGUE TAB */}
        {activeTab === 'services' && (
          services.length === 0 ? (
            <div className="text-center py-20 text-xs text-text-tertiary">No services listed currently.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((s) => {
                const img = resolveMediaUrl(s.images?.[0] || 'https://via.placeholder.com/300');
                const sd = s.serviceDetails || {};
                return (
                  <div key={s._id} className="bg-white rounded-2xl border border-[#e3dccb] p-4 space-y-3 shadow-2xs hover:shadow-xs transition">
                    <div className="flex gap-4 items-center">
                      <img src={img} alt={s.title} className="w-16 h-16 rounded-xl object-cover border border-[#e3dccb] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-[#1a1a1a] truncate">{s.title}</h4>
                        <p className="text-[10px] text-[#d99a3d] mt-0.5 uppercase font-bold">{sd.serviceType || 'On-site'} • {sd.durationText || '1 Hour'}</p>
                        <span className="text-xs font-black text-[#1a1a1a] mt-1.5 block">₹{(s.price || 0).toLocaleString()} ({sd.priceType || 'Fixed'})</span>
                      </div>
                    </div>
                    
                    {sd.workingHours && (
                      <div className="text-[10px] text-text-tertiary pt-2 border-t border-border flex justify-between">
                        <span>Hours: {sd.workingHours}</span>
                        <span>Visit: {sd.homeVisitAvailable ? 'Available' : 'No'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* 5. REVIEWS & RATINGS TAB */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            
            {/* Reviews Aggregator Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6 border border-border bg-surface-tertiary/20 rounded-2xl">
              <div className="text-center space-y-1 md:border-r border-border">
                <span className="text-4xl font-black text-text-primary block">{profile.rating_avg?.toFixed(1) || '0.0'}</span>
                <div className="flex justify-center text-amber-500">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FiStar key={i} className={i < Math.round(profile.rating_avg || 0) ? 'fill-amber-500' : ''} size={16} />
                  ))}
                </div>
                <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider block">Based on {profile.rating_count} ratings</span>
              </div>

              {/* Progress Bars */}
              <div className="md:col-span-2 space-y-1.5">
                {[5, 4, 3, 2, 1].map((stars) => {
                  // Compute review counts matching stars
                  const matchCount = reviews.filter(r => Math.round(r.rating) === stars).length;
                  const pct = reviews.length > 0 ? (matchCount / reviews.length) * 100 : 0;
                  return (
                    <div key={stars} className="flex items-center gap-3 text-[11px]">
                      <span className="w-3 font-bold text-text-secondary">{stars}</span>
                      <FiStar size={11} className="text-amber-500 fill-amber-500 flex-shrink-0" />
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-right text-text-tertiary font-bold">{matchCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Submit Review Form */}
            <form onSubmit={handleReviewSubmit} className="bg-white border border-[#e3dccb] p-5 rounded-2xl space-y-4 shadow-2xs">
              <h4 className="font-bold text-xs text-[#1a1a1a] font-display flex items-center gap-2">
                <FiStar className="text-[#d99a3d]" /> Write a Review
              </h4>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-amber-500 transition hover:scale-110 cursor-pointer"
                    >
                      <FiStar size={20} className={star <= reviewRating ? 'fill-amber-500' : ''} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={3}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details of your experience with this vendor business..."
                  className="w-full px-4 py-2.5 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] transition resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-2.5 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
              >
                <FiSend size={13} />
                <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
              </button>
            </form>

            {/* Reviews List */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-[#1a1a1a] font-display">Customer Comments ({reviews.length})</h4>
              {reviews.length === 0 ? (
                <p className="text-center py-6 text-xs text-text-tertiary">No reviews written yet. Be the first to review!</p>
              ) : (
                <div className="divide-y divide-border space-y-4">
                  {reviews.map((rev) => {
                    const avatar = rev.author?.avatarUrl || rev.author?.profile_pic;
                    return (
                      <div key={rev._id} className="pt-4 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-[#f4ede3] overflow-hidden border border-[#e3dccb] flex-shrink-0 flex items-center justify-center text-xs font-bold text-[#1c1a17]">
                          {avatar ? <img src={resolveMediaUrl(avatar)} alt="" className="w-full h-full object-cover" /> : rev.author?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <h5 className="font-bold text-xs text-text-primary truncate">{rev.author?.name || 'Customer'}</h5>
                            <span className="text-[10px] text-text-tertiary">{new Date(rev.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <FiStar key={i} className={i < rev.rating ? 'fill-amber-500' : ''} size={10} />
                            ))}
                          </div>
                          
                          <p className="text-xs text-text-secondary leading-relaxed pt-0.5">{rev.comment}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* 6. ABOUT TAB */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            
            {/* Description Card */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-[#1a1a1a] font-display flex items-center gap-2">
                <FiInfo className="text-[#d99a3d]" /> About Our Business
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed bg-[#fbf9f5] p-4 border border-[#e3dccb] rounded-xl">
                {profile.description || 'Welcome to our verified shop listing on BizReels. We provide state-of-the-art products and services to address customer requirements locally with quality craftsmanship and premium support.'}
              </p>
            </div>

            {/* Quick Contact & Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Working Settings */}
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Business Settings</h5>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-text-secondary">
                    <FiClock className="text-[#d99a3d]" size={14} />
                    <span><strong>Operating Hours:</strong> {profile.business_hours}</span>
                  </div>
                  {profile.address && (
                    <div className="flex items-start gap-2.5 text-text-secondary">
                      <FiMapPin className="text-[#d99a3d] mt-0.5" size={14} />
                      <span><strong>Address:</strong> {profile.address}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <FiGlobe className="text-emerald-500" size={14} />
                      <a href={profile.website} target="_blank" rel="noreferrer" className="hover:underline text-[#d99a3d] font-bold">
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Channels */}
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">Social Channels</h5>
                
                <div className="space-y-2.5 text-xs">
                  {profile.whatsapp && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <FaWhatsapp className="text-emerald-600" size={14} />
                      <span><strong>WhatsApp Business:</strong> {profile.whatsapp}</span>
                    </div>
                  )}
                  {profile.socials?.instagram && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <FiInstagram className="text-[#d99a3d]" size={14} />
                      <span><strong>Instagram:</strong> {profile.socials.instagram}</span>
                    </div>
                  )}
                  {profile.socials?.facebook && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <FiFacebook className="text-blue-600" size={14} />
                      <span><strong>Facebook:</strong> {profile.socials.facebook}</span>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* ── MODAL 1: SEND MESSAGE / DIRECT INBOX CHAT POPUP ── */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#e3dccb] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex justify-between items-center border-b border-[#e3dccb] pb-3">
              <h3 className="font-bold text-sm text-[#1a1a1a] font-display flex items-center gap-2">
                <FiMessageCircle className="text-[#d99a3d]" /> Chat with {profile.business_name}
              </h3>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f4ede3] text-slate-600 hover:text-[#1a1a1a] flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4">
              <p className="text-[11px] text-text-tertiary leading-relaxed">
                Send a direct enquiry or message. This will immediately open a personal chat conversation list in your Customer Inbox.
              </p>
              
              <textarea
                required
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type your message here e.g. Hey, do you have stock for..."
                className="w-full px-4 py-3 bg-white border border-[#e3dccb] rounded-xl text-xs text-[#1a1a1a] focus:outline-none focus:border-[#d99a3d] focus:ring-1 focus:ring-[#d99a3d] transition resize-none font-medium"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 border border-[#e3dccb] text-slate-600 font-bold text-xs rounded-xl hover:bg-[#f5efe4] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMessage}
                  className="px-5 py-2 bg-[#d99a3d] hover:bg-[#c8872b] text-[#1a1a1a] font-extrabold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FiSend size={13} />
                  <span>{submittingMessage ? 'Delivering...' : 'Send Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: INSTAGRAM-STYLE POST DETAIL OVERLAY ── */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[88vh] sm:h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-2xl border border-[#e3dccb] animate-scale-in">
            
            {/* Media Block (Left Side) */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[45vh] md:min-h-0 overflow-hidden">
              {selectedPost.mediaType === 'video' || selectedPost.videoUrl?.endsWith('.mp4') ? (
                <video
                  src={resolveMediaUrl(selectedPost.videoUrl)}
                  className="w-full h-full object-contain max-h-[45vh] md:max-h-full"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={resolveMediaUrl(Array.isArray(selectedPost.mediaUrls) && selectedPost.mediaUrls[0] ? selectedPost.mediaUrls[0] : (selectedPost.thumbnailUrl || selectedPost.videoUrl))}
                  alt=""
                  className="w-full h-full object-contain max-h-[45vh] md:max-h-full"
                />
              )}
            </div>

            {/* Actions & Comments Block (Right Side) */}
            <div className="w-full md:w-[360px] lg:w-[400px] flex flex-col justify-between bg-white h-full border-t md:border-t-0 md:border-l border-[#e3dccb] flex-shrink-0">
              
              {/* Header */}
              <div className="p-3.5 sm:p-4 border-b border-[#e3dccb] flex items-center justify-between bg-[#fdfcf9]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full p-[1.5px] bg-[#d99a3d] shadow-xs flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                      {profile.profile_pic ? (
                        <img src={resolveMediaUrl(profile.profile_pic)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-[#f4ede3] flex items-center justify-center font-black text-[#1c1a17] text-xs">
                          {(profile.business_name || profile.name || 'V').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <h5 className="font-extrabold text-xs sm:text-sm text-[#1a1a1a] truncate flex items-center gap-1.5">
                      {profile.business_name || profile.name}
                      {profile.verified_badge && (
                        <span className="text-[10px] text-blue-500">✓</span>
                      )}
                    </h5>
                    {selectedPost.location?.address && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                        <FiMapPin className="text-[#d99a3d] flex-shrink-0" size={10} /> {selectedPost.location.address}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center font-bold text-sm transition cursor-pointer"
                  title="Close"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Caption & Comments Area */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 custom-scrollbar">
                {/* Author caption block */}
                <div className="flex gap-3 items-start pb-3 border-b border-[#f0ece1]">
                  <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-purple-700 text-xs">
                    {(profile.business_name || profile.name || 'V').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-relaxed break-words">
                      <strong className="text-slate-900 font-extrabold mr-1.5">{profile.business_name || profile.name}</strong>
                      {selectedPost.caption || 'Explore this post!'}
                    </p>
                    <span className="text-[10px] text-slate-400 font-medium mt-1 block">
                      {selectedPost.createdAt ? new Date(selectedPost.createdAt).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>

                {/* Section header */}
                <div className="pt-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                    COMMENTS
                  </span>
                </div>

                {/* Comments list */}
                {loadingComments ? (
                  <div className="text-center py-10 space-y-2">
                    <div className="w-6 h-6 border-2 border-[#d99a3d] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[11px] font-bold text-slate-400">Loading comments...</p>
                  </div>
                ) : postComments.length === 0 ? (
                  <div className="text-center py-12 space-y-1">
                    <p className="text-xs font-bold text-slate-400">No comments yet.</p>
                    <p className="text-[11px] text-slate-400">Be the first to share your thoughts!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {postComments.map((comment, idx) => {
                      const commentAuthor = comment.userId || comment.author || comment.user || {};
                      const isAuthor = commentAuthor._id === currentUser?._id || commentAuthor === currentUser?._id;
                      const authorAvatar = commentAuthor.avatarUrl || commentAuthor.profile_pic;
                      const authorName = commentAuthor.name || 'Customer';
                      const commentBody = comment.content || comment.text || '';

                      return (
                        <div key={comment._id || idx} className="flex gap-2.5 items-start text-xs group relative">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-[#d99a3d] text-[10px]">
                            {authorAvatar ? (
                              <img src={resolveMediaUrl(authorAvatar)} alt="" className="w-full h-full object-cover" />
                            ) : (
                              authorName.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0 bg-[#faf8f5] px-3 py-2 rounded-2xl border border-[#ede7dc]">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-[11px] text-slate-900">{authorName}</span>
                                {commentAuthor.activeRole && commentAuthor.activeRole !== 'customer' && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 uppercase">
                                    {commentAuthor.activeRole}
                                  </span>
                                )}
                              </div>
                              {isAuthor && (
                                <button
                                  onClick={() => handleDeletePostComment(comment._id)}
                                  className="text-slate-400 hover:text-rose-600 transition opacity-0 group-hover:opacity-100 p-0.5"
                                  title="Delete comment"
                                >
                                  <FiTrash2 size={12} />
                                </button>
                              )}
                            </div>
                            <p className="text-slate-700 text-xs mt-0.5 whitespace-pre-wrap leading-relaxed break-words">
                              {commentBody}
                            </p>
                            <span className="text-[9px] text-slate-400 mt-1 block">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : 'Just now'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Likes and Comment Form (Bottom Dock) */}
              <div className="p-3.5 sm:p-4 border-t border-[#e3dccb] space-y-3 bg-[#fdfcf9]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handlePostLike(selectedPost._id)}
                      className="flex items-center gap-1.5 text-xs font-extrabold transition-all group cursor-pointer"
                    >
                      <FiHeart
                        size={20}
                        className={
                          selectedPost.hasLiked
                            ? "fill-rose-500 text-rose-500 scale-110 transition-transform"
                            : "text-slate-600 group-hover:text-rose-500 transition-colors"
                        }
                      />
                      <span className={selectedPost.hasLiked ? "text-rose-600 font-black" : "text-slate-700"}>
                        {selectedPost.likesCount || 0}
                      </span>
                    </button>
                    <span className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                      <FiMessageCircle size={20} />
                      <span>{postComments.length}</span>
                    </span>
                  </div>
                  <button
                    onClick={handleShareProfile}
                    className="text-slate-400 hover:text-slate-700 transition"
                    title="Share"
                  >
                    <FiShare2 size={16} />
                  </button>
                </div>

                <form onSubmit={handlePostCommentSubmit} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={postCommentText}
                    onChange={(e) => setPostCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2.5 bg-white border border-[#d5ccb8] focus:border-[#d99a3d] focus:ring-2 focus:ring-[#d99a3d]/20 rounded-full text-xs text-slate-800 placeholder-slate-400 font-medium transition outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!postCommentText.trim()}
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition flex-shrink-0"
                    title="Post Comment"
                  >
                    <FiSend size={13} className="translate-x-[1px]" />
                  </button>
                </form>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
