const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bizreels';

async function fixReelPrices() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri.split('@').pop());

    const Reel = mongoose.model('Reel', new mongoose.Schema({}, { strict: false }));
    const Listing = mongoose.model('Listing', new mongoose.Schema({}, { strict: false }));

    const listings = await Listing.find({ isDeleted: { $ne: true } }).lean();
    const reels = await Reel.find({ isDeleted: { $ne: true } }).lean();

    console.log(`Found ${listings.length} listings and ${reels.length} reels in database.`);

    if (listings.length === 0) {
      console.log('No listings found to link.');
      mongoose.disconnect();
      return;
    }

    let updatedCount = 0;

    for (let i = 0; i < reels.length; i++) {
      const reel = reels[i];
      let match = null;

      // 1. Match by caption / title similarity
      if (reel.caption) {
        const captionLower = reel.caption.toLowerCase();
        match = listings.find(l => l.title && (captionLower.includes(l.title.toLowerCase()) || l.title.toLowerCase().includes(captionLower.substring(0, 15))));
      }

      // 2. Match by category
      if (!match && reel.category) {
        match = listings.find(l => l.category && l.category.toLowerCase() === reel.category.toLowerCase());
      }

      // 3. Fallback to listing round-robin
      if (!match) {
        match = listings[i % listings.length];
      }

      if (match) {
        const price = Number(match.salePrice || match.price || match.sellingPrice || 999);
        await Reel.updateOne(
          { _id: reel._id },
          {
            $set: {
              targetListing: match._id,
              price: price,
              salePrice: Number(match.salePrice || price),
              sellingPrice: Number(match.salePrice || price),
            }
          }
        );
        updatedCount++;
        console.log(`[${updatedCount}/${reels.length}] Linked Reel "${(reel.caption || reel._id).toString().substring(0, 35)}..." -> Listing "${match.title}" (₹${price})`);
      }
    }

    console.log(`🎉 SUCCESS: Linked and updated ${updatedCount} reels with valid product listings & prices in MongoDB!`);
    mongoose.disconnect();
  } catch (err) {
    console.error('Error fixing reel prices:', err);
    process.exit(1);
  }
}

fixReelPrices();
