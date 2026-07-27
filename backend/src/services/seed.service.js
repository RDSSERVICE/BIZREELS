const Listing = require('../models/Listing');
const User = require('../models/User');
const Category = require('../models/Category');
const slugify = require('slugify');
const logger = require('../utils/logger');

const SAMPLE_REELS = [
  {
    url: 'https://res.cloudinary.com/demo/video/upload/samples/sea-turtle.mp4',
    duration: 15,
    title: 'Handmade Kolhapuri Chappals',
    type: 'new_product',
    price: 899,
    offer_price: 699,
    area: 'Kolhapur',
    city: 'Kolhapur',
    pincode: '416001',
    state: 'Maharashtra',
  },
  {
    url: 'https://res.cloudinary.com/demo/video/upload/samples/dance-2.mp4',
    duration: 12,
    title: 'Bridal Mehendi — Home Visit',
    type: 'service',
    price: 2500,
    area: 'Andheri',
    city: 'Mumbai',
    pincode: '400058',
    state: 'Maharashtra',
  },
  {
    url: 'https://res.cloudinary.com/demo/video/upload/samples/cld-sample-video.mp4',
    duration: 10,
    title: 'Retro Vespa 2019 — Excellent Condition',
    type: 'old_product',
    price: 78000,
    offer_price: 74000,
    area: 'Koramangala',
    city: 'Bengaluru',
    pincode: '560034',
    state: 'Karnataka',
  },
  {
    url: 'https://res.cloudinary.com/demo/video/upload/samples/elephants.mp4',
    duration: 18,
    title: 'Home-cooked Tiffin Service',
    type: 'service',
    price: 3500,
    area: 'Indiranagar',
    city: 'Bengaluru',
    pincode: '560038',
    state: 'Karnataka',
  },
];

const seedReels = async () => {
  const count = await Listing.countDocuments({ reel: { $ne: null }, is_deleted: { $ne: true } });
  if (count >= 3) {
    return;
  }

  // Find a vendor
  let vendor = await User.findOne({ roles: 'vendor', is_deleted: { $ne: true } });
  if (!vendor) {
    vendor = await User.findOne({ is_deleted: { $ne: true } });
  }
  if (!vendor) {
    logger.info('seedReels: no user found, skipping');
    return;
  }

  const vendorId = vendor._id.toString();
  // Ensure vendor role exists
  if (!vendor.roles.includes('vendor')) {
    await User.updateOne({ _id: vendor._id }, { $addToSet: { roles: 'vendor' } });
  }

  const cat = await Category.findOne({ parent_id: null, is_deleted: { $ne: true } });
  if (!cat) {
    logger.info('seedReels: no category found, skipping');
    return;
  }
  const catId = cat._id.toString();

  const now = new Date().toISOString();
  for (const s of SAMPLE_REELS) {
    const slugBase = slugify(s.title, { lower: true }).slice(0, 60);
    let slug = slugBase;
    let i = 1;
    while (await Listing.findOne({ slug })) {
      i++;
      slug = `${slugBase}-${i}`;
    }

    const listingData = {
      vendor: vendor._id,
      type: s.type === 'service' ? 'service' : 'product',
      title: s.title,
      slug,
      description: `Sample ${s.title} — dev seed for reels demo.`,
      category: cat.name || 'General',
      price: s.price,
      salePrice: s.offer_price || s.price,
      actualPrice: s.price,
      sellingPrice: s.offer_price || s.price,
      condition: s.type === 'new_product' ? 'new' : s.type === 'old_product' ? 'used' : 'not_applicable',
      reel: {
        url: s.url,
        public_id: `samples/${slug}`,
        thumbnail_url: s.url.replace(/\.[^/.]+$/, '.jpg'),
        duration: s.duration,
      },
      location: {
        area: s.area,
        city: s.city,
        state: s.state,
        pincode: s.pincode,
        coordinates: [77.59, 12.97],
        address: `${s.area}, ${s.city}`,
      },
      tags: ['seed', 'reel'],
      status: 'published',
      isDeleted: false,
    };

    if (s.type === 'new_product') {
      listingData.stock = 5;
    }

    await Listing.create(listingData);
  }

  logger.info(`Seeded ${SAMPLE_REELS.length} demo reels`);
};

module.exports = {
  seedReels,
};
