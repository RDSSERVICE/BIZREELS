import React, { useState } from 'react';
import { FiUsers, FiCopy, FiShare2, FiGift, FiAward, FiClock, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import { useGetVendorDashboardQuery } from '../../../features/vendor/vendorApi';

export default function VendorReferralPage() {
  const { data: dashboardRes, isLoading } = useGetVendorDashboardQuery(undefined, {
    pollingInterval: 300000,
  });

  const rawData = dashboardRes?.data;
  const metrics = (rawData?.totalProducts !== undefined ? rawData : rawData?.data) || {};
  const referral = metrics.referral || {
    code: '',
    link: '',
    totalReferrals: 0,
    successfulReferrals: 0,
    creditsEarned: 0
  };
  const items = referral.items || [];

  const handleCopyCode = () => {
    if (!referral.code) return;
    navigator.clipboard.writeText(referral.code);
    toast.success('Referral code copied to clipboard!');
  };

  const handleCopyLink = () => {
    if (!referral.link) return;
    navigator.clipboard.writeText(referral.link);
    toast.success('Referral link copied to clipboard!');
  };

  const handleShare = async () => {
    if (!referral.link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join BizReels',
          text: `Join BizReels and grow your business! Use my referral code ${referral.code} to get bonus credits.`,
          url: referral.link,
        });
      } catch (err) {
        // user cancelled share
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 animate-fade-in pb-12">
      <AdminPageHeader
        icon={FiUsers}
        title="Refer & Earn Rewards"
        subtitle="Invite other vendors to join BizReels, earn bonus credits when they sign up and start listing products"
      />

      {/* Main Referral Program & Action Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Widget: Refer & Action */}
        <div className="lg:col-span-2 glass rounded-3xl p-6 sm:p-8 border border-white/50 shadow-glass flex flex-col justify-between bg-gradient-to-tr from-brand-purple/20 via-surface to-brand-pink/5 space-y-6">
          <div className="space-y-2">
            <div className="inline-flex p-2.5 rounded-xl bg-brand-purple/10 text-brand-purple">
              <FiGift className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-text-primary font-display">Invite Vendors & Earn 200 Credits</h3>
            <p className="text-[11px] text-text-secondary leading-relaxed max-w-lg">
              Share your unique referral link or code with shop owners and business firms. When they register using your code, they immediately receive **100 bonus credits**; once they list their first products/reels, you receive **200 bonus credits** directly into your credit wallet!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Referral Code Box */}
            <div className="bg-surface/50 border border-border p-4 rounded-2xl flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Your Invite Code</span>
              <div className="flex items-center justify-between gap-2 bg-surface px-3 py-2.5 rounded-xl border border-border">
                <span className="text-sm font-black tracking-widest text-text-primary font-display">{referral.code || 'SCUPVV'}</span>
                <button onClick={handleCopyCode} className="text-brand-purple p-1 hover:bg-brand-purple/10 rounded-lg transition">
                  <FiCopy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Sharing buttons */}
            <div className="bg-surface/50 border border-border p-4 rounded-2xl flex flex-col justify-between gap-3">
              <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider block">Share Link Directly</span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 bg-surface border border-border hover:bg-surface-tertiary text-text-secondary font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <FiCopy size={13} />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 py-2.5 gradient-brand text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-premium hover:opacity-90 transition active:scale-95"
                >
                  <FiShare2 size={13} />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Widget: Referral Stats */}
        <div className="lg:col-span-1 glass rounded-3xl p-6 border border-white/50 shadow-glass bg-surface-secondary space-y-4">
          <h4 className="text-xs font-black text-text-primary uppercase tracking-wider border-b border-border pb-3 flex items-center gap-1.5">
            <FiAward className="text-brand-purple" /> Program Status Metrics
          </h4>

          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border">
              <span className="text-[11px] font-bold text-text-secondary">Total Referrals</span>
              <span className="text-sm font-black text-text-primary">{referral.totalReferrals}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border">
              <span className="text-[11px] font-bold text-text-secondary">KYC/Listing Completed</span>
              <span className="text-sm font-black text-emerald-500">{referral.successfulReferrals}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-surface border border-border">
              <span className="text-[11px] font-bold text-text-secondary">Pending Activation</span>
              <span className="text-sm font-black text-amber-500">
                {Math.max(0, referral.totalReferrals - referral.successfulReferrals)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-brand-purple/10 to-brand-pink/5 border border-brand-purple/20">
              <span className="text-[11px] font-bold text-brand-purple">Total Credits Earned</span>
              <span className="text-sm font-black text-brand-purple">₹{referral.creditsEarned}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Referrals Activity List / History Table */}
      <div className="glass p-6 rounded-3xl border border-white/50 shadow-glass space-y-4">
        <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
          <FiUsers className="text-brand-purple" /> Referral Signup History
        </h3>

        {isLoading ? (
          <div className="text-center text-xs text-text-tertiary py-8">
            Loading activity history...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center text-xs text-text-tertiary py-8 border border-dashed border-border rounded-2xl bg-surface/30">
            No referred signups recorded yet. Start sharing your code to earn free credits!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border text-text-tertiary uppercase font-bold text-[9px] tracking-wider">
                  <th className="py-3 px-4">Invited Name</th>
                  <th className="py-3 px-4">Referred Phone</th>
                  <th className="py-3 px-4">Date Joined</th>
                  <th className="py-3 px-4">Referrer Reward</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 text-text-secondary font-medium">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-brand-purple/5 transition-all">
                    <td className="py-3.5 px-4 font-bold text-text-primary">{item.referred_name || 'Anonymous User'}</td>
                    <td className="py-3.5 px-4 text-text-tertiary font-mono">{item.referred_phone_masked || 'N/A'}</td>
                    <td className="py-3.5 px-4">{item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</td>
                    <td className="py-3.5 px-4 font-bold text-brand-purple">+{item.referrer_reward} Credits</td>
                    <td className="py-3.5 px-4">
                      {item.status === 'credited' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold border border-emerald-500/20">
                          <FiCheckCircle size={10} /> Credited
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-bold border border-amber-500/20">
                          <FiClock size={10} /> Pending listing
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
