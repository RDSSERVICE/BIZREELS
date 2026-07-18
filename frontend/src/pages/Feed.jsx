import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

/**
 * Premium placeholder for main consumer feed page.
 */
const Feed = () => {
  const user = useSelector(selectCurrentUser);

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto animate-fade-in">
      <div className="glass p-8 rounded-premium border-white/50 shadow-glass flex flex-col items-center justify-center text-center gap-4">
        <h2 className="text-3xl font-black text-brand-navy">
          Welcome to <span className="gradient-text font-black">BizReels</span>, {user?.name}!
        </h2>
        <p className="text-sm text-text-secondary max-w-md">
          Sprint 1 (Authentication & Multi-Role Account Setup) is fully complete. You have logged in successfully.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-2">
          <span className="px-3 py-1 text-xs font-bold bg-brand-purple/10 text-brand-purple rounded-full">
            Active Role: {user?.activeRole}
          </span>
          <span className="px-3 py-1 text-xs font-bold bg-brand-orange/10 text-brand-orange rounded-full">
            Plan: {user?.subscription?.plan}
          </span>
          <span className="px-3 py-1 text-xs font-bold bg-brand-pink/10 text-brand-pink rounded-full">
            Wallet: ₹{user?.walletBalance}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Feed;
