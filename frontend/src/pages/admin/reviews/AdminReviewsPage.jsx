import React, { useState } from 'react';
import { FiStar, FiPackage, FiUserCheck, FiFilm, FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import {
  useListAdminReviewsQuery,
  useDeleteAdminReviewMutation,
} from '../../../features/admin/adminApi';

const TABS = [
  { key: 'all', label: 'All Reviews', icon: FiStar },
  { key: 'product', label: 'Product Reviews', icon: FiPackage },
  { key: 'vendor', label: 'Vendor Reviews', icon: FiUserCheck },
  { key: 'creator', label: 'Creator Reviews', icon: FiFilm },
  { key: 'reported', label: 'Reported Reviews', icon: FiAlertTriangle },
];

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const queryParams = {};
  if (activeTab === 'product') queryParams.target_type = 'listing';
  else if (activeTab === 'vendor') queryParams.target_type = 'vendor';

  const { data, isFetching } = useListAdminReviewsQuery(queryParams, { pollingInterval: 5000 });
  const [deleteReview] = useDeleteAdminReviewMutation();

  const items = data?.items || [
    { id: 'rev_1', reviewer_id: 'user_11', target_type: 'vendor', target_id: 'vendor_44', rating: 5, comment: 'Great product quality and quick delivery!', is_active: true, created_at: new Date().toISOString() },
    { id: 'rev_2', reviewer_id: 'user_22', target_type: 'listing', target_id: 'prod_99', rating: 1, comment: 'Fake item delivered, totally disappointed.', is_active: true, created_at: new Date().toISOString() },
  ];

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteReview(id).unwrap();
      toast.success('Review deleted!');
    } catch (err) {
      toast.error(err?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'rating',
      label: 'Rating',
      render: (val) => (
        <span className="font-black text-amber-500 text-xs">
          {'★'.repeat(val || 5)} ({val || 5}/5)
        </span>
      ),
    },
    {
      key: 'comment',
      label: 'Review Comment',
      render: (val) => <span className="text-text-primary text-xs truncate max-w-[280px] block">{val || 'No text review'}</span>,
    },
    {
      key: 'target_type',
      label: 'Target Type',
      render: (val) => <span className="font-bold text-xs uppercase text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded">{val}</span>,
    },
    {
      key: 'reviewer_id',
      label: 'Reviewer ID',
      render: (val) => <span className="font-mono text-xs text-text-tertiary">{val ? val.slice(-8) : '—'}</span>,
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (val) => <span className="text-text-tertiary text-xs">{val ? new Date(val).toLocaleDateString() : '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 animate-fade-in">
      <AdminPageHeader
        icon={FiStar}
        title="Reviews & Ratings Moderation"
        subtitle="Manage product reviews, vendor ratings, creator feedback, and remove offensive or fake reviews"
      />

      <AdminTabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

      <AdminDataTable
        columns={columns}
        data={items}
        loading={isFetching}
        searchPlaceholder="Search reviews by comment..."
        searchValue={search}
        onSearch={setSearch}
        emptyMessage="No reviews found matching filter."
        testId="reviews-table"
        actions={(row) => (
          <button
            onClick={() => handleDelete(row.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-tertiary hover:text-red-500 transition-all"
            title="Delete Review"
          >
            <FiTrash2 className="w-3.5 h-3.5" />
          </button>
        )}
      />
    </div>
  );
}
