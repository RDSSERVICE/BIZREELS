/**
 * Utility functions for Admin Listings Management
 */

export function formatCompactNumber(num = 0) {
  const n = Number(num) || 0;
  if (n >= 10000000) return (n / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toLocaleString('en-IN');
}

export function formatCurrencyINR(amount = 0) {
  const a = Number(amount) || 0;
  return '₹' + a.toLocaleString('en-IN');
}

export function getStockStatus(item) {
  if (item?.type === 'service') {
    return { label: 'Service', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  }
  const stock = item?.stock ?? 0;
  if (stock <= 0 || item?.status === 'out_of_stock') {
    return { label: 'Out of Stock (0)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
  }
  if (stock <= 5) {
    return { label: `Low Stock (${stock})`, color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { label: `In Stock (${stock})`, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}

export function exportListingsToCsv(items = [], filename = 'bizreels_listings_export.csv') {
  if (!items || items.length === 0) return;

  const headers = [
    'Listing ID',
    'Title',
    'Type',
    'Condition',
    'Category',
    'Price (INR)',
    'Stock',
    'Status',
    'Is Taken Down',
    'Vendor ID',
    'Vendor Name',
    'Views',
    'Likes',
    'Orders',
    'Created At'
  ];

  const rows = items.map((item) => {
    return [
      `"${item.id || item._id || ''}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${item.type || 'product'}"`,
      `"${item.condition || 'new'}"`,
      `"${(item.category || '').replace(/"/g, '""')}"`,
      item.price || 0,
      item.type === 'service' ? 'N/A' : (item.stock ?? 0),
      `"${item.status || 'published'}"`,
      item.is_takendown ? 'YES' : 'NO',
      `"${item.vendor_id || ''}"`,
      `"${(item.vendor_name || '').replace(/"/g, '""')}"`,
      item.views || 0,
      item.likes || 0,
      item.orders_count || 0,
      `"${item.createdAt || item.created_at || ''}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
