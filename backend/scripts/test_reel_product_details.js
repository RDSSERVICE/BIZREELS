const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Reel = require('../src/models/Reel');
const reelService = require('../src/services/reelService');

async function testReelProductDetails() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const sampleReel = await Reel.findOne({ isDeleted: { $ne: true } }).lean();

    if (!sampleReel) {
      console.log('No reels found in MongoDB.');
      mongoose.disconnect();
      return;
    }

    console.log(`Testing getReelProductDetails for Reel ID: ${sampleReel._id}...`);
    const details = await reelService.getReelProductDetails(sampleReel._id.toString());

    console.log('=== API RESPONSE PAYLOAD SUMMARY ===');
    console.log('Reel ID:', details.reel.id);
    console.log('Reel Caption:', details.reel.caption);
    console.log('Product ID:', details.product.id);
    console.log('Product Title:', details.product.title);
    console.log('Product Price: ₹', details.product.price);
    console.log('Product Sale Price: ₹', details.product.salePrice);
    console.log('Product MRP: ₹', details.product.mrp);
    console.log('Product Discount:', details.product.discountPercent + '%');
    console.log('Vendor Name:', details.vendor.name);
    console.log('Vendor Phone:', details.vendor.phone);

    mongoose.disconnect();
  } catch (err) {
    console.error('Error testing getReelProductDetails:', err);
    process.exit(1);
  }
}

testReelProductDetails();
