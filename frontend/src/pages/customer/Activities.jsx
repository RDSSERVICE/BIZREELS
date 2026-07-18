import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../features/auth/authSlice';
import {
  useGetOrdersQuery,
  useGetInquiriesQuery,
  useUnsaveListingMutation,
  useUnfollowUserMutation,
} from '../../features/customer/activitiesApi';
import { useGetRequirementsQuery } from '../../features/customer/requirementsApi';
import {
  FiHeart,
  FiUserMinus,
  FiBriefcase,
  FiShoppingBag,
  FiMessageSquare,
  FiFileText,
  FiUsers,
  FiClock,
  FiMapPin,
  FiCheckCircle,
} from 'react-icons/fi';
import Loader from '../../components/common/Loader';
import { toast } from 'react-hot-toast';

const Activities = () => {
  const user = useSelector(selectCurrentUser);
  const [activeTab, setActiveTab] = useState('saved_products');

  // API Queries & Mutations
  const { data: ordersRes, isLoading: isOrdersLoading } = useGetOrdersQuery();
  const { data: inquiriesRes, isLoading: isInquiriesLoading } = useGetInquiriesQuery();
  const { data: reqsRes, isLoading: isReqsLoading } = useGetRequirementsQuery(
    { customerId: user?._id },
    { skip: !user?._id }
  );

  const [unsaveListing] = useUnsaveListingMutation();
  const [unfollowUser] = useUnfollowUserMutation();

  // Parse Saved Items
  const savedListings = user?.customerProfile?.savedListings || [];
  const savedProducts = savedListings.filter((l) => l.type === 'product');
  const savedServices = savedListings.filter((l) => l.type === 'service');

  // Parse Followings
  const followingList = user?.following || [];
  const followingVendors = followingList.filter((u) => u.roles?.includes('vendor'));
  const followingCreators = followingList.filter((u) => u.roles?.includes('creator'));

  const orders = ordersRes?.orders || [];
  const inquiries = inquiriesRes?.inquiries || [];
  const requirements = reqsRes?.data || [];

  const handleUnsave = async (id) => {
    try {
      await unsaveListing(id).unwrap();
      toast.success('Listing removed from saved items.');
    } catch (e) {
      toast.error('Failed to unsave listing.');
    }
  };

  const handleUnfollow = async (id) => {
    try {
      await unfollowUser(id).unwrap();
      toast.success('Unfollowed user.');
    } catch (e) {
      toast.error('Failed to unfollow.');
    }
  };

  // Tabs structure
  const tabs = [
    { id: 'saved_products', label: 'Saved Products', icon: FiShoppingBag },
    { id: 'saved_services', label: 'Saved Services', icon: FiBriefcase },
    { id: 'orders', label: 'My Orders', icon: FiShoppingBag },
    { id: 'inquiries', label: 'Inquiry History', icon: FiMessageSquare },
    { id: 'quotes', label: 'Quotes Received', icon: FiFileText },
    { id: 'following_vendors', label: 'Following Vendors', icon: FiUsers },
    { id: 'following_creators', label: 'Following Creators', icon: FiUsers },
  ];

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto animate-fade-in pb-16">
      {/* Page Header */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-brand-navy font-display">
            My <span className="gradient-text font-black">Activities Hub</span>
          </h2>
          <p className="text-xs text-text-tertiary mt-1">
            Manage your bookmarks, track online orders, monitor local storefront inquiries, and see vendor followings.
          </p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex bg-surface-tertiary/75 p-1 rounded-premium gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-premium whitespace-nowrap transition-all cursor-pointer
                ${isActive
                  ? 'bg-brand-purple text-white shadow-premium'
                  : 'text-text-secondary hover:text-brand-purple hover:bg-surface-secondary/40'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Viewports */}
      <div className="glass p-6 rounded-premium border-white/50 shadow-glass min-h-[350px]">
        {/* ── SAVED PRODUCTS ── */}
        {activeTab === 'saved_products' && (
          <div>
            {savedProducts.length === 0 ? (
              <EmptyState message="No saved products found. Explore the marketplace to add items here." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedProducts.map((p) => (
                  <ListingCard key={p._id} item={p} onUnsave={handleUnsave} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SAVED SERVICES ── */}
        {activeTab === 'saved_services' && (
          <div>
            {savedServices.length === 0 ? (
              <EmptyState message="No saved services found. Discover local service options on the marketplace." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedServices.map((s) => (
                  <ListingCard key={s._id} item={s} onUnsave={handleUnsave} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY ORDERS ── */}
        {activeTab === 'orders' && (
          <div>
            {isOrdersLoading ? (
              <div className="flex justify-center py-12"><Loader /></div>
            ) : orders.length === 0 ? (
              <EmptyState message="You haven't placed any online orders yet." />
            ) : (
              <div className="flex flex-col gap-4">
                {orders.map((order) => (
                  <div key={order._id} className="p-4 bg-white/40 border border-border rounded-premium flex flex-col sm:flex-row justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-premium overflow-hidden bg-surface-tertiary">
                        <img
                          src={order.listing?.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150'}
                          alt={order.listing?.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-brand-orange uppercase">{order.listing?.category}</span>
                        <h4 className="text-sm font-bold text-brand-navy mt-0.5">{order.listing?.title}</h4>
                        <p className="text-[10px] text-text-tertiary mt-1">Order Ref: {order._id.slice(-6).toUpperCase()}</p>
                        <p className="text-xs text-text-secondary mt-1">Vendor: <span className="font-semibold text-brand-navy">{order.vendor?.businessName || order.vendor?.name}</span></p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-between text-right">
                      <div>
                        <span className="text-xs text-text-tertiary block">Quantity: {order.quantity}</span>
                        <span className="text-sm font-black text-brand-purple">₹{order.price}</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase
                          ${order.status === 'completed' ? 'bg-success/15 text-success' : 'bg-brand-orange/15 text-brand-orange'}
                        `}>
                          Status: {order.status}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-success/10 text-success">
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── INQUIRY HISTORY ── */}
        {activeTab === 'inquiries' && (
          <div>
            {isInquiriesLoading ? (
              <div className="flex justify-center py-12"><Loader /></div>
            ) : inquiries.length === 0 ? (
              <EmptyState message="No listing inquiries found." />
            ) : (
              <div className="flex flex-col gap-4">
                {inquiries.map((inq) => (
                  <div key={inq._id} className="p-4 bg-white/40 border border-border rounded-premium flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex flex-col">
                        <h4 className="text-sm font-bold text-brand-navy">{inq.listing?.title}</h4>
                        <span className="text-[10px] text-text-tertiary mt-0.5">
                          Inquiry to {inq.vendor?.businessName || inq.vendor?.name}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase
                        ${inq.status === 'pending' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-success/10 text-success'}
                      `}>
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed bg-surface-secondary/40 p-3 rounded-premium border border-border-light">
                      &quot;{inq.message}&quot;
                    </p>
                    <span className="text-[9px] text-text-tertiary">
                      Sent on: {new Date(inq.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── QUOTES RECEIVED ── */}
        {activeTab === 'quotes' && (
          <div>
            {isReqsLoading ? (
              <div className="flex justify-center py-12"><Loader /></div>
            ) : requirements.length === 0 ? (
              <EmptyState message="You haven't posted any requirements yet to receive quotes." />
            ) : (
              <div className="flex flex-col gap-4">
                {requirements.map((req) => (
                  <div key={req._id} className="p-4 bg-white/40 border border-border rounded-premium flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase text-brand-purple bg-brand-purple/10 rounded">
                        {req.requirementType} &bull; {req.category}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded
                        ${req.status === 'open' ? 'bg-brand-orange/10 text-brand-orange' : 'bg-success/10 text-success'}
                      `}>
                        {req.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-navy">{req.title}</h4>
                      <p className="text-xs text-text-secondary mt-1 leading-relaxed">{req.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border-light text-[10px] text-text-tertiary">
                      <span className="font-bold text-brand-navy">Budget: ₹{req.budget}</span>
                      <span className="px-2 py-1 bg-brand-purple/5 border border-brand-purple/15 text-brand-purple rounded-full font-bold">
                        {req.quotesCount || 0} quotes received
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FOLLOWING VENDORS ── */}
        {activeTab === 'following_vendors' && (
          <div>
            {followingVendors.length === 0 ? (
              <EmptyState message="You aren't following any vendors currently." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {followingVendors.map((vendor) => (
                  <FollowingUserCard key={vendor._id} peer={vendor} type="vendor" onUnfollow={handleUnfollow} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── FOLLOWING CREATORS ── */}
        {activeTab === 'following_creators' && (
          <div>
            {followingCreators.length === 0 ? (
              <EmptyState message="You aren't following any creators currently." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {followingCreators.map((creator) => (
                  <FollowingUserCard key={creator._id} peer={creator} type="creator" onUnfollow={handleUnfollow} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Subcomponent: Empty State
const EmptyState = ({ message }) => (
  <div className="py-16 text-center flex flex-col items-center justify-center gap-2">
    <p className="text-sm font-bold text-brand-navy">Nothing here yet</p>
    <p className="text-xs text-text-secondary max-w-sm leading-relaxed">{message}</p>
  </div>
);

// Subcomponent: Listing Bookmarked Card
const ListingCard = ({ item, onUnsave }) => {
  return (
    <div className="bg-white/40 border border-border p-3.5 rounded-premium flex flex-col gap-3 relative hover:shadow-premium transition-all">
      <div className="h-32 w-full rounded-premium overflow-hidden bg-surface-tertiary">
        <img
          src={item.images?.[0] || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400'}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div>
        <span className="text-[9px] font-black uppercase text-brand-orange">{item.category}</span>
        <h4 className="text-xs font-bold text-brand-navy line-clamp-1 mt-0.5">{item.title}</h4>
        <span className="text-[10px] text-text-tertiary mt-1 block">by {item.vendor?.businessName || item.vendor?.name}</span>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-border-light">
        <span className="text-xs font-black text-brand-navy">₹{item.salePrice || item.price}</span>
        <button
          onClick={() => onUnsave(item._id)}
          className="p-1.5 rounded-full hover:bg-error-light/30 text-brand-pink hover:text-error transition-all cursor-pointer"
          title="Remove Bookmark"
        >
          <FiHeart className="w-4 h-4 fill-brand-pink text-brand-pink" />
        </button>
      </div>
    </div>
  );
};

// Subcomponent: Followed Vendor/Creator Card
const FollowingUserCard = ({ peer, type, onUnfollow }) => {
  const profileName = type === 'vendor' ? peer.vendorProfile?.businessName || peer.name : peer.name;
  const description = type === 'vendor' ? peer.vendorProfile?.category : peer.creatorProfile?.bio || 'Content Creator';

  return (
    <div className="bg-white/40 border border-border p-4 rounded-premium flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <img
          src={peer.avatarUrl || 'https://via.placeholder.com/150'}
          alt={peer.name}
          className="w-10 h-10 rounded-full object-cover border border-brand-purple/20"
        />
        <div className="flex flex-col">
          <h4 className="text-xs font-bold text-brand-navy line-clamp-1">{profileName}</h4>
          <span className="text-[10px] text-text-secondary truncate max-w-[130px] mt-0.5">{description}</span>
        </div>
      </div>

      <button
        onClick={() => onUnfollow(peer._id)}
        className="p-2 rounded-full hover:bg-error-light/30 text-text-secondary hover:text-error transition-all cursor-pointer"
        title="Unfollow"
      >
        <FiUserMinus className="w-4 h-4" />
      </button>
    </div>
  );
};

export default Activities;
