import React from 'react';
import { Link } from 'react-router-dom';
import { FiStar, FiCalendar, FiClock, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';

export default function SubscriptionStatusCard({ user }) {
  const currentRole = user?.current_role || user?.roles?.[0] || 'vendor';
  const subscription = user?.subscription;
  const planName = subscription?.plan || 'Free Member';
  const isFree = planName === 'Free Member';

  // Calculate days remaining
  let daysRemaining = 0;
  let statusText = 'Inactive';
  let statusColor = 'text-slate-400 bg-slate-500/10 border-slate-500/20';

  if (!isFree && subscription?.expiresAt) {
    const expires = new Date(subscription.expiresAt);
    const diff = expires.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    
    if (daysRemaining > 0) {
      statusText = 'Active';
      statusColor = 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20';
    } else {
      statusText = 'Expired';
      statusColor = 'text-error bg-error/10 border-error/20';
    }
  }

  const subPagePath = currentRole === 'creator' ? '/creator/subscription' : '/vendor/subscription';

  return (
    <div className="glass p-5 rounded-2xl border border-white/50 shadow-glass flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all duration-300 hover:shadow-premium">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl ${isFree ? 'bg-slate-100 text-slate-500' : 'bg-brand-purple/10 text-brand-purple'}`}>
          <FiStar className={`w-6 h-6 ${isFree ? '' : 'fill-brand-purple/20'}`} />
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Subscription Tier</span>
          <div className="flex items-center gap-2 mt-0.5">
            <h3 className="text-lg font-black text-brand-navy font-display">{planName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusColor}`}>
              {statusText}
            </span>
          </div>
          
          {!isFree && subscription?.expiresAt && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <FiCalendar className="w-3.5 h-3.5 text-brand-purple" />
                Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <FiClock className="w-3.5 h-3.5 text-brand-purple" />
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
              </span>
            </div>
          )}
          
          {isFree && (
            <p className="text-[11px] text-slate-400 mt-1">
              Unlock higher listings, reels, and premium leads access.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-end">
        {daysRemaining <= 3 && !isFree && daysRemaining > 0 && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-[10px] font-bold">
            <FiAlertTriangle className="w-3.5 h-3.5" /> Expiring Soon!
          </div>
        )}
        <Link
          to={subPagePath}
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-purple text-white hover:bg-brand-purple-800 transition-all rounded-xl text-xs font-bold shadow-premium shrink-0"
        >
          {isFree ? 'Upgrade Plan' : 'Manage Subscription'}
          <FiArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
