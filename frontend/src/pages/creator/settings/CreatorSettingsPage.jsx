import React from 'react';
import { useSelector } from 'react-redux';
import { FiSettings } from 'react-icons/fi';
import { useGetMeQuery } from '../../../features/auth/authApi';
import { selectCurrentUser } from '../../../features/auth/authSlice';
import { tokenStore } from '../../../lib/api';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import CreatorSettingsTab from '../../../features/creator/CreatorSettingsTab';

export default function CreatorSettingsPage() {
  const user = useSelector(selectCurrentUser);
  const { data: profileRes } = useGetMeQuery(undefined, {
    pollingInterval: 300000,
    skip: !user && !tokenStore.getAccess(),
  });

  const profileUser = profileRes?.data?.user || profileRes?.user || user || {};

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiSettings}
        title="Creator Settings & Workspace"
        subtitle="Manage campaign notifications, workspace directory visibility, and security preferences"
      />

      <CreatorSettingsTab user={profileUser} />
    </div>
  );
}
