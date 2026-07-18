import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';
import { useGetMeQuery } from '../features/auth/authApi';
import SubscriptionTab from '../features/subscription/SubscriptionTab';

const Subscription = () => {
  const user = useSelector(selectCurrentUser);
  const { refetch: refetchUser } = useGetMeQuery(undefined, { skip: !user });

  return (
    <div className="max-w-4xl mx-auto py-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-brand-navy font-display">Membership Subscription</h2>
        <p className="text-xs text-slate-400 mt-1">Upgrade plans to access premium AI generation, streaming, and listing boosts.</p>
      </div>
      <SubscriptionTab user={user} refetchUser={refetchUser} />
    </div>
  );
};

export default Subscription;
