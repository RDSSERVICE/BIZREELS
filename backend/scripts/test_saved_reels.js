const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const User = require('../src/models/User');
const Reel = require('../src/models/Reel');
const Interaction = require('../src/models/Interaction');

async function testSavedReelsFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const sampleUser = await User.findOne().lean();
    const sampleReel = await Reel.findOne({ isDeleted: { $ne: true } }).lean();

    if (!sampleUser || !sampleReel) {
      console.log('User or Reel missing');
      mongoose.disconnect();
      return;
    }

    console.log(`Testing Save Reel for User ${sampleUser._id} & Reel ${sampleReel._id}...`);

    // Save reel
    await User.findByIdAndUpdate(sampleUser._id, {
      $addToSet: { 'customerProfile.savedReels': sampleReel._id }
    });
    await Interaction.updateOne(
      { user_id: sampleUser._id.toString(), reel_id: sampleReel._id.toString(), type: 'save_reel' },
      { user_id: sampleUser._id.toString(), reel_id: sampleReel._id.toString(), type: 'save_reel' },
      { upsert: true }
    );

    // Verify user document
    const updatedUser = await User.findById(sampleUser._id).lean();
    console.log('User savedReels array:', updatedUser.customerProfile?.savedReels);

    // Query saved reels
    const savedInters = await Interaction.find({ user_id: sampleUser._id.toString(), type: 'save_reel' }).lean();
    const savedReelIds = [...new Set([...savedInters.map(i => i.reel_id), ...(updatedUser.customerProfile?.savedReels || []).map(id => id.toString())])];

    const savedReels = await Reel.find({ _id: { $in: savedReelIds } }).lean();
    console.log(`Found ${savedReels.length} saved reel(s) for user!`);
    savedReels.forEach(r => {
      console.log(`  - Reel ID: ${r._id} | Caption: "${(r.caption || '').substring(0, 30)}..." | Price: ₹${r.price}`);
    });

    mongoose.disconnect();
  } catch (err) {
    console.error('Error testing saved reels:', err);
    process.exit(1);
  }
}

testSavedReelsFlow();
