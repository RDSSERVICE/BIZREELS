/**
 * Utility functions for Admin Offers management
 */

/**
 * Generates a high-entropy, clean promo code
 */
export function generatePromoCode(prefix = 'PROMO') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const cleanPrefix = (prefix || 'PROMO').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `${cleanPrefix ? cleanPrefix + '_' : ''}${randomPart}`;
}

/**
 * Formats currency in Indian Rupee format
 */
export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Formats a Date ISO string to localized Indian readable date & time
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Computes human readable duration between two dates
 */
export function formatDuration(start, end) {
  if (!start || !end) return '—';
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = e.getTime() - s.getTime();
  if (diffMs <= 0) return 'Expired';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

/**
 * Exports an array of campaign records to a downloadable CSV file
 */
export function exportOffersToCsv(offers = [], filename = 'offers_export.csv') {
  if (!offers.length) return;

  const headers = [
    'ID',
    'Title',
    'Code',
    'Type',
    'Vendor Store',
    'Status',
    'Discount Type',
    'Discount Value',
    'Min Order (₹)',
    'Max Discount (₹)',
    'Usage Count',
    'Usage Limit',
    'Views',
    'Clicks',
    'Start Date',
    'End Date'
  ];

  const rows = offers.map(o => [
    o._id || o.id || '',
    `"${(o.title || '').replace(/"/g, '""')}"`,
    o.code || '',
    o.isVendorOffer ? 'Vendor Store Deal' : 'Platform Campaign',
    `"${(o.vendorId?.storeName || o.vendorStoreName || 'BizReels Platform').replace(/"/g, '""')}"`,
    o.status || '',
    o.discountType || '',
    o.discountValue || 0,
    o.minOrderAmount || 0,
    o.maxDiscountLimit || 'No Limit',
    o.usedCount || 0,
    o.usageLimit || 'Unlimited',
    o.analytics?.viewsCount || 0,
    o.analytics?.clicksCount || 0,
    o.startTime ? new Date(o.startTime).toISOString() : '',
    o.endTime ? new Date(o.endTime).toISOString() : ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Exports campaign redemption audit records to CSV
 */
export function exportRedemptionsToCsv(redemptions = [], offerTitle = 'Campaign') {
  if (!redemptions.length) return;

  const headers = [
    'User Name',
    'User Email',
    'User Phone',
    'Discount Amount (₹)',
    'Order ID',
    'Redeemed At'
  ];

  const rows = redemptions.map(r => [
    `"${(r.userId?.name || 'Customer').replace(/"/g, '""')}"`,
    r.userId?.email || '',
    r.userId?.phone || '',
    r.discountAmount || 0,
    r.orderId || 'N/A',
    r.redeemedAt ? new Date(r.redeemedAt).toISOString() : ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const sanitizedTitle = (offerTitle || 'campaign').toLowerCase().replace(/[^a-z0-9]/g, '_');
  link.setAttribute('download', `${sanitizedTitle}_redemptions_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
