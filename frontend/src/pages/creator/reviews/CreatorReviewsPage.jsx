import React, { useState } from 'react';
import { FiStar, FiMessageSquare, FiThumbsUp } from 'react-icons/fi';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';

const TABS = [
  { key: 'all', label: 'All Reviews', icon: FiStar },
  { key: 'positive', label: 'Positive (4-5★)', icon: FiThumbsUp },
  { key: 'negative', label: 'Critical (1-3★)', icon: FiMessageSquare },
];

/**
 * CreatorReviewsPage — Displays reviews received by the creator
 * Uses the same admin component library for UI consistency
 */
export default function CreatorReviewsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  // Reviews would come from the reviews API filtered by target_type=creator
  // For now we display from the creator dashboard data
  const mockReviews = [
    { id: '1', reviewer: 'Vendor A', rating: 5, comment: 'Excellent video quality!', project: 'Product Reel', date: '2026-07-18', status: 'published' },
    { id: '2', reviewer: 'Vendor B', rating: 4, comment: 'Good work, timely delivery.', project: 'Service Reel', date: '2026-07-15', status: 'published' },
    { id: '3', reviewer: 'Vendor C', rating: 3, comment: 'Average quality, needs improvement.', project: 'Ad Film', date: '2026-07-12', status: 'published' },
  ];

  const filtered = mockReviews.filter((r) => {
    if (activeTab === 'positive') return r.rating >= 4;
    if (activeTab === 'negative') return r.rating < 4;
    return true;
  });

  const columns = [
    {
      key: 'reviewer',
      label: 'Reviewer',
      render: (val) => <span className="font-bold text-text-primary">{val}</span>,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (val) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <span key={i} className={`text-sm ${i < val ? 'text-amber-400' : 'text-text-tertiary/30'}`}>★</span>
          ))}
          <span className="text-xs font-bold text-text-primary ml-1">{val}/5</span>
        </div>
      ),
    },
    {
      key: 'comment',
      label: 'Comment',
      render: (val) => <span className="text-text-secondary">{val}</span>,
    },
    {
      key: 'project',
      label: 'Project',
      render: (val) => <span className="text-xs font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded">{val}</span>,
    },
    {
      key: 'date',
      label: 'Date',
      render: (val) => <span className="text-text-tertiary">{val}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <AdminStatusBadge status={val} />,
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      <AdminPageHeader
        icon={FiStar}
        title="My Reviews"
        subtitle="Reviews received from vendors for completed projects"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search reviews..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No reviews received yet. Complete projects to get reviews!"
        testId="creator-reviews-table"
      />
    </div>
  );
}
