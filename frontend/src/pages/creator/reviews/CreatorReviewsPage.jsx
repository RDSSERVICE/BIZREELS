import React, { useState, useEffect } from 'react';
import { FiStar, FiMessageSquare, FiThumbsUp } from 'react-icons/fi';
import toast from 'react-hot-toast';
import AdminPageHeader from '../../../features/admin/components/AdminPageHeader';
import AdminTabBar from '../../../features/admin/components/AdminTabBar';
import AdminDataTable from '../../../features/admin/components/AdminDataTable';
import AdminStatusBadge from '../../../features/admin/components/AdminStatusBadge';
import { api } from '../../../lib/api';
import { useLanguage } from '../../../context/LanguageContext';

/**
 * CreatorReviewsPage — Displays reviews received by the creator
 * Uses the same admin component library for UI consistency
 */
export default function CreatorReviewsPage() {
  const { bi } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const TABS = [
    { key: 'all', label: bi('All Reviews', 'सभी समीक्षाएं'), icon: FiStar },
    { key: 'positive', label: bi('Positive (4-5★)', 'सकारात्मक (4-5★)'), icon: FiThumbsUp },
    { key: 'negative', label: bi('Critical (1-3★)', 'गंभीर (1-3★)'), icon: FiMessageSquare },
  ];

  useEffect(() => {
    fetchCreatorReviews();
  }, []);

  const fetchCreatorReviews = async () => {
    setLoading(true);
    try {
      const res = await api.get('/v1/reviews?targetType=creator');
      const items = res.data?.data?.reviews || res.data?.reviews || res.data?.items || (Array.isArray(res.data) ? res.data : []);
      setReviews(items);
    } catch (err) {
      console.warn('Could not fetch creator reviews:', err);
      toast.error(bi('Failed to load reviews', 'समीक्षाएं लोड करना विफल रहा'));
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = reviews.filter((r) => {
    const rating = r.rating || 5;
    if (activeTab === 'positive') return rating >= 4;
    if (activeTab === 'negative') return rating < 4;
    return true;
  });

  const columns = [
    {
      key: 'reviewer',
      label: bi('Reviewer', 'समीक्षक'),
      render: (val, row) => (
        <span className="font-bold text-text-primary">
          {row?.author?.name || row?.author_name || val || bi('Verified Customer/Vendor', 'सत्यापित ग्राहक/विक्रेता')}
        </span>
      ),
    },
    {
      key: 'rating',
      label: bi('Rating', 'रेटिंग'),
      render: (val) => {
        const ratingVal = val || 5;
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className={`text-sm ${i < ratingVal ? 'text-amber-400' : 'text-text-tertiary/30'}`}>★</span>
            ))}
            <span className="text-xs font-bold text-text-primary ml-1">{ratingVal}/5</span>
          </div>
        );
      },
    },
    {
      key: 'comment',
      label: bi('Comment', 'टिप्पणी'),
      render: (val) => <span className="text-text-secondary">{val || 'No comment provided'}</span>,
    },
    {
      key: 'project',
      label: bi('Project / Item', 'प्रोजेक्ट / आइटम'),
      render: (val, row) => (
        <span className="text-xs font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded">
          {row?.target_listing?.title || row?.listing_title || val || bi('Direct Collaboration', 'सीधा सहयोग')}
        </span>
      ),
    },
    {
      key: 'date',
      label: bi('Date', 'तिथि'),
      render: (val, row) => {
        const d = row?.created_at || row?.createdAt || val;
        return <span className="text-text-tertiary">{d ? new Date(d).toLocaleDateString('en-IN') : 'Recent'}</span>;
      },
    },
    {
      key: 'status',
      label: bi('Status', 'स्थिति'),
      render: (val, row) => <AdminStatusBadge status={row?.status || val || 'published'} />,
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
