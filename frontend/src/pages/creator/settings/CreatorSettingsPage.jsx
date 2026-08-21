import React from 'react';
import { useSelector } from 'react-redux';
import { FiSettings } from 'react-icons/fi';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { tokenStore } from '../../../lib/api';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import CreatorSettingsTab from '../../../features/creator/CreatorSettingsTab';
import { useLanguage } from '../../../context/LanguageContext';

export default function CreatorSettingsPage() {
  const { bi } = useLanguage();
  const user = useSelector(selectCurrentUser);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !user && !tokenStore.getUser(),
  });

  const profileUser = profileRes?.data?.user || profileRes?.user || user || {};

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in font-sans pb-16">
      <AdminPageHeader
        icon={FiSettings}
        title={bi('Creator Settings & Workspace', 'क्रिएटर सेटिंग्स और वर्कस्पेस (Settings & Workspace)')}
        subtitle={bi('Manage campaign notifications, workspace directory visibility, and security preferences', 'अभियान की सूचनाएं, कार्यक्षेत्र निर्देशिका दृश्यता और सुरक्षा प्राथमिकताओं को प्रबंधित करें')}
      />

      <CreatorSettingsTab user={profileUser} />
    </div>
  );
}
