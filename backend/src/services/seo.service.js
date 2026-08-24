const mongoose = require('mongoose');
const Listing = require('../models/Listing');
const User = require('../models/User');
const Category = require('../models/Category');

const formatIsoDate = (date) => {
  if (!date) return new Date().toISOString().split('T')[0];
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
};

const formatUrlEntry = (loc, lastmod = null, changefreq = 'weekly', priority = '0.8') => {
  const lm = lastmod ? `<lastmod>${formatIsoDate(lastmod)}</lastmod>` : `<lastmod>${formatIsoDate()}</lastmod>`;
  return `<url><loc>${loc}</loc>${lm}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
};

/**
 * Generates SEO metadata for dynamic listing pages.
 */
const listingSeo = async (idOrSlug, baseUrl = 'https://bizreels.in') => {
  const cleanBase = (baseUrl || 'https://bizreels.in').replace(/\/+$/, '');
  let query = {
    $and: [
      { isDeleted: { $ne: true }, is_deleted: { $ne: true } },
      { status: { $in: ['published', 'active'] } }
    ]
  };

  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    query.$and.push({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] });
  } else {
    query.$and.push({ slug: idOrSlug });
  }

  const doc = await Listing.findOne(query).populate('vendor', 'name shop_name business_name city').lean();
  if (!doc) {
    return {
      title: "BizReels — Watch. Discover. Shop.",
      description: "Discover local vendors, chat direct, deal fair. India's first reels commerce platform.",
      image: 'https://bizreels.in/logo.png',
      url: `${cleanBase}/customer/search`,
      type: 'website',
    };
  }

  const price = doc.sellingPrice || doc.salePrice || doc.price || 0;
  const vendorName = doc.vendor?.shop_name || doc.vendor?.business_name || doc.vendor?.name || 'Local Vendor';
  const desc = doc.description
    ? doc.description.slice(0, 155)
    : `${doc.title} by ${vendorName} available on BizReels. Price: ₹${Number(price).toLocaleString('en-IN')}`;

  const image = (Array.isArray(doc.images) && doc.images[0]) || (Array.isArray(doc.photos) && doc.photos[0]) || 'https://bizreels.in/logo.png';
  const canonicalUrl = `${cleanBase}/customer/listings/${doc._id.toString()}`;

  return {
    title: `${doc.title} — ${vendorName} | BizReels`,
    description: desc,
    image,
    url: canonicalUrl,
    type: doc.type === 'service' ? 'website' : 'product',
  };
};

/**
 * Builds the complete sitemap containing all public static, listing, and vendor URLs.
 */
const buildFullSitemap = async (baseUrl = 'https://bizreels.in') => {
  const cleanBase = (baseUrl || 'https://bizreels.in').replace(/\/+$/, '');

  // 1. Static Public Pages
  const entries = [
    formatUrlEntry(`${cleanBase}/`, new Date(), 'daily', '1.0'),
    formatUrlEntry(`${cleanBase}/about`, new Date(), 'monthly', '0.7'),
    formatUrlEntry(`${cleanBase}/local-reels`, new Date(), 'daily', '0.9'),
    formatUrlEntry(`${cleanBase}/creator-marketplace`, new Date(), 'daily', '0.9'),
    formatUrlEntry(`${cleanBase}/customer/search`, new Date(), 'daily', '0.9'),
  ];

  // 2. Public Active Categories
  try {
    const categories = await Category.find(
      { is_deleted: { $ne: true }, is_active: { $ne: false } },
      { name: 1, slug: 1, updated_at: 1 }
    ).lean();

    for (const c of categories) {
      const catUrl = `${cleanBase}/customer/search?category=${encodeURIComponent(c.name)}`;
      entries.push(formatUrlEntry(catUrl, c.updated_at || c.created_at, 'weekly', '0.8'));
    }
  } catch (err) {
    console.warn('Sitemap category fetch error:', err);
  }

  // 3. Active, Published Listings (excluding soft deleted)
  try {
    const listings = await Listing.find(
      {
        isDeleted: { $ne: true },
        is_deleted: { $ne: true },
        status: { $in: ['published', 'active'] },
      },
      { _id: 1, slug: 1, updatedAt: 1, updated_at: 1, createdAt: 1, created_at: 1 }
    )
      .sort({ updatedAt: -1 })
      .limit(10000)
      .lean();

    for (const l of listings) {
      const url = `${cleanBase}/customer/listings/${l._id.toString()}`;
      const lastmod = l.updatedAt || l.updated_at || l.createdAt || l.created_at;
      entries.push(formatUrlEntry(url, lastmod, 'weekly', '0.8'));
    }
  } catch (err) {
    console.warn('Sitemap listings fetch error:', err);
  }

  // 4. Verified Active Vendors (excluding soft deleted)
  try {
    const vendors = await User.find(
      {
        is_deleted: { $ne: true },
        is_active: { $ne: false },
        $or: [{ roles: 'vendor' }, { current_role: 'vendor' }, { activeRole: 'vendor' }],
      },
      { _id: 1, updated_at: 1, created_at: 1 }
    )
      .sort({ updated_at: -1 })
      .limit(5000)
      .lean();

    for (const v of vendors) {
      const url = `${cleanBase}/customer/vendor/${v._id.toString()}`;
      const lastmod = v.updated_at || v.created_at;
      entries.push(formatUrlEntry(url, lastmod, 'weekly', '0.7'));
    }
  } catch (err) {
    console.warn('Sitemap vendors fetch error:', err);
  }

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    entries.join('\n') +
    '\n</urlset>'
  );
};

/**
 * Builds a Sitemap Index XML for scalable chunked sitemaps.
 */
const buildSitemapIndex = (baseUrl = 'https://bizreels.in') => {
  const cleanBase = (baseUrl || 'https://bizreels.in').replace(/\/+$/, '');
  const now = formatIsoDate();

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `  <sitemap><loc>${cleanBase}/sitemap.xml</loc><lastmod>${now}</lastmod></sitemap>\n` +
    `  <sitemap><loc>${cleanBase}/api/v1/seo/sitemap-listings.xml</loc><lastmod>${now}</lastmod></sitemap>\n` +
    `  <sitemap><loc>${cleanBase}/api/v1/seo/sitemap-vendors.xml</loc><lastmod>${now}</lastmod></sitemap>\n` +
    '</sitemapindex>'
  );
};

module.exports = {
  listingSeo,
  buildSitemap: buildFullSitemap,
  buildFullSitemap,
  buildSitemapIndex,
};
