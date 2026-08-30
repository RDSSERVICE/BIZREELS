const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Listing = require('../src/models/Listing');

async function testCartPriceHydration() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const sampleListing = await Listing.findOne({ is_deleted: { $ne: true } }).lean();
    if (!sampleListing) {
      console.log('No listings found.');
      mongoose.disconnect();
      return;
    }

    console.log('Sample Listing Title:', sampleListing.title);
    console.log('  regular price (MRP): ₹', sampleListing.price);
    console.log('  discounted salePrice: ₹', sampleListing.salePrice || sampleListing.sellingPrice);

    const li = sampleListing;
    const discountPriceCandidates = [
      li.salePrice,
      li.sellingPrice,
      li.offer_price,
    ];
    const validDiscountPrice = discountPriceCandidates.map(p => Number(p)).find(p => !isNaN(p) && p > 0);

    const fallbackPriceCandidates = [
      li.price,
      li.rate,
      li.cost,
      li.actualPrice,
      li.regularPrice,
      li.originalPrice,
    ];
    const validFallbackPrice = fallbackPriceCandidates.map(p => Number(p)).find(p => !isNaN(p) && p > 0);

    const priceAfterDiscount = validDiscountPrice || validFallbackPrice || Number(li.salePrice) || Number(li.price) || 0;

    console.log(`✅ Calculated Cart Item Price (After Discount): ₹${priceAfterDiscount}`);
    console.log(`✅ Strikethrough Original MRP: ₹${li.price || priceAfterDiscount}`);

    mongoose.disconnect();
  } catch (err) {
    console.error('Error testing cart hydration:', err);
    process.exit(1);
  }
}

testCartPriceHydration();
