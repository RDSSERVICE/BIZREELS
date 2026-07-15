const Listing = require('../models/Listing');
const User = require('../models/User');
const { serializeListing } = require('./listing.service');

const listingSeo = async (slug, baseUrl) => {
  const doc = await Listing.findOne({ slug, isDeleted: { $ne: true }, status: 'active' });
  if (!doc) {
    return {
      title: "Emergent · India's local social commerce",
      description: 'Discover local. Chat direct. Deal fair.',
      image: null,
      url: `${baseUrl}/listing/${slug}`,
      type: 'product',
    };
  }

  const l = serializeListing(doc);
  const price = l.offer_price !== null && l.offer_price !== undefined ? l.offer_price : l.price;
  const descBits = [];

  if (l.description) {
    descBits.push(l.description.slice(0, 140));
  } else {
    const typeLabel = l.type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    descBits.push(`${typeLabel} · ₹${parseInt(price).toLocaleString('en-IN')} on Emergent`);
  }

  if (l.location) {
    const locStr = [l.location.area || '', l.location.city || ''].filter(Boolean).join(', ');
    if (locStr) descBits.push(locStr);
  }

  const cover = l.images && l.images.length > 0 ? l.images[0].url : null;

  return {
    title: `${l.title} · ₹${parseInt(price).toLocaleString('en-IN')} · Emergent`,
    description: descBits.filter(Boolean).join(' · '),
    image: cover,
    url: `${baseUrl}/listing/${slug}`,
    type: 'product',
  };
};

const buildSitemap = async (baseUrl) => {
  const listings = await Listing.find(
    { is_deleted: { $ne: true }, status: 'active' },
    { slug: 1, updated_at: 1 }
  ).limit(5000);

  const vendors = await User.find(
    { is_deleted: { $ne: true }, roles: 'vendor' },
    { _id: 1, updated_at: 1 }
  ).limit(2000);

  const formatUrl = (loc, lastmod = null) => {
    const lm = lastmod ? `<lastmod>${lastmod}</lastmod>` : '';
    return `<url><loc>${loc}</loc>${lm}</url>`;
  };

  const entries = [
    formatUrl(`${baseUrl}/`),
    formatUrl(`${baseUrl}/browse`),
  ];

  for (const l of listings) {
    entries.push(formatUrl(`${baseUrl}/listing/${l.slug}`, l.updated_at || l.created_at));
  }
  for (const v of vendors) {
    entries.push(formatUrl(`${baseUrl}/vendor/${v._id.toString()}`, v.updated_at || v.created_at));
  }

  const body = entries.join('');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    `${body}` +
    '</urlset>'
  );
};

module.exports = {
  listingSeo,
  buildSitemap,
};
