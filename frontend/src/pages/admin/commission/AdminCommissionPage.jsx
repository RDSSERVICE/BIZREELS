import React, { useState } from 'react';
import { FiDollarSign, FiPercent, FiSliders, FiFileText, FiTrendingUp, FiActivity } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import PlatformCommission from './components/PlatformCommission';
import LeadBoostCharges from './components/LeadBoostCharges';
import GSTSettings from './components/GSTSettings';
import CommissionAnalytics from './components/CommissionAnalytics';
import CommissionHistoryTab from './components/CommissionHistoryTab';

const TABS = [
  { key: 'platform', label: 'Platform & Categories', icon: FiPercent },
  { key: 'lead', label: 'Lead & Boost Charges', icon: FiSliders },
  { key: 'tax', label: 'GST Configuration', icon: FiFileText },
  { key: 'analytics', label: 'Fee Revenue Analytics', icon: FiTrendingUp },
  { key: 'history', label: 'Rate Audit Trail', icon: FiActivity },
];

export default function AdminCommissionPage() {
  const [activeTab, setActiveTab] = useState('platform');

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiDollarSign}
        title="Commission & Taxation Management"
        subtitle="Configure platform take-rates, category overrides, pay-per-lead costs, ad boosts, HSN compliance, and GST invoice taxation."
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'platform' && <PlatformCommission />}
      {activeTab === 'lead' && <LeadBoostCharges />}
      {activeTab === 'tax' && <GSTSettings />}
      {activeTab === 'analytics' && <CommissionAnalytics />}
      {activeTab === 'history' && <CommissionHistoryTab />}
    </div>
  );
}
