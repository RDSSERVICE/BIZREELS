import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { FiCreditCard } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import SubscriptionTab from '../../../features/subscription/SubscriptionTab';

export default function CreatorSubscriptionPage() {
  const user = useSelector(selectCurrentUser);
  const { refetch: refetchUser } = useGetMeQuery(undefined, { skip: !user });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in text-xs">
      <AdminPageHeader
        icon={FiCreditCard}
        title="Creator Membership & Subscriptions"
        subtitle="Manage your active creator tier, verify portfolio badges, and access advanced features"
      />

      <SubscriptionTab user={user} refetchUser={refetchUser} />
    </div>
  );
}
