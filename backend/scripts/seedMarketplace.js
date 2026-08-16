const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding marketplace...');

    const User = require('../src/models/User');
    const Category = require('../src/models/Category');
    const Listing = require('../src/models/Listing');
    const Reel = require('../src/models/Reel');

    // 1. Seed Categories
    const initialCategories = [
      { name: 'Furniture', slug: 'furniture', category_type: 'product' },
      { name: 'Digital Marketing', slug: 'digital-marketing', category_type: 'service' },
      { name: 'Solar & Energy', slug: 'solar-energy', category_type: 'service' },
      { name: 'Home & Living', slug: 'home-living', category_type: 'product' },
      { name: 'Corporate Gifts', slug: 'corporate-gifts', category_type: 'product' },
      { name: 'Electronics', slug: 'electronics', category_type: 'product' },
      { name: 'Automotive', slug: 'automotive', category_type: 'service' }
    ];

    for (const cat of initialCategories) {
      await Category.findOneAndUpdate(
        { slug: cat.slug },
        { ...cat, is_active: true, is_deleted: false },
        { upsert: true, new: true }
      );
    }
    console.log('Categories seeded.');

    // 2. Ensure a sample verified vendor
    let vendor = await User.findOne({ email: 'vendor.demo@bizreels.in' });
    if (!vendor) {
      vendor = await User.create({
        name: 'ErgoComfort & Solutions',
        email: 'vendor.demo@bizreels.in',
        phone: '9876543210',
        role: 'vendor',
        roles: ['vendor'],
        business_name: 'ErgoComfort India Pvt Ltd',
        business_type: 'Pvt Ltd',
        is_verified: true,
        verificationStatus: 'verified',
        password_hash: '$2a$10$abcdef1234567890abcdef1234567890'
      });
    }

    // 3. Seed Sample Listings
    const sampleListings = [
      {
        vendor: vendor._id,
        type: 'product',
        title: 'ErgoComfort Executive High-Back Mesh Chair',
        shortDescription: 'Ergonomic lumbar support chair with 3D armrests',
        description: 'Premium ergonomic mesh chair for long working hours with adjustable neck rest and synchro tilt mechanism.',
        category: 'Furniture',
        subcategory: 'Office Chairs',
        price: 12999,
        salePrice: 10499,
        images: ['https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&fit=crop'],
        views: 3420,
        orders_count: 145,
        saves_count: 89,
        isBoosted: true,
        status: 'published'
      },
      {
        vendor: vendor._id,
        type: 'service',
        title: 'Full Stack Social Media & Reel Marketing',
        shortDescription: 'End-to-end viral reel strategy & lead generation',
        description: 'Complete monthly Instagram, YouTube Shorts, and BizReels video marketing package tailored for local brands.',
        category: 'Digital Marketing',
        subcategory: 'Video Ads',
        price: 24999,
        salePrice: 19999,
        images: ['https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&fit=crop'],
        views: 2890,
        orders_count: 98,
        saves_count: 120,
        isBoosted: true,
        status: 'published'
      },
      {
        vendor: vendor._id,
        type: 'service',
        title: '5kW On-Grid Solar Rooftop System Installation',
        shortDescription: 'Save up to 90% on monthly electricity bills',
        description: 'Complete MNRE approved solar panel installation with net metering setup and 25-year panel warranty.',
        category: 'Solar & Energy',
        subcategory: 'Rooftop Solar',
        price: 220000,
        salePrice: 195000,
        images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&fit=crop'],
        views: 4120,
        orders_count: 165,
        saves_count: 210,
        isBoosted: true,
        status: 'published'
      },
      {
        vendor: vendor._id,
        type: 'product',
        title: 'Modular Kitchen German Soft-Close Fittings',
        shortDescription: 'Customized L-Shape & U-Shape Modular Kitchens',
        description: 'Waterproof plywood modular kitchen setups with marine grade acrylic finish and Hafele hardware.',
        category: 'Home & Living',
        subcategory: 'Modular Kitchen',
        price: 180000,
        salePrice: 155000,
        images: ['https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&fit=crop'],
        views: 1950,
        orders_count: 76,
        saves_count: 95,
        isBoosted: false,
        status: 'published'
      },
      {
        vendor: vendor._id,
        type: 'product',
        title: 'Custom Luxury Corporate Gift Hampers',
        shortDescription: 'Bespoke corporate hampers for clients & staff',
        description: 'Curated premium hampers featuring dry fruits, artisanal chocolates, leather diary, and custom branding.',
        category: 'Corporate Gifts',
        subcategory: 'Festive Hampers',
        price: 1499,
        salePrice: 1199,
        images: ['https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&fit=crop'],
        views: 1640,
        orders_count: 230,
        saves_count: 140,
        isBoosted: false,
        status: 'published'
      }
    ];

    for (const listingData of sampleListings) {
      await Listing.findOneAndUpdate(
        { title: listingData.title },
        listingData,
        { upsert: true, new: true }
      );
    }
    console.log('Sample published listings seeded.');

  } catch (err) {
    console.error('Seeding failed:', err);
  }
}

if (require.main === module) {
  seed().then(() => process.exit(0));
}

module.exports = { seedMarketplaceData: seed };
