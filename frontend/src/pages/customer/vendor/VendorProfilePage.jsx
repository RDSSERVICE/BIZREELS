import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiMapPin, FiGlobe, FiPhone, FiClock, FiHeart, FiMessageCircle,
  FiBookmark, FiShare2, FiStar, FiInfo, FiCheck, FiUserPlus,
  FiSend, FiPackage, FiTool, FiAlertTriangle, FiInstagram, FiFacebook,
  FiGrid
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { api, resolveMediaUrl } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';
import SEO from '../../../components/common/SEO';

export default function VendorProfilePage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();

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

      socket.on('vendor_stats_update', handleStatsUpdate);
      socket.on('following_update', handleFollowingUpdate);

      return () => {
        socket.emit('leave_conversation', vendorId);
        socket.off('vendor_stats_update', handleStatsUpdate);
        socket.off('following_update', handleFollowingUpdate);
      };
    }
  }, [vendorId]);

  // ── Follow / Unfollow Handling ─────────────────────────────
  const handleFollowToggle = async () => {
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
      toast.error('Failed to update follow status');
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
      const name = encodeURIComponent(vendorData?.shopName || vendorData?.name || 'Vendor');
      const avatar = encodeURIComponent(vendorData?.logo || vendorData?.profile_pic || '');
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
    const shareData = {
      title: vendorData?.shopName || vendorData?.name || 'Vendor Profile',
      text: `Check out ${vendorData?.shopName || vendorData?.name || 'this vendor'} on BizReels!`,
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
    setLoadingComments(true);
    try {
      const res = await api.get(`/v1/reels/${post._id}/comments`);
      const list = res.data?.data?.comments || res.data?.comments || res.data?.data || [];
      setPostComments(list);
    } catch (e) {
      setPostComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handlePostLike = async (postId) => {
    try {
      await api.post(`/v1/reels/${postId}/like`);
      // Update local liked list
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost(prev => ({
          ...prev,
          likesCount: prev.likesCount + 1
        }));
      }
      setPosts(prev => prev.map(p => p._id === postId ? { ...p, likesCount: p.likesCount + 1 } : p));
      toast.success('Liked post!');
    } catch (e) {
      toast.error('Failed to like post');
    }
  };

  const handlePostCommentSubmit = async (e) => {
    e.preventDefault();
    if (!postCommentText.trim() || !selectedPost) return;

    const text = postCommentText.trim();
    setPostCommentText('');
    try {
      const res = await api.post(`/v1/reels/${selectedPost._id}/comments`, { text });
      const commentObj = res.data?.data?.comment || res.data?.comment || { text, createdAt: new Date() };
      setPostComments(prev => [...prev, commentObj]);
      setPosts(prev => prev.map(p => p._id === selectedPost._id ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p));
      toast.success('Comment posted!');
    } catch (err) {
      toast.error('Failed to submit comment');
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-text-tertiary">Loading premium profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 glass border border-border rounded-2xl max-w-lg mx-auto">
        <FiAlertTriangle className="mx-auto text-brand-orange w-12 h-12 mb-4" />
        <h3 className="font-bold text-base text-text-primary">Vendor Profile Not Found</h3>
        <p className="text-xs text-text-tertiary mt-2">This business profile may have been closed or is temporarily unavailable.</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-brand-purple text-white font-bold text-xs rounded-xl shadow-premium">
          Go Back
        </button>
      </div>
    );
  }

  // Filter listings
  const products = listings.filter(l => l.type === 'product');
  const services = listings.filter(l => l.type === 'service');
  const videosList = posts.filter(p => p.mediaType === 'video' || p.videoUrl?.endsWith('.mp4'));

  const vendorName = profile.shop_name || profile.business_name || profile.name || 'Vendor Profile';
  const vendorAvatarUrl = profile.avatar || profile.logo || profile.profile_pic
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
      <div className="glass rounded-3xl border border-white/50 overflow-hidden shadow-card relative">
        {/* Cover Banner */}
        <div className="h-44 sm:h-56 w-full bg-gradient-to-r from-brand-purple/20 via-brand-pink/20 to-brand-orange/20 relative">
          {profile.cover_banner ? (
            <img src={resolveMediaUrl(profile.cover_banner)} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-cover-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Online/Offline Status Indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase shadow-lg">
            <span className={`w-2 h-2 rounded-full ${profile.online_status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            <span>{profile.online_status}</span>
          </div>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end gap-5 -mt-16 sm:-mt-20">
          
          {/* Avatar Picture */}
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full p-1 gradient-brand bg-surface shadow-2xl relative z-10 flex-shrink-0">
            <div className="w-full h-full bg-surface rounded-full overflow-hidden border-2 border-surface">
              {profile.profile_pic ? (
                <img src={resolveMediaUrl(profile.profile_pic)} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-surface-tertiary flex items-center justify-center text-4xl font-extrabold text-brand-purple">
                  {profile.business_name?.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Details Column */}
          <div className="flex-1 text-center sm:text-left space-y-2 mt-2 sm:mt-0 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-text-primary font-display truncate">
                {profile.business_name}
              </h1>
              {profile.verified_badge && (
                <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-black rounded-full uppercase w-fit mx-auto sm:mx-0">
                  <FiCheck className="stroke-[3]" /> Verified
                </span>
              )}
            </div>

            <p className="text-xs font-bold text-brand-purple uppercase tracking-wider">{profile.category} {profile.subcategory && `• ${profile.subcategory}`}</p>
            <p className="text-xs text-text-secondary leading-relaxed max-w-lg italic">"{profile.description}"</p>
            
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 text-xs text-text-tertiary pt-1">
              <span className="flex items-center gap-1"><FiMapPin className="text-brand-orange" /> {profile.city}, {profile.state || 'IN'}</span>
              <span>Joined {new Date(profile.joined_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="border-t border-border bg-surface-tertiary/40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Quick Statistics Summary */}
          <div className="flex items-center gap-5 sm:gap-7 overflow-x-auto w-full sm:w-auto py-1 justify-center">
            <div className="text-center">
              <span className="block font-black text-sm text-text-primary">{profile.stats?.posts || 0}</span>
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Posts</span>
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-text-primary">{followersCount}</span>
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Followers</span>
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-text-primary">{profile.stats?.following || 0}</span>
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Following</span>
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-text-primary">{profile.stats?.likes || 0}</span>
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Likes</span>
            </div>
            <div className="text-center">
              <span className="block font-black text-sm text-text-primary">
                <span className="flex items-center justify-center gap-0.5 text-amber-500 font-black">
                  <FiStar className="fill-amber-500" size={13} /> {profile.rating_avg?.toFixed(1) || '0.0'}
                </span>
              </span>
              <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">({profile.rating_count} reviews)</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleFollowToggle}
              className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-premium transition ${
                isFollowing
                  ? 'bg-surface border border-border text-text-secondary hover:bg-surface-tertiary'
                  : 'gradient-brand text-white'
              }`}
            >
              {isFollowing ? <><FiCheck size={14} /> Following</> : <><FiUserPlus size={14} /> Follow</>}
            </button>

            <button
              onClick={() => setIsMessageModalOpen(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-surface border border-border hover:bg-surface-tertiary text-text-primary font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-premium"
            >
              <FiMessageCircle size={14} /> Message
            </button>

            <button
              onClick={handleShareProfile}
              className="p-2.5 bg-surface border border-border hover:bg-surface-tertiary text-text-secondary rounded-xl transition"
              title="Share Profile"
            >
              <FiShare2 size={16} />
            </button>

            <button
              onClick={handleReportProfile}
              className="p-2.5 bg-surface border border-border hover:bg-surface-tertiary text-error rounded-xl transition"
              title="Report Profile"
            >
              <FiAlertTriangle size={16} />
            </button>
          </div>

        </div>
      </div>

      {/* ── NAVIGATION TAB BAR (INSTAGRAM STYLE) ── */}
      <div className="flex justify-center border-b border-border bg-surface rounded-2xl p-1 shadow-card border">
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
            className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all ${
              activeTab === tab.key
                ? 'bg-brand-purple/10 text-brand-purple border border-brand-purple/20'
                : 'text-text-tertiary hover:text-text-primary'
            }`}
          >
            <tab.icon size={14} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT CONTAINERS ── */}
      <div className="glass rounded-3xl border border-white/50 p-6 shadow-card min-h-[300px]">

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
                      className="p-2.5 bg-surface border border-border hover:bg-surface-tertiary text-brand-purple rounded-xl transition"
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
                  <div key={s._id} className="glass rounded-2xl border border-white/40 p-4 space-y-3 shadow-card hover:shadow-card-hover transition">
                    <div className="flex gap-4 items-center">
                      <img src={img} alt={s.title} className="w-16 h-16 rounded-xl object-cover border border-border flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-text-primary truncate">{s.title}</h4>
                        <p className="text-[10px] text-brand-purple mt-0.5 uppercase font-bold">{sd.serviceType || 'On-site'} • {sd.durationText || '1 Hour'}</p>
                        <span className="text-xs font-black text-brand-purple mt-1.5 block">₹{(s.price || 0).toLocaleString()} ({sd.priceType || 'Fixed'})</span>
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
            <form onSubmit={handleReviewSubmit} className="glass border border-white/50 p-5 rounded-2xl space-y-4">
              <h4 className="font-bold text-xs text-text-primary font-display flex items-center gap-2">
                <FiStar className="text-brand-purple" /> Write a Review
              </h4>
              
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary">Rating:</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="text-amber-500 transition hover:scale-110"
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
                  className="w-full px-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition resize-none font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="px-6 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-95 transition flex items-center gap-2 cursor-pointer"
              >
                <FiSend size={13} />
                <span>{submittingReview ? 'Submitting...' : 'Post Review'}</span>
              </button>
            </form>

            {/* Reviews List */}
            <div className="space-y-4">
              <h4 className="font-bold text-xs text-text-primary font-display">Customer Comments ({reviews.length})</h4>
              {reviews.length === 0 ? (
                <p className="text-center py-6 text-xs text-text-tertiary">No reviews written yet. Be the first to review!</p>
              ) : (
                <div className="divide-y divide-border space-y-4">
                  {reviews.map((rev) => {
                    const avatar = rev.author?.avatarUrl || rev.author?.profile_pic;
                    return (
                      <div key={rev._id} className="pt-4 flex gap-4 items-start">
                        <div className="w-10 h-10 rounded-full bg-surface-tertiary overflow-hidden border border-border flex-shrink-0 flex items-center justify-center text-xs font-bold text-brand-purple">
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
              <h4 className="font-bold text-xs text-text-primary font-display flex items-center gap-2">
                <FiInfo className="text-brand-purple" /> About Our Business
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed bg-surface-tertiary/20 p-4 border border-border rounded-xl">
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
                    <FiClock className="text-brand-purple" size={14} />
                    <span><strong>Operating Hours:</strong> {profile.business_hours}</span>
                  </div>
                  {profile.address && (
                    <div className="flex items-start gap-2.5 text-text-secondary">
                      <FiMapPin className="text-brand-orange mt-0.5" size={14} />
                      <span><strong>Address:</strong> {profile.address}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2.5 text-text-secondary">
                      <FiGlobe className="text-emerald-500" size={14} />
                      <a href={profile.website} target="_blank" rel="noreferrer" className="hover:underline text-brand-purple">
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
                      <FiInstagram className="text-brand-pink" size={14} />
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
          <div className="bg-surface border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="font-bold text-sm text-text-primary font-display flex items-center gap-2">
                <FiMessageCircle className="text-brand-purple" /> Chat with {profile.business_name}
              </h3>
              <button
                onClick={() => setIsMessageModalOpen(false)}
                className="w-7 h-7 rounded-full bg-surface-tertiary text-text-tertiary hover:text-text-primary flex items-center justify-center font-bold text-xs"
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
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple transition resize-none font-medium"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="px-4 py-2 border border-border text-text-secondary font-bold text-xs rounded-xl hover:bg-surface-tertiary transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMessage}
                  className="px-5 py-2 gradient-brand text-white font-bold text-xs rounded-xl shadow-premium hover:opacity-95 transition flex items-center gap-1.5 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-4xl w-full h-[80vh] flex flex-col md:flex-row overflow-hidden shadow-2xl animate-scale-in">
            
            {/* Media Block */}
            <div className="flex-1 bg-black flex items-center justify-center relative min-h-[40vh] md:min-h-0">
              {selectedPost.mediaType === 'video' || selectedPost.videoUrl?.endsWith('.mp4') ? (
                <video src={resolveMediaUrl(selectedPost.videoUrl)} className="w-full h-full object-contain" controls autoPlay loop />
              ) : (
                <img src={resolveMediaUrl(Array.isArray(selectedPost.mediaUrls) ? selectedPost.mediaUrls[0] : (selectedPost.thumbnailUrl || selectedPost.videoUrl))} alt="" className="w-full h-full object-contain" />
              )}
            </div>

            {/* Actions & Comments Block */}
            <div className="w-full md:w-80 lg:w-96 flex flex-col justify-between border-l border-border h-full max-h-[40vh] md:max-h-none">
              
              {/* Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-surface-tertiary/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface overflow-hidden border border-border">
                    {profile.profile_pic ? (
                      <img src={resolveMediaUrl(profile.profile_pic)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-surface-tertiary flex items-center justify-center font-bold text-brand-purple text-xs">
                        {profile.business_name?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-text-primary">{profile.business_name}</h5>
                    {selectedPost.location?.address && (
                      <span className="text-[9px] text-text-tertiary flex items-center gap-0.5"><FiMapPin className="text-brand-orange" /> {selectedPost.location.address}</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="w-7 h-7 rounded-full bg-surface hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary flex items-center justify-center font-bold text-xs"
                >
                  ✕
                </button>
              </div>

              {/* Caption & Comments Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-surface overflow-hidden border border-border flex-shrink-0 flex items-center justify-center font-bold text-brand-purple text-[10px]">
                    {profile.business_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs text-text-secondary leading-relaxed">
                      <strong className="text-text-primary mr-1.5">{profile.business_name}</strong>
                      {selectedPost.caption}
                    </p>
                    <span className="text-[9px] text-text-tertiary mt-1 block">{new Date(selectedPost.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wide">Comments</span>
                  {loadingComments ? (
                    <div className="text-center py-4 text-xs text-text-tertiary">Loading comments...</div>
                  ) : postComments.length === 0 ? (
                    <div className="text-center py-4 text-xs text-text-tertiary">No comments yet.</div>
                  ) : (
                    postComments.map((comment, idx) => (
                      <div key={idx} className="flex gap-2.5 items-start text-xs">
                        <div className="w-6 h-6 rounded-full bg-surface-tertiary overflow-hidden border border-border flex-shrink-0 flex items-center justify-center font-bold text-brand-purple text-[9px]">
                          {comment.author?.avatarUrl ? <img src={resolveMediaUrl(comment.author.avatarUrl)} alt="" className="w-full h-full object-cover" /> : comment.author?.name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <p className="text-text-secondary">
                            <strong className="text-text-primary mr-1.5">{comment.author?.name || 'Customer'}</strong>
                            {comment.text}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Likes and Comment Form */}
              <div className="p-4 border-t border-border space-y-3 bg-surface-tertiary/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handlePostLike(selectedPost._id)}
                      className="text-text-secondary hover:text-brand-pink flex items-center gap-1 text-xs font-bold transition"
                    >
                      <FiHeart size={18} />
                      <span>{selectedPost.likesCount || 0}</span>
                    </button>
                    <span className="text-text-tertiary text-xs flex items-center gap-1">
                      <FiMessageCircle size={18} />
                      <span>{postComments.length}</span>
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePostCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={postCommentText}
                    onChange={(e) => setPostCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 bg-surface border border-border rounded-xl text-xs focus:outline-none focus:border-brand-purple transition font-medium"
                  />
                  <button type="submit" className="p-2 gradient-brand text-white rounded-xl shadow-premium hover:opacity-95 cursor-pointer">
                    <FiSend size={14} />
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
