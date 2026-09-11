/**
 * Utility functions for Admin Reels Management
 */

export function formatCompactNumber(num) {
  if (num === null || num === undefined) return '0';
  const n = Number(num);
  if (isNaN(n)) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString();
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function exportReelsToCsv(items, filename = 'bizreels_catalog_export.csv') {
  if (!items || !items.length) {
    alert('No reels data available to export.');
    return;
  }

  const headers = [
    'ID',
    'Caption',
    'Creator Name',
    'Creator Phone',
    'Post Type',
    'Views',
    'Likes',
    'Comments',
    'Is Boosted',
    'Is Live',
    'Status',
    'AI Moderation',
    'Admin Review',
    'Created At'
  ];

  const rows = items.map((r) => [
    `"${r.id || r._id || ''}"`,
    `"${(r.caption || '').replace(/"/g, '""')}"`,
    `"${(r.creator_name || r.creator?.name || 'Unknown').replace(/"/g, '""')}"`,
    `"${r.creator?.phone || ''}"`,
    `"${r.postType || 'general'}"`,
    r.views || 0,
    r.likesCount || 0,
    r.commentsCount || 0,
    r.isBoosted ? 'Yes' : 'No',
    r.isLiveStream ? 'Yes' : 'No',
    r.isDeleted ? 'Deleted' : 'Active',
    `"${r.aiModeration?.passed === false ? 'Flagged' : 'Passed'}"`,
    `"${r.adminReview?.status || 'none'}"`,
    `"${r.createdAt ? new Date(r.createdAt).toISOString() : ''}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
