import React, { useState } from 'react';
import { FiFilm, FiEye, FiCheck, FiX, FiSlash, FiDollarSign, FiMapPin, FiStar, FiUser, FiClock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import AdminModal from '../../../features/admin/components/AdminModal';
import {
  useListAdminUsersQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useGetUserDetailQuery,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Creators', icon: FiFilm },
  { key: 'pending', label: 'Pending Approval', icon: FiCheck },
  { key: 'approved', label: 'Verified', icon: FiCheck },
];

export default function AdminCreators() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const queryParams = { q: search || undefined, role: 'creator', limit: 100 };
  if (activeTab === 'pending') queryParams.kyc_status = 'pending';
  else if (activeTab === 'approved') queryParams.kyc_status = 'approved';

  const { data, isFetching } = useListAdminUsersQuery(queryParams, { pollingInterval: 5000 });
  const [banUser] = useBanUserMutation();
  const [unbanUser] = useUnbanUserMutation();

  const { data: userDetail } = useGetUserDetailQuery(selectedUser, {
    skip: !selectedUser || !showDetail,
  });

  const items = data?.items || [];

  const handleSuspend = async (id, name, isBanned) => {
    try {
      if (isBanned) {
        await unbanUser(id).unwrap();
        toast.success(`${name} unsuspended`);
      } else {
        if (!window.confirm(`Suspend ${name}?`)) return;
        await banUser(id).unwrap();
        toast.success(`${name} suspended`);
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Creator',
      render: (val, row) => (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-brand-pink/10 text-brand-pink flex items-center justify-center text-[10px] font-black flex-shrink-0">
            {(val || 'C')[0].toUpperCase()}
          </div>
          <div>
            <span className="font-bold text-text-primary block">{val || 'Unknown'}</span>
            <span className="text-[10px] text-text-tertiary">{row.phone || '—'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'kyc_status',
      label: 'KYC',
      render: (val) => <AdminStatusBadge status={val} />,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (val, row) => (
        <AdminStatusBadge status={row.is_banned ? 'Suspended' : val ? 'Active' : 'Inactive'} />
      ),
    },
    {
      key: 'rating_avg',
      label: 'Rating',
      render: (val) => (
        <span className="text-xs font-bold text-amber-500">{val ? `★ ${val.toFixed(1)}` : '—'}</span>
      ),
    },
    {
      key: 'trust_score',
      label: 'Trust',
      render: (val) => (
        <span className="text-xs font-bold text-brand-purple">{val || '—'}</span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      render: (val) => <span className="text-text-tertiary">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  const profile = userDetail?.creator_profile || userDetail?.creatorProfile;
  const pricing = profile?.pricing;

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiFilm}
        title="Creator Management"
        subtitle="Review creator applications, manage ratings, earnings, and suspension status"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search creators by name or phone..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No creators found."
        testId="creators-table"
        actions={(row) => (
          <>
            <button
              onClick={() => { setSelectedUser(row.id); setShowDetail(true); }}
              className="p-1.5 rounded-lg hover:bg-brand-purple/10 text-text-tertiary hover:text-brand-purple transition-all"
              title="View"
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSuspend(row.id, row.name, row.is_banned)}
              className={`p-1.5 rounded-lg transition-all ${row.is_banned ? 'hover:bg-emerald-500/10 text-text-tertiary hover:text-emerald-500' : 'hover:bg-red-500/10 text-text-tertiary hover:text-red-500'}`}
              title={row.is_banned ? 'Unsuspend' : 'Suspend'}
            >
              <FiSlash className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      />

      {/* Creator Detail Modal */}
      <AdminModal isOpen={showDetail} onClose={() => { setShowDetail(false); setSelectedUser(null); }} title="Creator Details" maxWidth="max-w-xl">
        {userDetail ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 border-b border-border/50 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-pink/10 text-brand-pink flex items-center justify-center text-xl font-black flex-shrink-0">
                {userDetail.profile_pic || userDetail.avatarUrl ? (
                  <img src={userDetail.profile_pic || userDetail.avatarUrl} alt="" className="w-14 h-14 rounded-2xl object-cover" />
                ) : (
                  (userDetail.name || 'C')[0].toUpperCase()
                )}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-text-primary">{userDetail.name || 'Unknown'}</h4>
                  <AdminStatusBadge status={userDetail.kyc_status} />
                  {userDetail.is_banned && (
                    <span className="text-[9px] font-bold bg-red-500/10 text-red-500 px-2 py-0.5 rounded uppercase">Suspended</span>
                  )}
                </div>
                <p className="text-xs text-text-tertiary">{userDetail.phone || '—'} • {userDetail.email || '—'}</p>
                {(userDetail.city || profile?.city) && (
                  <p className="text-xs text-text-secondary flex items-center gap-1 font-medium">
                    <FiMapPin className="w-3 h-3 text-brand-orange" /> {userDetail.city || profile?.city}
                  </p>
                )}
              </div>
            </div>

            {/* Creator Profile & Bio */}
            {profile && (
              <div className="bg-surface-secondary/70 rounded-xl p-4 space-y-3 border border-border/60">
                <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                  <FiFilm className="w-3.5 h-3.5 text-brand-pink" /> Portfolio & Experience
                </h5>

                {profile.bio && (
                  <p className="text-xs text-text-secondary bg-surface p-2.5 rounded-lg italic border border-border/40">
                    "{profile.bio}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-text-tertiary text-[10px] font-bold uppercase block">Experience</span>
                    <span className="font-bold text-text-primary">{profile.experienceYears || profile.experience || '—'} Years</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px] font-bold uppercase block">Languages</span>
                    <span className="font-bold text-text-primary">
                      {Array.isArray(profile.languages) ? profile.languages.join(', ') : profile.languages || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px] font-bold uppercase block">Availability</span>
                    <span className={`inline-block font-bold text-[11px] px-2 py-0.5 rounded mt-0.5 ${
                      profile.availabilityStatus === 'Available' || profile.availability === 'Available'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {profile.availabilityStatus || profile.availability || 'Available'}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary text-[10px] font-bold uppercase block">Travel Available</span>
                    <span className="font-bold text-text-primary">{profile.travelAvailable ? '✓ Yes' : 'No'}</span>
                  </div>
                </div>

                {profile.categories && profile.categories.length > 0 && (
                  <div>
                    <span className="text-text-tertiary text-[10px] font-bold uppercase block mb-1.5">Categories</span>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.categories.map((cat, idx) => (
                        <span key={idx} className="text-[10px] font-bold bg-brand-pink/10 text-brand-pink px-2.5 py-0.5 rounded-full border border-brand-pink/20">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pricing Section */}
            {pricing && typeof pricing === 'object' && (
              <div className="bg-surface-secondary/70 rounded-xl p-4 space-y-2.5 border border-border/60">
                <h5 className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider flex items-center gap-1.5">
                  <FiDollarSign className="w-3.5 h-3.5 text-emerald-500" /> Rates & Service Pricing
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(pricing.oneReel || pricing.reel1) && (
                    <div className="bg-surface p-2.5 rounded-lg border border-border/50 text-center">
                      <span className="text-[9px] text-text-tertiary font-bold uppercase block">1 Reel Rate</span>
                      <span className="text-xs font-black text-emerald-600">₹{Number(pricing.oneReel || pricing.reel1).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(pricing.threeReels || pricing.reel3) && (
                    <div className="bg-surface p-2.5 rounded-lg border border-border/50 text-center">
                      <span className="text-[9px] text-text-tertiary font-bold uppercase block">3 Reels Package</span>
                      <span className="text-xs font-black text-emerald-600">₹{Number(pricing.threeReels || pricing.reel3).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {(pricing.tenReels || pricing.reel10) && (
                    <div className="bg-surface p-2.5 rounded-lg border border-border/50 text-center">
                      <span className="text-[9px] text-text-tertiary font-bold uppercase block">10 Reels Package</span>
                      <span className="text-xs font-black text-emerald-600">₹{Number(pricing.tenReels || pricing.reel10).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {pricing.hourlyRate && (
                    <div className="bg-surface p-2.5 rounded-lg border border-border/50 text-center">
                      <span className="text-[9px] text-text-tertiary font-bold uppercase block">Hourly Rate</span>
                      <span className="text-xs font-black text-emerald-600">₹{Number(pricing.hourlyRate).toLocaleString('en-IN')} / hr</span>
                    </div>
                  )}
                  {pricing.dayRate && (
                    <div className="bg-surface p-2.5 rounded-lg border border-border/50 text-center">
                      <span className="text-[9px] text-text-tertiary font-bold uppercase block">Day Rate</span>
                      <span className="text-xs font-black text-emerald-600">₹{Number(pricing.dayRate).toLocaleString('en-IN')} / day</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {[
                ['Rating', userDetail.rating_avg ? `★ ${userDetail.rating_avg.toFixed(1)}` : '—'],
                ['Trust Score', userDetail.trust_score || '—'],
                ['Followers', userDetail.followersCount || 0],
                ['Following', userDetail.followingCount || 0],
                ['Wallet Credits', userDetail.wallet?.credits || 0],
                ['City', userDetail.city || profile?.city || '—'],
              ].map(([label, val]) => (
                <div key={label} className="bg-surface-secondary/70 rounded-xl p-3 border border-border/50">
                  <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-wider block">{label}</span>
                  <span className="text-xs font-black text-text-primary mt-0.5 block">{val}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-text-tertiary text-xs">Loading creator details...</div>
        )}
      </AdminModal>
    </div>
  );
}
