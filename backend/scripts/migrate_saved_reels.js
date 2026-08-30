const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bizreels';

async function migrateSavedReels() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri.split('@').pop());

    const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
    const Reel = mongoose.model('Reel', new mongoose.Schema({}, { strict: false }));
    const Listing = mongoose.model('Listing', new mongoose.Schema({}, { strict: false }));
    const Interaction = mongoose.model('Interaction', new mongoose.Schema({}, { strict: false }));

    const users = await User.find({ 'customerProfile.savedListings.0': { $exists: true } }).lean();
    console.log(`Auditing ${users.length} users with saved items...`);

    let migratedReelsCount = 0;

    for (const u of users) {
      const savedListings = u.customerProfile?.savedListings || [];
      const validListingIds = [];
      const foundReelIds = [];

      for (const idObj of savedListings) {
        const idStr = idObj.toString();
        const isReel = await Reel.exists({ _id: idStr });
        if (isReel) {
          foundReelIds.push(idStr);
        } else {
          validListingIds.push(idStr);
        }
      }

      if (foundReelIds.length > 0) {
        console.log(`User ${u._id} (${u.name || u.email}): Found ${foundReelIds.length} reels in savedListings array! Migrating...`);

        // Add to savedReels & remove from savedListings
        await User.updateOne(
          { _id: u._id },
          {
            $set: { 'customerProfile.savedListings': validListingIds },
            $addToSet: { 'customerProfile.savedReels': { $each: foundReelIds } }
          }
        );

        // Ensure Interaction save_reel records exist
        for (const rId of foundReelIds) {
          const exists = await Interaction.exists({ user_id: u._id.toString(), reel_id: rId, type: 'save_reel' });
          if (!exists) {
            await Interaction.create({
              user_id: u._id.toString(),
              reel_id: rId,
              type: 'save_reel',
            });
          }
          migratedReelsCount++;
        }
      }
    }

    console.log(`🎉 SUCCESS: Migrated ${migratedReelsCount} saved reel records to customerProfile.savedReels!`);
    mongoose.disconnect();
  } catch (err) {
    console.error('Error migrating saved reels:', err);
    process.exit(1);
  }
}

migrateSavedReels();
