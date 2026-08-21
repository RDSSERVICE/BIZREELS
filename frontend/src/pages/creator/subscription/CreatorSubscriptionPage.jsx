import React from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { FiCreditCard } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import SubscriptionTab from '../../../features/subscription/SubscriptionTab';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorSubscriptionPage() {
  const { bi } = useLanguage();
  const user = useSelector(selectCurrentUser);
  const { refetch: refetchUser } = useGetMeQuery(undefined, { skip: !user });

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in text-xs font-sans pb-16">
      <AdminPageHeader
        icon={FiCreditCard}
        title={bi('Creator Membership & Subscriptions', 'क्रिएटर सदस्यता और सब्सक्रिप्शन (Membership & Subscriptions)')}
        subtitle={bi('Manage your active creator tier, verify portfolio badges, and access advanced features', 'अपनी सक्रिय क्रिएटर श्रेणी प्रबंधित करें, पोर्टफोलियो बैज सत्यापित करें और उन्नत सुविधाओं तक पहुँच प्राप्त करें')}
      />

      <SubscriptionTab user={user} refetchUser={refetchUser} role="creator" />
    </div>
  );
}
