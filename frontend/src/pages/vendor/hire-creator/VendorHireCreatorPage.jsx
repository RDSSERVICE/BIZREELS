import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  FiUserCheck, FiSearch, FiSliders, FiCalendar, FiMessageSquare,
  FiActivity, FiCheckCircle, FiChevronLeft, FiChevronRight, FiGrid
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { api } from '../../../lib/api';
import { getSocket } from '../../../lib/socket';

// Subcomponents
import CreatorCard from './components/CreatorCard';
import CreatorProfileView from './components/CreatorProfileView';
import HireCreatorModal from './components/HireCreatorModal';
import VendorCampaignsTab from './components/VendorCampaignsTab';
import DirectChatContainer from './components/DirectChatContainer';

export default function VendorHireCreatorPage() {
  const currentUser = useSelector(selectCurrentUser);
  const currentUserId = currentUser?._id || currentUser?.id;

  const [activeTab, setActiveTab] = useState('discover'); // discover | campaigns | chat
  
  // Discover Marketplace State
  const [creators, setCreators] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('0');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minFollowers, setMinFollowers] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [languagesFilter, setLanguagesFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [recentlyActive, setRecentlyActive] = useState(false);
  
  const [sortBy, setSortBy] = useState('highest_rated');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Campaigns & Requests State
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);

  // Profile Details State
  const [selectedCreatorId, setSelectedCreatorId] = useState(null);
  const [selectedCreatorProfile, setSelectedCreatorProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Modal Flow States
  const [hiringCreator, setHiringCreator] = useState(null); // Creator obj when hiring modal open
  const [editingCampaign, setEditingCampaign] = useState(null); // Campaign obj when edit modal open
  
  // Chat Integration State
  const [chatRecipientId, setChatRecipientId] = useState(null);
  const [chatCreatorName, setChatCreatorName] = useState('');
  const [chatCreatorAvatar, setChatCreatorAvatar] = useState('');

  // Fetch Cities and Categories on Mount
  useEffect(() => {
    fetchMetadata();
  }, []);

  // Fetch Creators on Filter/Sort/Page Change
  useEffect(() => {
    if (activeTab === 'discover') {
      fetchCreators();
    }
  }, [
    activeTab, cityFilter, categoryFilter, ratingFilter, minPrice, maxPrice,
    minFollowers, experienceFilter, languagesFilter, availabilityFilter,
    verifiedOnly, recentlyActive, sortBy, page
  ]);

  // Fetch Campaigns when Campaigns Tab is Active
  useEffect(() => {
    if (activeTab === 'campaigns') {
      fetchCampaigns();
    }
  }, [activeTab]);

  // Socket.IO Real-time Updates Setup
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRealtimeCampaignUpdate = (data) => {
      // Reload campaigns list
      fetchCampaigns();
      // Reload creators (in case stats or ratings changed)
      fetchCreators();
      toast.success('🟢 Real-time updates synchronized!');
    };

    const handleNewCreatorRegister = () => {
      fetchCreators();
      toast.success('🔔 New creator registered in the marketplace!');
    };

    socket.on('hire_request:status_changed', handleRealtimeCampaignUpdate);
    socket.on('campaign:updated', handleRealtimeCampaignUpdate);
    socket.on('creator:registered', handleNewCreatorRegister);

    return () => {
      socket.off('hire_request:status_changed', handleRealtimeCampaignUpdate);
      socket.off('campaign:updated', handleRealtimeCampaignUpdate);
      socket.off('creator:registered', handleNewCreatorRegister);
    };
  }, []);

  const fetchMetadata = async () => {
    try {
      const [citiesRes, catsRes] = await Promise.all([
        api.get('/v1/creator-marketplace/cities'),
        api.get('/v1/creator-marketplace/categories')
      ]);
      setCities(citiesRes.data?.data || []);
      setCategories(catsRes.data?.data || []);
    } catch (err) {
      console.warn('Failed to load filters metadata:', err);
    }
  };

  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search);
      if (cityFilter !== 'all') params.append('city', cityFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (parseFloat(ratingFilter) > 0) params.append('rating', ratingFilter);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minFollowers) params.append('minFollowers', minFollowers);
      if (experienceFilter) params.append('experience', experienceFilter);
      if (languagesFilter) params.append('languages', languagesFilter);
      if (availabilityFilter !== 'all') params.append('availability', availabilityFilter);
      if (verifiedOnly) params.append('verifiedOnly', 'true');
      if (recentlyActive) params.append('recentlyActive', 'true');
      
      params.append('sortBy', sortBy);
      params.append('page', page);
      params.append('limit', 6);

      const res = await api.get(`/v1/creator-marketplace/discover?${params.toString()}`);
      setCreators(res.data?.data || []);
      setTotalPages(res.data?.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch creators:', err);
      setCreators([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await api.get('/v1/hires?role=vendor');
      setCampaigns(res.data?.data?.hireRequests || []);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const loadCreatorProfile = async (id) => {
    setLoadingProfile(true);
    setSelectedCreatorId(id);
    try {
      const res = await api.get(`/v1/creator-marketplace/${id}/profile`);
      setSelectedCreatorProfile(res.data?.data || null);
    } catch (err) {
      toast.error('Failed to load creator profile.');
      setSelectedCreatorId(null);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleCreateCampaignSubmit = async (payload) => {
    const toastId = toast.loading('Sending campaign proposal...');
    try {
      await api.post('/v1/hires', {
        ...payload,
        creatorId: hiringCreator._id || hiringCreator.id,
      });
      toast.success(`🟢 Hire request sent to ${hiringCreator.name}!`, { id: toastId });
      setHiringCreator(null);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit hire request.', { id: toastId });
    }
  };

  const handleEditCampaignSubmit = async (payload) => {
    const toastId = toast.loading('Saving edits...');
    try {
      await api.patch(`/v1/hires/${editingCampaign.hireRequest}/edit`, payload);
      toast.success('🟢 Campaign proposal edited successfully!', { id: toastId });
      setEditingCampaign(null);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to edit proposal.', { id: toastId });
    }
  };

  const handleCancelCampaign = async (id) => {
    const confirm = window.confirm('Are you sure you want to cancel this campaign proposal?');
    if (!confirm) return;

    const toastId = toast.loading('Cancelling proposal...');
    try {
      // Find hireRequest id from campaigns list
      const camp = campaigns.find(c => (c._id || c.id) === id);
      const reqId = camp?.hireRequest || id;
      
      await api.patch(`/v1/hires/${reqId}/cancel`);
      toast.success('Proposal cancelled successfully.', { id: toastId });
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel proposal.', { id: toastId });
    }
  };

  const handleCompleteCampaign = async (id) => {
    const confirm = window.confirm('Are you sure you want to release the escrow funds and mark this campaign complete?');
    if (!confirm) return;

    const toastId = toast.loading('Releasing escrow payout...');
    try {
      const camp = campaigns.find(c => (c._id || c.id) === id);
      const reqId = camp?.hireRequest || id;

      await api.patch(`/v1/hires/${reqId}`, { status: 'completed' });
      toast.success('🟢 Escrow payout released! Campaign completed.', { id: toastId });
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete campaign.', { id: toastId });
    }
  };

  const handleSubmitReview = async (campaignId, rating, comment) => {
    const toastId = toast.loading('Submitting review...');
    try {
      const camp = campaigns.find(c => (c._id || c.id) === campaignId);
      const creatorId = camp?.creator?._id || camp?.creator?.id;

      await api.post('/v1/reviews', {
        targetUser: creatorId,
        rating,
        comment,
      });
      toast.success('⭐ Thank you for your review! Rating updated.', { id: toastId });
      
      // Update campaigns to track review status
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review.', { id: toastId });
    }
  };

  const handleOpenChat = (creatorId) => {
    // Find creator info
    const c = campaigns.find(c => String(c.creator?._id || c.creator?.id) === String(creatorId));
    if (c) {
      setChatRecipientId(creatorId);
      setChatCreatorName(c.creator?.name || 'Creator');
      setChatCreatorAvatar(c.creator?.profile_pic || c.creator?.avatarUrl || '');
      setActiveTab('chat');
    } else {
      // Find from creators list
      const creator = creators.find(cr => String(cr._id || cr.id) === String(creatorId));
      setChatRecipientId(creatorId);
      setChatCreatorName(creator?.name || 'Creator');
      setChatCreatorAvatar(creator?.profile_pic || creator?.avatarUrl || '');
      setActiveTab('chat');
    }
  };

  const handleClearFilters = () => {
    setSearch('');
    setCityFilter('all');
    setCategoryFilter('all');
    setRatingFilter('0');
    setMinPrice('');
    setMaxPrice('');
    setMinFollowers('');
    setExperienceFilter('');
    setLanguagesFilter('');
    setAvailabilityFilter('all');
    setVerifiedOnly(false);
    setRecentlyActive(false);
    setPage(1);
    toast.success('Filters cleared.');
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in pb-16">
      <AdminPageHeader
        icon={FiUserCheck}
        title="Creator Discovery & Campaigns Hub"
        subtitle="Manage end-to-end shorts video shoots, search verified creators, release escrow payments, and coordinate deliverables"
      />

      {/* Tabs bar */}
      <div className="flex border-b border-border gap-6 text-sm font-bold text-text-tertiary">
        <button
          onClick={() => { setSelectedCreatorId(null); setActiveTab('discover'); }}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${activeTab === 'discover' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          <FiGrid size={16} /> Discover Creators
        </button>
        <button
          onClick={() => { setSelectedCreatorId(null); setActiveTab('campaigns'); }}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all ${activeTab === 'campaigns' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          <FiActivity size={16} /> Hires & Campaigns
        </button>
        <button
          disabled={!chatRecipientId}
          onClick={() => { setSelectedCreatorId(null); setActiveTab('chat'); }}
          className={`pb-3 flex items-center gap-1.5 border-b-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${activeTab === 'chat' ? 'border-brand-purple text-brand-purple' : 'border-transparent hover:text-text-primary'}`}
        >
          <FiMessageSquare size={16} /> Collaboration Chat
        </button>
      </div>

      {/* TABS CONTAINER */}
      {selectedCreatorId && selectedCreatorProfile ? (
        /* INSTAGRAM PROFILE DETAILS SUB-PAGE VIEW */
        <CreatorProfileView
          profile={selectedCreatorProfile}
          onBack={() => { setSelectedCreatorId(null); setSelectedCreatorProfile(null); }}
          onSelectHire={() => setHiringCreator(selectedCreatorProfile)}
        />
      ) : activeTab === 'discover' ? (
        /* DISCOVER CREATORS TAB */
        <div className="space-y-6">
          {/* FILTER DRAWER BAR */}
          <div className="glass rounded-2xl p-5 border border-white/50 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search text input */}
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" size={16} />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search creator by name, bio, Category, language, skills..."
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:border-brand-purple"
                />
              </div>

              {/* Quick sort select */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-surface border border-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-brand-purple"
              >
                <option value="highest_rated">Highest Rated ★</option>
                <option value="price_low_high">Price: Low to High</option>
                <option value="price_high_low">Price: High to Low</option>
                <option value="most_followers">Most Followers</option>
                <option value="most_reels">Most Reels Shoots</option>
                <option value="most_campaigns">Most Campaigns Done</option>
                <option value="recently_joined">Recently Joined</option>
                <option value="recently_active">Recently Active</option>
              </select>

              {/* Advanced toggle */}
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="px-4 py-2.5 glass border border-border rounded-xl text-xs font-bold text-text-primary hover:bg-surface-tertiary transition flex items-center gap-1.5"
              >
                <FiSliders size={14} /> Filter Drawer
              </button>
            </div>

            {/* EXPANDABLE FILTER CONTAINER */}
            {showAdvancedFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3 border-t border-border/40 animate-fade-in text-xs">
                {/* City Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Creator City</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-brand-purple font-medium"
                  >
                    <option value="all">All Cities</option>
                    {cities.map((city, idx) => (
                      <option key={idx} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Creator Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-brand-purple font-medium"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Minimum Rating</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-brand-purple font-medium font-bold text-amber-500"
                  >
                    <option value="0">All Ratings</option>
                    <option value="4.5">4.5 ★ & above</option>
                    <option value="4.8">4.8 ★ & above</option>
                    <option value="4.9">4.9 ★ & above</option>
                  </select>
                </div>

                {/* Budget Range */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Pricing Range (₹)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                      className="w-full bg-surface border border-border rounded-xl px-2 py-1.5 text-[11px] focus:outline-none focus:border-brand-purple font-bold text-emerald-600"
                    />
                    <span className="text-text-tertiary">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                      className="w-full bg-surface border border-border rounded-xl px-2 py-1.5 text-[11px] focus:outline-none focus:border-brand-purple font-bold text-emerald-600"
                    />
                  </div>
                </div>

                {/* Followers Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Min Followers</label>
                  <input
                    type="number"
                    placeholder="e.g. 10000"
                    value={minFollowers}
                    onChange={(e) => { setMinFollowers(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-brand-purple"
                  />
                </div>

                {/* Experience years filter */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Experience Years</label>
                  <input
                    type="text"
                    placeholder="e.g. 2 Years"
                    value={experienceFilter}
                    onChange={(e) => { setExperienceFilter(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-brand-purple"
                  />
                </div>

                {/* Languages Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Languages Filter</label>
                  <input
                    type="text"
                    placeholder="e.g. Hindi, English"
                    value={languagesFilter}
                    onChange={(e) => { setLanguagesFilter(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-brand-purple"
                  />
                </div>

                {/* Availability Filter */}
                <div className="space-y-1">
                  <label className="font-bold text-text-secondary">Availability Status</label>
                  <select
                    value={availabilityFilter}
                    onChange={(e) => { setAvailabilityFilter(e.target.value); setPage(1); }}
                    className="w-full bg-surface border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-brand-purple font-medium"
                  >
                    <option value="all">Any Status</option>
                    <option value="available">Available Only</option>
                    <option value="busy">Busy / Fully Booked</option>
                  </select>
                </div>

                {/* Checkboxes Verified Only & Recently Active */}
                <div className="col-span-1 sm:col-span-4 flex gap-6 mt-1 font-bold">
                  <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => { setVerifiedOnly(e.target.checked); setPage(1); }}
                      className="rounded text-brand-purple focus:ring-brand-purple border-border"
                    />
                    <span>Verified Creators Only</span>
                  </label>

                  <label className="flex items-center gap-1.5 cursor-pointer text-text-secondary">
                    <input
                      type="checkbox"
                      checked={recentlyActive}
                      onChange={(e) => { setRecentlyActive(e.target.checked); setPage(1); }}
                      className="rounded text-brand-purple focus:ring-brand-purple border-border"
                    />
                    <span>Recently Active Status (7 days)</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleClearFilters}
                    className="ml-auto text-red-500 hover:underline text-[11px]"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SKELETON LOADING GRID */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 skeleton rounded-3xl border border-border" />
              ))}
            </div>
          ) : creators.length === 0 ? (
            /* EMPTY STATE */
            <div className="glass rounded-3xl p-16 text-center text-xs text-text-tertiary border border-border space-y-3 max-w-xl mx-auto">
              <FiUserCheck size={40} className="mx-auto text-text-tertiary" />
              <p className="font-bold text-text-secondary text-sm">No creators found matching criteria</p>
              <p className="max-w-md mx-auto leading-relaxed">
                We couldn't discover any creator profiles that match your search filters. Try clearing some filters or searching for different categories.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-brand-purple text-white font-bold rounded-xl shadow-premium mt-2 hover:opacity-90 transition"
              >
                Reset Filter Settings
              </button>
            </div>
          ) : (
            /* CREATORS GRID */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map((creator) => (
                  <CreatorCard
                    key={creator.id}
                    creator={creator}
                    onSelectDetails={() => loadCreatorProfile(creator.id)}
                    onSelectHire={() => setHiringCreator(creator)}
                  />
                ))}
              </div>

              {/* PAGINATION CONTROLS */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-6 border-t border-border/40 text-xs font-bold text-text-secondary">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-2 glass border border-border rounded-xl hover:bg-surface-tertiary disabled:opacity-50 transition"
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  <span>Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-2 glass border border-border rounded-xl hover:bg-surface-tertiary disabled:opacity-50 transition"
                  >
                    <FiChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeTab === 'campaigns' ? (
        /* CAMPAIGNS HUB DASHBOARD */
        loadingCampaigns ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-44 skeleton rounded-2xl border border-border" />
            ))}
          </div>
        ) : (
          <VendorCampaignsTab
            campaigns={campaigns}
            onEditCampaign={(c) => setEditingCampaign(c)}
            onCancelCampaign={handleCancelCampaign}
            onCompleteCampaign={handleCompleteCampaign}
            onOpenChat={handleOpenChat}
            onSubmitReview={handleSubmitReview}
            currentUser={currentUser}
          />
        )
      ) : (
        /* REAL-TIME COLLABORATION CHAT */
        <DirectChatContainer
          recipientId={chatRecipientId}
          creatorName={chatCreatorName}
          creatorAvatar={chatCreatorAvatar}
        />
      )}

      {/* COMPENDIUM MODALS FOR ACTIONS */}
      {hiringCreator && (
        <HireCreatorModal
          creator={hiringCreator}
          onClose={() => setHiringCreator(null)}
          onSubmit={handleCreateCampaignSubmit}
        />
      )}

      {editingCampaign && (
        <HireCreatorModal
          creator={editingCampaign.creator}
          defaultValues={editingCampaign}
          onClose={() => setEditingCampaign(null)}
          onSubmit={handleEditCampaignSubmit}
          isEditing={true}
        />
      )}
    </div>
  );
}
