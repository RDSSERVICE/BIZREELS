import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  FiPackage, FiTool, FiVideo, FiEye, FiUsers, FiInbox,
  FiShoppingCart, FiDollarSign, FiZap, FiGrid, FiShield, FiActivity, FiArrowRight, FiCpu, FiImage
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminStatCard from '../../../features/admin/components/AdminStatCard';
import ActiveOffersPanel from '../../../components/offers/ActiveOffersPanel';
import ReferralCard from '../../../components/app/ReferralCard';
import {
  useGetVendorDashboardQuery,
  useGetVendorLeadsQuery,
  useGetVendorReelsQuery,
  useGetVendorSubscriptionQuery,
} from '../../../features/vendor/vendorApi';
import { getSocket } from '../../../lib/socket';

export default function VendorDashboardPage() {
  const { data: dashboardRes, isLoading, refetch: refetchDashboard } = useGetVendorDashboardQuery(undefined, { pollingInterval: 300000 });
  const { data: leadsRes, refetch: refetchLeads } = useGetVendorLeadsQuery(undefined, { pollingInterval: 300000 });
  const { data: reelsRes, refetch: refetchReels } = useGetVendorReelsQuery(undefined, { pollingInterval: 300000 });
  const { data: subscriptionRes } = useGetVendorSubscriptionQuery(undefined, { pollingInterval: 300000 });

  // Socket.IO real-time update listeners for dashboard metrics
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleRefetchAll = () => {
      if (typeof refetchDashboard === 'function') refetchDashboard();
      if (typeof refetchLeads === 'function') refetchLeads();
      if (typeof refetchReels === 'function') refetchReels();
    };

    // Events that affect vendor metrics (leads, listings, follows, proposals, orders)
    socket.on('requirement:assigned', handleRefetchAll);
    socket.on('vendor_notification:sent', handleRefetchAll);
    socket.on('requirement:updated', handleRefetchAll);
    socket.on('requirement:closed', handleRefetchAll);
    socket.on('requirement:deleted', handleRefetchAll);
    
    socket.on('proposal:submitted', handleRefetchAll);
    socket.on('proposal:accepted', handleRefetchAll);
    socket.on('proposal:rejected', handleRefetchAll);
    
    socket.on('following_update', handleRefetchAll);
    socket.on('notification:new', handleRefetchAll);
    socket.on('notification', handleRefetchAll);
    
    socket.on('listing:created', handleRefetchAll);
    socket.on('listing:bulk_updated', handleRefetchAll);
    socket.on('listing:stock_updated', handleRefetchAll);
    
    socket.on('deal:updated', handleRefetchAll);
    socket.on('order:updated', handleRefetchAll);

    return () => {
      socket.off('requirement:assigned', handleRefetchAll);
      socket.off('vendor_notification:sent', handleRefetchAll);
      socket.off('requirement:updated', handleRefetchAll);
      socket.off('requirement:closed', handleRefetchAll);
      socket.off('requirement:deleted', handleRefetchAll);
      
      socket.off('proposal:submitted', handleRefetchAll);
      socket.off('proposal:accepted', handleRefetchAll);
      socket.off('proposal:rejected', handleRefetchAll);
      
      socket.off('following_update', handleRefetchAll);
      socket.off('notification:new', handleRefetchAll);
      socket.off('notification', handleRefetchAll);
      
      socket.off('listing:created', handleRefetchAll);
      socket.off('listing:bulk_updated', handleRefetchAll);
      socket.off('listing:stock_updated', handleRefetchAll);
      
      socket.off('deal:updated', handleRefetchAll);
      socket.off('order:updated', handleRefetchAll);
    };
  }, [refetchDashboard, refetchLeads, refetchReels]);

  // Safe unwrap: handles both old double-nested (data.data) and new flat (data) response shapes
  const rawData = dashboardRes?.data;
  const metrics = (rawData?.totalProducts !== undefined ? rawData : rawData?.data) || {};
  const leads = Array.isArray(leadsRes?.data) ? leadsRes.data : Array.isArray(leadsRes) ? leadsRes : [];
  const reelsList = Array.isArray(reelsRes?.data) ? reelsRes.data : Array.isArray(reelsRes?.reels) ? reelsRes.reels : Array.isArray(reelsRes) ? reelsRes : [];
  const activeFeatures = subscriptionRes?.features || [];

  const realTimeReelsCount = Math.max(metrics.totalReels || 0, reelsList.length);
  const realTimeViewsCount = Math.max(metrics.totalViews || 0, reelsList.reduce((sum, r) => sum + (r.views || 0), 0));

  const credits = metrics.credits || { available: 0, deposited: 0, earned: 0, used: 0 };
  const creditRates = metrics.creditRates || {
    productListing: 1,
    reelPost: 1,
    aiImage: 2,
    aiVideo30s: 15,
    reelBoost1Day: 10,
    validLead: 1,
  };

  const stats = [
    { label: 'Total Products', value: metrics.totalProducts ?? metrics.activeListings ?? 0, icon: FiPackage, color: 'purple', trend: metrics.trends?.totalProducts ?? 0 },
    { label: 'Total Services', value: metrics.totalServices ?? 0, icon: FiTool, color: 'blue', trend: metrics.trends?.totalServices ?? 0 },
    { label: 'Total Reels', value: realTimeReelsCount, icon: FiVideo, color: 'violet', trend: metrics.trends?.totalReels ?? 0 },
    { label: 'Total Views', value: realTimeViewsCount.toLocaleString(), icon: FiEye, color: 'amber', trend: metrics.trends?.totalViews ?? 0 },
    { label: 'Followers', value: (metrics.followers || 0).toLocaleString(), icon: FiUsers, color: 'green', trend: metrics.trends?.followers ?? 0 },
    { label: 'Enquiries', value: metrics.leadEnquiries ?? 0, icon: FiInbox, color: 'cyan', trend: metrics.trends?.leadEnquiries ?? 0 },
    { label: 'Order Requests', value: metrics.totalOrders ?? 0, icon: FiShoppingCart, color: 'indigo', trend: metrics.trends?.totalOrders ?? 0 },
    { label: 'Revenue', value: `₹${(metrics.totalSales || 0).toLocaleString()}`, icon: FiDollarSign, color: 'teal', trend: metrics.trends?.totalSales ?? 0 },
  ];

  const currentUser = useSelector(selectCurrentUser);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    if (currentUser?.id || currentUser?._id) {
      const userId = currentUser.id || currentUser._id;
      const key = `bizreels_vendor_welcome_shown_${userId}`;
      if (!localStorage.getItem(key) && currentUser.roles?.includes('vendor')) {
        setShowWelcomeModal(true);
      }
    }
  }, [currentUser]);

  const closeWelcomeModal = () => {
    if (currentUser?.id || currentUser?._id) {
      const userId = currentUser.id || currentUser._id;
      const key = `bizreels_vendor_welcome_shown_${userId}`;
      localStorage.setItem(key, 'true');
    }
    setShowWelcomeModal(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-2 sm:p-4 animate-fade-in">
      
      {/* Active Special Offers & Deals */}
      <ActiveOffersPanel role="vendor" />

      {/* ── 1. VENDOR CREDIT WALLET BANNER ── */}
      <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#e3dccb]/70 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#d99a3d] animate-pulse"></span>
              <h3 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-sm uppercase tracking-wide text-[#1a1a1a]">
                VENDOR CREDIT WALLET
              </h3>
              <span className="text-[10px] font-extrabold text-slate-500 bg-[#f8f4ec] px-2 py-0.5 rounded border border-[#e3dccb]">
                1 Credit = ₹1 INR
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Use credits for product listings, publishing reels, AI features, boosting, and unlocking lead contacts.
            </p>
          </div>

          {/* Wallet Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/vendor/credit-rates"
              className="px-3 py-1.5 bg-[#f8f4ec] hover:bg-[#241b15] hover:text-[#d99a3d] text-slate-700 text-xs font-bold rounded-lg border border-[#e3dccb] transition cursor-pointer"
            >
              Credit Rates
            </Link>
            <Link
              to="/vendor/referrals"
              className="px-3 py-1.5 bg-[#f8f4ec] hover:bg-[#241b15] hover:text-[#d99a3d] text-slate-700 text-xs font-bold rounded-lg border border-[#e3dccb] transition cursor-pointer"
            >
              Refer & Earn
            </Link>
            <Link
              to="/vendor/wallet"
              className="px-4 py-1.5 bg-[#241b15] text-[#d99a3d] hover:bg-[#382b22] text-xs font-black rounded-lg transition shadow-xs flex items-center gap-1 cursor-pointer"
            >
              <span>Topup Wallet</span>
              <FiArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* Credit Breakdown Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] text-center space-y-0.5">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">AVAILABLE</span>
            <span className="text-2xl font-black text-emerald-600 block">{credits.available}</span>
            <span className="text-[10px] text-slate-500 font-extrabold block">₹{credits.available} Balance</span>
          </div>

          <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] text-center space-y-0.5">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">DEPOSITED</span>
            <span className="text-2xl font-black text-blue-600 block">{credits.deposited}</span>
            <span className="text-[10px] text-slate-500 font-extrabold block">₹{credits.deposited} Added</span>
          </div>

          <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] text-center space-y-0.5">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">EARNED</span>
            <span className="text-2xl font-black text-[#d99a3d] block">{credits.earned}</span>
            <span className="text-[10px] text-slate-500 font-extrabold block">₹{credits.earned} Rewards</span>
          </div>

          <div className="bg-[#f8f4ec] p-3.5 rounded-xl border border-[#e3dccb] text-center space-y-0.5">
            <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest block">USED SPENT</span>
            <span className="text-2xl font-black text-slate-700 block">{credits.used}</span>
            <span className="text-[10px] text-slate-500 font-extrabold block">Credits Used</span>
          </div>
        </div>
      </div>

      {/* ── 2. PAGE HEADER BANNER & QUICK ACTION BAR ── */}
      <div className="bg-[#241b15] text-white p-5 rounded-2xl border-2 border-[#241b15] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[9.5px] font-black text-[#d99a3d] uppercase tracking-widest block mb-1">VENDOR CONTROL CENTER</span>
          <h1 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-xl sm:text-2xl uppercase tracking-wide text-white flex items-center gap-2">
            <FiActivity className="text-[#d99a3d]" />
            <span>BUSINESS DASHBOARD</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Manage product listings, track video reels performance, respond to buyer leads, and view revenue analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/vendor/reels"
            className="px-4 py-2.5 rounded-xl bg-[#d99a3d] text-[#1a1a1a] hover:bg-[#c8872b] font-black text-xs shadow-xs transition flex items-center gap-2 cursor-pointer border-none"
          >
            <FiVideo size={16} />
            <span>POST REEL / MEDIA</span>
          </Link>

          <Link
            to="/vendor/listings"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2 cursor-pointer"
          >
            <FiPackage size={16} className="text-[#d99a3d]" />
            <span>ADD LISTING</span>
          </Link>
        </div>
      </div>

      {/* ── 3. OVERVIEW BENTO STAT CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-4 border border-[#e3dccb] shadow-2xs hover:shadow-sm transition-all space-y-2 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{stat.label}</span>
              <div className="w-8 h-8 rounded-lg bg-[#f8f4ec] text-[#1a1a1a] border border-[#e3dccb] flex items-center justify-center shrink-0 group-hover:bg-[#241b15] group-hover:text-[#d99a3d] transition-colors">
                <stat.icon size={16} />
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <h3 className="text-xl sm:text-2xl font-black text-[#1a1a1a]">
                {isLoading ? '...' : stat.value}
              </h3>
              {stat.trend > 0 && (
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  +{stat.trend}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── 4. RECENT CUSTOMER ENQUIRIES & PREMIUM ACCESS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Recent Enquiries Box */}
        <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
            <h3 className="text-xs font-black uppercase text-[#1a1a1a] flex items-center gap-2 tracking-wide">
              <FiInbox className="text-[#d99a3d]" size={16} />
              <span>Recent Customer Enquiries</span>
              {leads.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#241b15] text-[#d99a3d]">
                  {leads.length}
                </span>
              )}
            </h3>
            <Link to="/vendor/leads" className="text-xs text-[#d99a3d] font-black hover:underline flex items-center gap-1">
              <span>View All</span>
              <FiArrowRight size={12} />
            </Link>
          </div>

          <div className="space-y-2.5">
            {leads.length === 0 ? (
              <div className="bg-[#f8f4ec] rounded-xl p-6 text-center text-xs text-slate-500 border border-[#e3dccb]">
                No recent customer enquiries received.
              </div>
            ) : (
              leads.slice(0, 4).map((l, i) => (
                <Link
                  key={l._id || i}
                  to="/vendor/leads"
                  className="bg-[#f8f4ec] p-3 rounded-xl border border-[#e3dccb] hover:border-[#241b15] transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs group block"
                >
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-[#1a1a1a] group-hover:text-[#d99a3d] transition-colors truncate">
                      {l.subject || l.message || 'Inquiry Request'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      Buyer: <span className="font-bold text-[#1a1a1a]">{l.customerName || l.customer?.name || 'Customer'}</span>
                      {l.listing?.title && (
                        <span className="ml-1.5 text-slate-400">
                          • Listing: <span className="text-[#1a1a1a] font-bold">{l.listing.title}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <span className={`px-2.5 py-0.5 font-extrabold text-[10px] rounded-md border shrink-0 uppercase tracking-wider ${
                    l.status === 'replied' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                    l.status === 'closed' ? 'bg-slate-200 text-slate-700 border-slate-300' :
                    'bg-[#d99a3d]/20 text-[#1a1a1a] border-[#d99a3d]/40'
                  }`}>
                    {l.status === 'replied' ? 'Replied' : l.status === 'closed' ? 'Closed' : 'New'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Premium Feature Access Panel */}
        <div className="bg-white rounded-2xl p-5 border border-[#e3dccb] shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#e3dccb] pb-3">
            <h3 className="text-xs font-black uppercase text-[#1a1a1a] flex items-center gap-2 tracking-wide">
              <FiShield className="text-[#d99a3d]" size={16} />
              <span>Active Subscription Features</span>
            </h3>
            <Link to="/vendor/subscription" className="text-xs text-[#d99a3d] font-black hover:underline">
              Upgrade Plan
            </Link>
          </div>

          <div>
            {activeFeatures.length === 0 ? (
              <div className="bg-[#f8f4ec] rounded-xl p-6 text-center text-xs text-slate-500 border border-[#e3dccb] space-y-2">
                <p className="font-medium">No active premium features. Upgrade your subscription plan to unlock full capabilities!</p>
                <Link
                  to="/vendor/subscription"
                  className="inline-block px-3.5 py-1.5 bg-[#241b15] text-[#d99a3d] font-black rounded-lg text-xs hover:bg-[#3a2c22] transition"
                >
                  Explore Plans
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {activeFeatures.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-[#f8f4ec] border border-[#e3dccb] rounded-xl text-xs font-bold text-[#1a1a1a]">
                    <span className="w-2 h-2 rounded-full bg-[#d99a3d]"></span>
                    <span>{feat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Welcome Modal for First-time Vendors */}
      {showWelcomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-sans">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border-2 border-[#241b15] max-w-lg w-full shadow-2xl space-y-5 relative">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#241b15] text-[#d99a3d] border-2 border-[#d99a3d] flex items-center justify-center mx-auto shadow-md">
                <FiZap size={24} />
              </div>
              <h2 style={{ fontFamily: "'Archivo Black', sans-serif" }} className="text-lg sm:text-xl uppercase text-[#1a1a1a]">
                Welcome to BizReels Vendor Portal! 🎉
              </h2>
              <p className="text-xs text-slate-600">
                You have received <span className="font-extrabold text-emerald-700">100 Free Welcome Credits</span> in your wallet!
              </p>
            </div>

            <div className="bg-[#f8f4ec] border border-[#e3dccb] rounded-xl p-3.5 space-y-2.5 text-xs">
              <h4 className="text-[10px] font-black text-[#1a1a1a] border-b border-[#e3dccb] pb-1 uppercase tracking-wider">
                Credits Usage Breakdown:
              </h4>
              
              <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1">
                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e3dccb]">
                  <span className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                    <FiPackage className="text-[#d99a3d]" size={14} /> Listing Post
                  </span>
                  <span className="font-black text-[#241b15]">{creditRates.productListing} Credit</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e3dccb]">
                  <span className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                    <FiVideo className="text-[#d99a3d]" size={14} /> Reel Upload
                  </span>
                  <span className="font-black text-[#241b15]">{creditRates.reelPost} Credit</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e3dccb]">
                  <span className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                    <FiImage className="text-[#d99a3d]" size={14} /> AI Image Generation
                  </span>
                  <span className="font-black text-[#241b15]">{creditRates.aiImage} Credits</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e3dccb]">
                  <span className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                    <FiCpu className="text-[#d99a3d]" size={14} /> 30s AI Reel Creation
                  </span>
                  <span className="font-black text-[#241b15]">{creditRates.aiVideo30s} Credits</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e3dccb]">
                  <span className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                    <FiZap className="text-[#d99a3d]" size={14} /> 1-Day Reel Boost
                  </span>
                  <span className="font-black text-[#241b15]">{creditRates.reelBoost1Day} Credits</span>
                </div>

                <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-[#e3dccb]">
                  <span className="font-bold text-[#1a1a1a] flex items-center gap-1.5">
                    <FiInbox className="text-[#d99a3d]" size={14} /> Unlock Customer Contact
                  </span>
                  <span className="font-black text-[#241b15]">{creditRates.validLead} Credit</span>
                </div>
              </div>
            </div>

            <button
              onClick={closeWelcomeModal}
              className="w-full py-3 bg-[#241b15] text-[#d99a3d] font-black rounded-xl text-xs hover:bg-[#3a2c22] transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer border-none"
            >
              <span>Explore Vendor Portal</span>
              <FiArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

